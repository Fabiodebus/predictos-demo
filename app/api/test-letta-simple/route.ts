import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== Simple Letta Test ===');
    
    // Check environment variables
    console.log('Environment check:');
    console.log('- LETTA_API_KEY exists:', !!process.env.LETTA_API_KEY);
    console.log('- LETTA_AGENT_ID exists:', !!process.env.LETTA_AGENT_ID);
    console.log('- LETTA_PROJECT exists:', !!process.env.LETTA_PROJECT);
    
    if (!process.env.LETTA_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'LETTA_API_KEY is missing'
      }, { status: 500 });
    }
    
    if (!process.env.LETTA_AGENT_ID) {
      return NextResponse.json({
        success: false,
        error: 'LETTA_AGENT_ID is missing'
      }, { status: 500 });
    }
    
    // Try to import and initialize LettaClient
    try {
      const { LettaClient } = await import('@letta-ai/letta-client');
      
      const client = new LettaClient({
        token: process.env.LETTA_API_KEY,
        project: process.env.LETTA_PROJECT || "copywriting-demo",
      });
      
      console.log('✅ LettaClient initialized successfully');
      
      return NextResponse.json({
        success: true,
        message: 'LettaClient can be initialized',
        clientKeys: Object.keys(client),
        hasAgents: !!client.agents
      });
      
    } catch (importError) {
      console.error('❌ Import/initialization failed:', importError);
      return NextResponse.json({
        success: false,
        error: importError instanceof Error ? importError.message : 'Unknown import error',
        step: 'import_initialization'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'general'
    }, { status: 500 });
  }
}
