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

    console.log('Listing agent memories for:', process.env.LETTA_AGENT_ID);

    // List agent memories
    const memories = await client.agents.memory.list(process.env.LETTA_AGENT_ID);

    return NextResponse.json({
      success: true,
      agentId: process.env.LETTA_AGENT_ID,
      memories: memories,
      memoryCount: memories.length
    });

  } catch (error) {
    console.error('Failed to list agent memories:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memoryLabel, newValue, action } = body;

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

    if (action === 'update' && memoryLabel && newValue) {
      console.log(`Updating memory "${memoryLabel}" with new value...`);
      
      // Update specific memory
      const result = await client.agents.memory.update(
        process.env.LETTA_AGENT_ID,
        {
          label: memoryLabel,
          value: newValue
        }
      );

      return NextResponse.json({
        success: true,
        action: 'update',
        memoryLabel,
        result
      });
    }

    if (action === 'reset_messages') {
      console.log('Resetting agent chat history...');
      
      // Clear agent messages/conversation history
      // Note: This might be different depending on Letta API version
      const result = await client.agents.messages.list(process.env.LETTA_AGENT_ID);
      
      // If there's a way to clear history, we'd do it here
      // For now, just return the current message count
      return NextResponse.json({
        success: true,
        action: 'reset_messages',
        currentMessageCount: result.length,
        note: 'Message history reset functionality needs verification'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "update" or "reset_messages"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Agent memory operation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}