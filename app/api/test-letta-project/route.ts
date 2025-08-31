import { NextRequest, NextResponse } from 'next/server';
import { LettaService } from '@/lib/letta-client';
import { MemoryService } from '@/lib/memory-service';

export async function GET() {
  try {
    console.log('🧪 Testing Letta project slug configuration...');
    
    // Test 1: Initialize services
    console.log('Step 1: Initializing Letta service...');
    const lettaService = new LettaService();
    const memoryService = new MemoryService(lettaService.getClient());
    
    // Test 2: List memory blocks (this will test project slug)
    console.log('Step 2: Testing agent access by listing memory blocks...');
    const blocks = await memoryService.listBlocks(lettaService.getAgentId());
    
    console.log('✅ Success! Agent accessible and memory blocks retrieved');
    
    return NextResponse.json({
      success: true,
      message: 'Letta project configuration working correctly',
      agentId: lettaService.getAgentId(),
      memoryBlocks: blocks.length,
      memoryLabels: blocks.map(b => b.label),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Letta project test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        agentId: process.env.LETTA_AGENT_ID,
        project: process.env.LETTA_PROJECT,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET to test Letta project configuration',
    usage: 'GET /api/test-letta-project'
  });
}