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

    // Check cache first
    const cachedResponse = cacheService.getCampaignResponse(sessionId, process.env.LETTA_AGENT_ID);
    if (cachedResponse) {
      console.log('✅ Returning cached response for session:', sessionId);
      return NextResponse.json({
        success: true,
        messages: cachedResponse.messages,
        usage: cachedResponse.usage,
        fromCache: true,
        sessionId
      });
    }

    console.log('🚀 Starting new email generation for session:', sessionId);
    
    const lettaService = new LettaService();
    const memoryService = new MemoryService(lettaService.getClient());
    
    // Step 1: Reset agent state
    await RetryUtils.withLettaRetry(
      () => lettaService.resetAgentState(),
      'Agent state reset'
    );

    // Step 2: Update memory with research
    const researchContent = researchResults
      .map(result => `Title: ${result.title}\nURL: ${result.url}\nContent: ${result.text.substring(0, 500)}...`)
      .join('\n\n');
    
    await RetryUtils.withMemoryRetry(
      () => memoryService.updateLeadResearch(lettaService.getAgentId(), researchContent),
      'Memory update'
    );

    // Step 3: Generate email with retry
    const prompt = lettaService.buildPrompt(campaignData, researchResults);
    const response = await RetryUtils.withLettaRetry(
      () => lettaService.generateEmail(prompt),
      'Email generation'
    );

    // Step 4: Cache the response
    cacheService.setCampaignResponse(sessionId, lettaService.getAgentId(), response);
    
    console.log('✅ Email generation complete for session:', sessionId);

    return NextResponse.json({
      success: true,
      messages: response.messages,
      usage: response.usage,
      sessionId
    });

  } catch (error) {
    console.error('Generate API error:', error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Letta authentication failed. Check your API key and agent ID.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('agent') && error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Letta agent not found. Please check your agent ID.' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate email. Please try again.' },
      { status: 500 }
    );
  }
}

// Streaming endpoint for real-time generation
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');
  const agentId = searchParams.get('agentId') || process.env.LETTA_AGENT_ID;
  
  if (!sessionId || !agentId) {
    return NextResponse.json(
      { 
        error: 'Missing sessionId or agentId parameters',
        usage: 'GET /api/generate?sessionId=xxx&agentId=xxx for streaming'
      },
      { status: 400 }
    );
  }

  try {
    // Check if we have cached messages from streaming
    const cachedMessages = cacheService.getCampaignMessages(sessionId, agentId);
    
    if (cachedMessages) {
      console.log('📨 Returning cached streaming messages for session:', sessionId);
      
      // Create a readable stream to simulate Server-Sent Events
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send cached messages as SSE events
          cachedMessages.forEach((message, index) => {
            const sseData = `data: ${JSON.stringify({
              type: 'message',
              message,
              index,
              total: cachedMessages.length,
              fromCache: true
            })}\\n\\n`;
            
            controller.enqueue(encoder.encode(sseData));
          });
          
          // Send completion event
          const completeData = `data: ${JSON.stringify({
            type: 'complete',
            sessionId,
            messageCount: cachedMessages.length,
            fromCache: true
          })}\\n\\n`;
          
          controller.enqueue(encoder.encode(completeData));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return NextResponse.json(
      { 
        error: 'No cached streaming data found for this session',
        sessionId,
        suggestion: 'Use POST /api/generate-stream to start a new streaming session'
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Streaming endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve streaming data' },
      { status: 500 }
    );
  }
}