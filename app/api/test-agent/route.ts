import { NextRequest, NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

export async function GET() {
  try {
    const client = new LettaClient({
      token: process.env.LETTA_API_KEY,
    });

    const targetAgentId = process.env.LETTA_AGENT_ID;
    console.log('Testing access to agent:', targetAgentId);

    try {
      // Try to get the specific agent info
      const agent = await client.agents.get(targetAgentId!);
      console.log('SUCCESS: Found agent:', agent.name);

      // Try to send a simple message to test functionality
      try {
        const testMessage = "Hello! This is a test message to verify the agent connection. Please respond briefly.";
        const response = await client.agents.messages.create(targetAgentId!, {
          messages: [{ role: 'user', content: testMessage }]
        });

        console.log('SUCCESS: Agent responded with', response.messages.length, 'messages');

        return NextResponse.json({
          success: true,
          agent: {
            id: agent.id,
            name: agent.name
          },
          messageTest: {
            success: true,
            responseCount: response.messages.length,
            firstMessage: response.messages[0]?.content?.substring(0, 100) + '...'
          }
        });

      } catch (messageError) {
        console.log('Agent found but message failed:', (messageError as any).message);
        return NextResponse.json({
          success: true,
          agent: {
            id: agent.id,
            name: agent.name
          },
          messageTest: {
            success: false,
            error: (messageError as any).message
          }
        });
      }

    } catch (agentError) {
      console.log('Failed to get agent:', (agentError as any).message);
      
      // If agent not found, suggest using one of the available ones
      const agents = await client.agents.list();
      return NextResponse.json({
        error: `Agent ${targetAgentId} not found`,
        availableAgents: agents.map((a: any) => ({ 
          id: a.id, 
          name: a.name 
        })),
        suggestion: "Update LETTA_AGENT_ID in .env.local with one of the available agent IDs"
      }, { status: 404 });
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}