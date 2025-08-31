import { NextRequest, NextResponse } from 'next/server';
import { LettaService } from '@/lib/letta-client';
import { MemoryService } from '@/lib/memory-service';

export async function POST() {
  try {
    console.log('🧪 Testing Letta email generation with fixes...');
    
    // Initialize services
    const lettaService = new LettaService();
    const memoryService = new MemoryService(lettaService.getClient());
    
    // Test 1: Update memory with test research
    console.log('Step 1: Updating memory with test research...');
    const testResearch = 'Test company research data for Anthropic - AI safety company founded in 2021, working on helpful, harmless, and honest AI systems.';
    await memoryService.updateLeadResearch(lettaService.getAgentId(), testResearch);
    
    // Test 2: Reset agent state
    console.log('Step 2: Resetting agent state...');
    await lettaService.resetAgentState();
    
    // Test 3: Generate email
    console.log('Step 3: Generating test email...');
    const testCampaign = {
      linkedinUrl: 'https://linkedin.com/in/test',
      companyDomain: 'anthropic.com',
      searchQuery: 'AI safety research',
      numberOfEmails: 1,
      numberOfThreads: 1,
      language: 'english',
      formality: 'professional'
    };
    
    const testResults = [{
      title: 'Test Research',
      url: 'https://anthropic.com',
      text: testResearch
    }];
    
    const prompt = lettaService.buildPrompt(testCampaign, testResults);
    const response = await lettaService.generateEmail(prompt);
    
    console.log('✅ All tests passed!');
    
    // Log the full response structure
    console.log('=== FULL LETTA RESPONSE ===');
    console.log('Response messages:', response.messages);
    response.messages.forEach((msg, index) => {
      console.log(`Message ${index}:`, {
        id: msg.id,
        role: msg.role,
        messageType: msg.messageType,
        content: msg.content,
        contentType: typeof msg.content,
        isArray: Array.isArray(msg.content)
      });
    });
    
    return NextResponse.json({
      success: true,
      message: 'Letta email generation working correctly',
      fullResponse: {
        messages: response.messages,
        usage: response.usage
      },
      summary: {
        memoryUpdated: true,
        stateReset: true,
        emailGenerated: true,
        messageCount: response.messages.length,
        reasoning: response.messages.filter(m => m.messageType === 'reasoning_message').length,
        assistantMessages: response.messages.filter(m => m.messageType === 'assistant_message').length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Letta email test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Letta email generation with SDK fixes',
    usage: 'POST to test complete email generation pipeline',
    tests: [
      'Memory block update',
      'Agent state reset', 
      'Email generation with reasoning',
      'Message type parsing'
    ]
  });
}