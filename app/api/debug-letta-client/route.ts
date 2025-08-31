import { NextRequest, NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

export async function GET() {
  try {
    if (!process.env.LETTA_API_KEY || !process.env.LETTA_AGENT_ID) {
      return NextResponse.json(
        { error: 'Letta configuration missing' },
        { status: 500 }
      );
    }

    const client = new LettaClient({
      token: process.env.LETTA_API_KEY,
      project: "copywriting-demo",
    });

    console.log('=== Debugging Letta Client Structure ===');
    console.log('Client:', Object.keys(client));
    console.log('Client.agents:', Object.keys(client.agents || {}));
    console.log('Client.agents type:', typeof client.agents);

    // Try to get agent info first
    let agentInfo = null;
    try {
      agentInfo = await client.agents.get(process.env.LETTA_AGENT_ID);
      console.log('Agent retrieved successfully');
    } catch (e) {
      console.log('Agent get failed:', e);
    }

    // Try different approaches to list memories
    const memoryAttempts = [];

    // Attempt 1: Direct memory list
    try {
      const memories1 = await client.agents.memory?.list?.(process.env.LETTA_AGENT_ID);
      memoryAttempts.push({ method: 'agents.memory.list', success: true, result: memories1 });
    } catch (e) {
      memoryAttempts.push({ method: 'agents.memory.list', success: false, error: e.message });
    }

    // Attempt 2: Check if there's a memories endpoint
    try {
      const memories2 = await client.memories?.list?.(process.env.LETTA_AGENT_ID);
      memoryAttempts.push({ method: 'memories.list', success: true, result: memories2 });
    } catch (e) {
      memoryAttempts.push({ method: 'memories.list', success: false, error: e.message });
    }

    // Attempt 3: Check if memory is directly on agent
    try {
      if (agentInfo && agentInfo.memory) {
        memoryAttempts.push({ method: 'agent.memory', success: true, result: agentInfo.memory });
      }
    } catch (e) {
      memoryAttempts.push({ method: 'agent.memory', success: false, error: e.message });
    }

    // Try to explore available methods
    const availableMethods = {
      clientKeys: Object.keys(client),
      agentsKeys: client.agents ? Object.keys(client.agents) : 'no agents property',
      agentMethods: client.agents ? Object.getOwnPropertyNames(client.agents) : 'no agents'
    };

    return NextResponse.json({
      success: true,
      debug: {
        agentId: process.env.LETTA_AGENT_ID,
        agentInfo: agentInfo ? {
          id: agentInfo.id,
          name: agentInfo.name,
          hasMemory: !!agentInfo.memory,
          memoryKeys: agentInfo.memory ? Object.keys(agentInfo.memory) : null
        } : null,
        memoryAttempts,
        availableMethods
      }
    });

  } catch (error) {
    console.error('Debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}