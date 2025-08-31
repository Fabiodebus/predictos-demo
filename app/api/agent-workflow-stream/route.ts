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
        
        const reasoningMessages: any[] = [];
        const assistantMessages: any[] = [];
        let messageCount = 0;
        let accumulatedReasoning = '';
        let accumulatedEmail = '';
        
        try {
          // Send agent start
          sendUpdate({ type: 'agent_thinking', message: 'Agent connected and processing...' });
          
          // Use streaming generation
          for await (const message of lettaService.streamEmailGeneration(prompt)) {
            messageCount++;
            
            // Handle ping events for keep-alive (cast to any to handle ping type)
            if ((message as any).messageType === 'ping') {
              sendUpdate({ type: 'ping', t: Date.now() });
              continue;
            }
            
            if (message.messageType === 'reasoning_message') {
              // Use textified content from stream (generator already accumulates)
              const rDelta = textify(message.content ?? message.reasoning);
              if (rDelta) {
                accumulatedReasoning = rDelta; // Generator already accumulates, just assign
                sendUpdate({ 
                  type: 'reasoning_step', 
                  step: 1,
                  content: accumulatedReasoning,
                  timestamp: message.timestamp
                });
              }
            } else if (message.messageType === 'assistant_message') {
              // Use textified content from stream (generator already accumulates)
              const aDelta = textify(message.content);
              if (aDelta) {
                accumulatedEmail = aDelta; // Generator already accumulates, just assign
                sendUpdate({ 
                  type: 'email_generated',
                  content: accumulatedEmail
                });
              }
            }
          }
          
          // Combine all sources for robust parsing
          const fullTranscript = [accumulatedEmail, accumulatedReasoning].filter(Boolean).join("\n");
          
          // Log for debugging
          console.log('🔍 Final accumulated email:', {
            first200: accumulatedEmail?.slice(0, 200),
            last200: accumulatedEmail?.slice(-200),
            length: accumulatedEmail?.length
          });
          console.log('🔍 Final accumulated reasoning:', {
            first200: accumulatedReasoning?.slice(0, 200),
            last200: accumulatedReasoning?.slice(-200),
            length: accumulatedReasoning?.length
          });
          
          // Try tolerant parsing on multiple sources
          const parsed = 
            extractCampaignJson(fullTranscript) ||
            extractCampaignJson(accumulatedEmail) ||
            extractCampaignJson(accumulatedReasoning);
          
          const emails = parsed ? mapCampaignToEmails(parsed) : [];
          
          console.log('🧩 Parsing results:', {
            parsed: !!parsed,
            emailCount: emails.length,
            willFallbackToRaw: emails.length === 0
          });
          
          results.step5_email_generation = {
            success: emails.length > 0,
            messageCount,
            reasoning: [{ content: accumulatedReasoning }],
            assistantMessages: emails.map(e => ({ 
              subject: e.subject, 
              content: e.body,
              cta_type: e.cta_type
            })),
            toolCalls: [],
            campaignData,
            rawAssistantText: accumulatedEmail,      // For UI fallback
            rawTranscript: fullTranscript,           // For UI fallback
            final_assistant_text: accumulatedEmail   // Legacy support
          };
          
          // NEW: Canonical event the UI can trust
          sendUpdate({ 
            type: 'final_emails', 
            emails: emails.map((e, index) => ({ 
              subject: e.subject, 
              body: e.body,
              email_number: index + 1
            })),
            rawAssistantText: accumulatedEmail 
          });
          
          // Send final completion
          sendUpdate({ 
            type: 'workflow_complete',
            success: emails.length > 0,
            results
          });
          
          // Add terminal frame before closing
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          
        } catch (error) {
          console.error('❌ Streaming email generation failed:', error);
          results.step5_email_generation = {
            success: false,
            error: error instanceof Error ? error.message : 'Streaming failed',
            messageCount: 0,
            reasoning: reasoningMessages,
            assistantMessages,
            toolCalls: []
          };
          
          sendUpdate({ 
            type: 'workflow_error',
            error: error instanceof Error ? error.message : 'Unknown error',
            results
          });
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