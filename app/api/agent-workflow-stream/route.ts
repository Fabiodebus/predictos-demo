export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest } from 'next/server';
import { LettaService, textify, extractCampaignJson, mapCampaignToEmails } from '@/lib/letta-client';
import { MemoryService } from '@/lib/memory-service';
import { ExaResearchService } from '@/lib/exa-research-client';
import { cacheService } from '@/lib/cache-service';
import { RetryUtils } from '@/lib/retry-utils';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const {
          searchQuery,
          companyDomain,
          linkedinUrl,
          numberOfEmails = 1,
          numberOfThreads = 1,
          language = 'german',
          formality = 'Sie',
          leadName,
          leadTitle,
          companyName,
        } = body as any;
        
        // Create deterministic cache key
        const normQuery = (searchQuery ?? '').trim().toLowerCase();
        const normDomain = (companyDomain ?? '').trim().toLowerCase();
        const researchKey = `research:${normDomain}:${normQuery}`;
        const sessionId = `session:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🚀 Starting streaming workflow for session: ${sessionId}`);
        console.log(`🔍 Research cache key: ${researchKey}`);
        
        // Helper to send SSE updates to frontend
        const sendUpdate = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };
        
        // Step 1: Research (check cache first)
        sendUpdate({ type: 'status', step: 1, message: 'Checking research cache...' });
        
        const results: any = {
          step1_research: null,
          step2_agent_discovery: null,
          step3_memory_management: null,
          step4_state_reset: null,
          step5_email_generation: null
        };
        
        // Try to get cached research first with deterministic key
        let researchContent = cacheService.getResearchResults(researchKey);
        
        if (!researchContent) {
          sendUpdate({ type: 'status', step: 1, message: 'Starting comprehensive research...' });
          
          const researchService = new ExaResearchService();
          const researchResults = await RetryUtils.withExaRetry(
            () => researchService.performCompanyResearch(searchQuery, companyDomain),
            'Research generation'
          );
          
          researchContent = researchResults.output?.content || '';
          results.step1_research = {
            success: true,
            researchId: researchResults.researchId,
            content: researchContent,
            contentLength: researchContent.length,
            cost: researchResults.costDollars,
            duration: researchResults.finishedAt ? researchResults.finishedAt - researchResults.createdAt : 0
          };
          
          cacheService.setResearchResults(researchKey, researchContent, 30 * 60 * 1000); // 30 minute TTL
        } else {
          sendUpdate({ type: 'status', step: 1, message: 'Using cached research' });
          // Cache hit - populate lightweight result
          results.step1_research = { 
            success: true, 
            fromCache: true, 
            content: researchContent,
            contentLength: researchContent.length 
          };
        }
        
        sendUpdate({ type: 'research_complete', results: results.step1_research });
        
        // Step 2: Initialize Letta services
        sendUpdate({ type: 'status', step: 2, message: 'Connecting to AI agent...' });
        
        const lettaService = new LettaService();
        const memoryService = new MemoryService(lettaService.getClient());
        
        const blocks = await RetryUtils.withMemoryRetry(
          () => memoryService.listBlocks(lettaService.getAgentId()),
          'Agent discovery'
        );
        
        results.step2_agent_discovery = {
          success: true,
          agentName: 'Letta Copywriter',
          memoryBlockCount: blocks.length,
          memoryLabels: blocks.map(b => b.label)
        };
        
        sendUpdate({ type: 'agent_ready', results: results.step2_agent_discovery });
        
        // Step 3: Update memory
        sendUpdate({ type: 'status', step: 3, message: 'Updating agent memory with research...' });
        
        await RetryUtils.withMemoryRetry(
          () => memoryService.updateLeadResearch(lettaService.getAgentId(), researchContent),
          'Memory update'
        );
        
        results.step3_memory_management = {
          success: true,
          blockLabel: 'lead-company-research',
          updated: true
        };
        
        sendUpdate({ type: 'memory_updated', results: results.step3_memory_management });
        
        // Step 4: Reset agent state
        sendUpdate({ type: 'status', step: 4, message: 'Preparing agent for fresh conversation...' });
        
        await RetryUtils.withLettaRetry(
          () => lettaService.resetAgentState(),
          'State reset'
        );
        
        results.step4_state_reset = {
          success: true,
          resetType: 'full reset'
        };
        
        sendUpdate({ type: 'state_reset', results: results.step4_state_reset });
        
        // Step 5: Stream email generation
        sendUpdate({ type: 'status', step: 5, message: 'Agent is analyzing and crafting your email...' });
        
        const campaignData = {
          linkedinUrl: linkedinUrl || '',
          companyDomain: companyDomain || '',
          searchQuery,
          numberOfEmails,
          numberOfThreads,
          language,
          formality,
          leadName,
          leadTitle,
          companyName
        };
        
        const prompt = lettaService.buildPrompt(campaignData, []);
        console.log("🧾 numberOfEmails:", campaignData.numberOfEmails);
        console.log("🧍", campaignData.leadName, campaignData.leadTitle, campaignData.companyName);
        
        let messageCount = 0;
        let accumulatedReasoning = '';
        let accumulatedEmail = '';
        let completed = false;

        const finish = (emails: any[] = [], rawAssistantText = '') => {
          console.log(`🏁 Finishing with ${emails.length} emails, rawText=${rawAssistantText.length}chars`);
          
          // Check if we can parse the campaign
          const canParseCampaign = !!extractCampaignJson(rawAssistantText);
          
          results.step5_email_generation = {
            ...(results.step5_email_generation ?? {}),
            success: emails.length > 0,
            messageCount,
            reasoning: [{ content: accumulatedReasoning }],
            assistantMessages: emails.map(e => ({ subject: e.subject, content: e.body, cta_type: e.cta_type })),
            toolCalls: [],
            campaignData,
            rawAssistantText,
            final_assistant_text: rawAssistantText, // ensure this is available for salvage
            parsed_campaign_ok: canParseCampaign,
            email_count: emails.length
          };
          
          console.log(`📧 Sending final_emails event with ${emails.length} emails`);
          sendUpdate({ type: 'final_emails', emails: emails.map((e, index) => ({ 
            subject: e.subject, 
            body: e.body,
            email_number: index + 1
          })), rawAssistantText });
          
          console.log(`✅ Sending workflow_complete, success=${emails.length > 0}`);
          sendUpdate({ type: 'workflow_complete', success: emails.length > 0, results });
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          completed = true;
        };

        try {
          sendUpdate({ type: 'agent_thinking', message: 'Agent connected and processing...' });

          for await (const message of lettaService.streamEmailGeneration(prompt)) {
            messageCount++;

            // keep-alive
            if ((message as any).messageType === 'ping') {
              sendUpdate({ type: 'ping', t: Date.now() });
              continue;
            }

            if (message.messageType === 'reasoning_message') {
              const r = textify(message.content ?? (message as any).reasoning);
              if (r) {
                accumulatedReasoning = r; // generator is cumulative
                sendUpdate({ type: 'reasoning_step', content: accumulatedReasoning, timestamp: message.timestamp });
              }
            } else if (message.messageType === 'assistant_message') {
              const a = textify(message.content);
              if (a) {
                accumulatedEmail = a; // generator is cumulative
                sendUpdate({ type: 'email_generated', content: accumulatedEmail });
              }
            }
          }

          // parse server-side - try each source independently (don't join!)
          console.log(`📊 Final extraction: email=${accumulatedEmail.length}chars, reasoning=${accumulatedReasoning.length}chars`);
          
          const parsed =
            extractCampaignJson(accumulatedEmail) || 
            extractCampaignJson(accumulatedReasoning) ||
            extractCampaignJson([accumulatedEmail, accumulatedReasoning].filter(Boolean).join('\n')); // fallback join only if needed
          
          const emails = parsed ? mapCampaignToEmails(parsed) : [];
          console.log(`🧩 Extracted ${emails.length} emails from campaign JSON`);
          finish(emails, accumulatedEmail);

        } catch (err: any) {
          // surface error
          sendUpdate({
            type: 'workflow_error',
            phase: 'stream_loop',
            error: err?.message || String(err),
            stack: (err?.stack || '').split('\n').slice(0, 3).join('\n'),
          });

          // last-resort: non-stream fallback so UI still gets emails
          try {
            const resp = await lettaService.generateEmail(prompt);
            const assistantText = textify(resp.messages.find(m => m.messageType === 'assistant_message')?.content || '');
            const parsed =
              extractCampaignJson(assistantText) ||
              extractCampaignJson(resp.messages.find(m => m.messageType === 'reasoning_message')?.content || '');
            const emails = parsed ? mapCampaignToEmails(parsed) : [];
            finish(emails, assistantText);
          } catch (fallbackErr: any) {
            sendUpdate({
              type: 'workflow_error',
              phase: 'fallback_non_stream',
              error: fallbackErr?.message || String(fallbackErr),
              stack: (fallbackErr?.stack || '').split('\n').slice(0, 3).join('\n'),
            });
          }
        } finally {
          if (!completed) {
            // ensure UI exits the "busy" state even if both paths failed
            sendUpdate({ type: 'workflow_complete', success: false, results });
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          }
        }
        
        controller.close();
        
      } catch (error) {
        console.error('❌ Streaming workflow failed:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'fatal_error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })}\n\n`));
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}