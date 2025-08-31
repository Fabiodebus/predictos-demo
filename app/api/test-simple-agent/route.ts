import { NextRequest, NextResponse } from 'next/server';
import { LettaService } from '@/lib/letta-client';

export async function POST() {
  try {
    console.log('🧪 Testing simple agent message with timeout tracking...');
    
    const lettaService = new LettaService();
    
    // Step 1: Reset agent state first
    console.log('Step 1: Resetting agent state...');
    await lettaService.resetAgentState();
    
    // Step 2: Send a very simple test message
    console.log('Step 2: Sending simple test message...');
    const startTime = Date.now();
    
    const simplePrompt = JSON.stringify({
      campaign_information: {
        number_threads: "1",
        number_emails: "1", 
        language: "english",
        formality: "professional"
      },
      lead_information: {
        lead_name: "Test",
        lead_surname: "User",
        lead_default_position_title: "CEO",
        employer: "Test Company",
        lead_current_title: "CEO",
        lead_company_domain: "test.com",
        lead_company_name: "Test Company",
        linkedin_url: "https://linkedin.com/in/test"
      }
    }, null, 2);
    
    // Add manual timeout tracking
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Manual timeout after 30 seconds')), 30000);
    });
    
    const apiCall = lettaService.generateEmail(simplePrompt);
    
    const response = await Promise.race([apiCall, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Agent responded successfully in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      duration: duration,
      messageCount: response.messages.length,
      reasoning: response.messages.filter(m => m.messageType === 'reasoning_message').length,
      assistant: response.messages.filter(m => m.messageType === 'assistant_message').length,
      firstReasoningContent: response.messages.find(m => m.messageType === 'reasoning_message')?.content?.substring(0, 200),
      firstAssistantContent: response.messages.find(m => m.messageType === 'assistant_message')?.content?.substring(0, 200)
    });
    
  } catch (error) {
    const duration = Date.now();
    console.error('❌ Simple agent test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: duration,
      timeout: error instanceof Error && error.message.includes('timeout')
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to test simple agent message generation',
    usage: 'POST /api/test-simple-agent'
  });
}