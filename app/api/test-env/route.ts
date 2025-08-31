import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== Environment Test ===');
    
    const envVars = {
      LETTA_API_KEY: process.env.LETTA_API_KEY ? 'exists' : 'missing',
      LETTA_AGENT_ID: process.env.LETTA_AGENT_ID ? 'exists' : 'missing',
      LETTA_PROJECT: process.env.LETTA_PROJECT ? 'exists' : 'missing',
      EXA_API_KEY: process.env.EXA_API_KEY ? 'exists' : 'missing',
    };
    
    console.log('Environment variables:', envVars);
    
    return NextResponse.json({
      success: true,
      environment: envVars,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
