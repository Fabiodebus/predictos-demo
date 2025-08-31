import { NextRequest, NextResponse } from 'next/server';
import { LettaService } from '@/lib/letta-client';
import { MemoryService } from '@/lib/memory-service';
import { cacheService } from '@/lib/cache-service';
import { RetryUtils } from '@/lib/retry-utils';
import { EmailGenerationRequest } from '@/types/campaign';

export async function POST(request: NextRequest) {
  let sessionId: string | null = null;
  
  try {
    const body: EmailGenerationRequest & { sessionId?: string } = await request.json();
    const { campaignData, researchResults } = body;
    sessionId = body.sessionId || cacheService.generateSessionId();

    if (!campaignData || !researchResults) {
      return NextResponse.json(
        { error: 'Campaign data and research results are required' },
        { status: 400 }
      );
    }

    if (!process.env.LETTA_API_KEY || !process.env.LETTA_AGENT_ID) {
      return NextResponse.json(
        { error: 'Letta configuration missing' },
        { status: 500 }
      );
    }

    console.log('🎬 Starting streaming email generation for session:', sessionId);
    
    const lettaService = new LettaService();
    const memoryService = new MemoryService(lettaService.getClient());
    
    // Prepare research content for memory
    const researchContent = researchResults
      .map(result => `Title: ${result.title}\nURL: ${result.url}\nContent: ${result.text.substring(0, 500)}...`)
      .join('\n\n');

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Reset agent state
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Resetting agent state...',
            step: 1,
            totalSteps: 4
          })}\n\n`));

          await RetryUtils.withLettaRetry(
            () => lettaService.resetAgentState(),
            'Agent state reset'
          );

          // Step 2: Update memory
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Updating agent memory with research data...',
            step: 2,
            totalSteps: 4
          })}\n\n`));

          await RetryUtils.withMemoryRetry(
            () => memoryService.updateLeadResearch(lettaService.getAgentId(), researchContent),
            'Memory update'
          );

          // Step 3: Start streaming generation
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Starting email generation...',
            step: 3,
            totalSteps: 4
          })}\n\n`));

          const prompt = lettaService.buildPrompt(campaignData, researchResults);
          const messages: any[] = [];
          let messageCount = 0;

          // Stream messages from Letta
          for await (const message of lettaService.streamEmailGeneration(prompt)) {
            messageCount++;
            messages.push(message);

            // Send each message as SSE
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'message',
              message,
              messageCount,
              sessionId,
              timestamp: new Date().toISOString()
            })}\n\n`));

            // Add small delay to prevent overwhelming the client
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          // Step 4: Cache results and complete
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Caching results...',
            step: 4,
            totalSteps: 4
          })}\n\n`));

          // Cache the messages for later retrieval
          cacheService.setCampaignMessages(sessionId, lettaService.getAgentId(), messages);

          // Send completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            sessionId,
            messageCount,
            totalMessages: messages.length,
            timestamp: new Date().toISOString()
          })}\n\n`));

          console.log(`✅ Streaming complete for session ${sessionId}: ${messages.length} messages`);
          
        } catch (error) {
          console.error('Streaming generation error:', error);
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            sessionId,
            timestamp: new Date().toISOString()
          })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Stream setup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup streaming generation',
        sessionId,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Streaming email generation endpoint',
    usage: 'POST with { campaignData, researchResults, sessionId? } for streaming generation',
    features: [
      'Real-time agent reasoning display',
      'Live typing with token streaming',
      'Memory management with research data',
      'Session-based caching',
      'Automatic retry logic',
      'Server-Sent Events (SSE) format'
    ],
    example: {
      campaignData: {
        linkedinUrl: 'https://linkedin.com/in/example',
        companyDomain: 'example.com',
        // ... other fields
      },
      researchResults: [
        {
          title: 'Example Research',
          url: 'https://example.com',
          text: 'Research content...'
        }
      ]
    }
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}