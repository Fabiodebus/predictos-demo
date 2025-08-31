import { NextResponse } from 'next/server';
import { LettaService } from '@/lib/letta-client';

export async function GET() {
  try {
    console.log('=== Testing Fixed Letta Client ===');
    
    // Test 1: Client Initialization
    console.log('1. Testing client initialization...');
    const lettaService = new LettaService();
    console.log('✅ Client initialized successfully');
    
    // Test 2: Basic message creation
    console.log('2. Testing basic message creation...');
    const testPrompt = "Hello, this is a test message. Please respond with a simple greeting.";
    
    try {
      const response = await lettaService.generateEmail(testPrompt);
      console.log('✅ Message creation successful');
      console.log('Response messages count:', response.messages.length);
      console.log('Usage:', response.usage);
      
      return NextResponse.json({
        success: true,
        message: 'Letta client is working correctly',
        response: {
          messageCount: response.messages.length,
          messages: response.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            messageType: msg.messageType,
            contentLength: msg.content?.length || 0,
            hasReasoning: !!msg.reasoning
          })),
          usage: response.usage
        }
      });
      
    } catch (error) {
      console.error('❌ Message creation failed:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        step: 'message_creation'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'initialization'
    }, { status: 500 });
  }
}
