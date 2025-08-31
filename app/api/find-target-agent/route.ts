import { NextRequest, NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

export async function GET() {
  try {
    console.log('=== Looking for Target Agent in copywriting-demo project ===');

    const client = new LettaClient({
      token: process.env.LETTA_API_KEY,
      project: "copywriting-demo",
    });

    const agents = await client.agents.list();
    console.log(`Found ${agents.length} agents in copywriting-demo project`);

    const targetAgentId = "agent-b78b5849-2940-4c38-92f9-275f2aeb1e7e";
    const targetAgent = agents.find((a: any) => a.id === targetAgentId);

    const allAgents = agents.map((a: any) => ({
      id: a.id,
      name: a.name,
      isTarget: a.id === targetAgentId
    }));

    if (targetAgent) {
      console.log('SUCCESS: Found target agent!', targetAgent);
      
      // Test sending a message to the agent
      try {
        const testResponse = await client.agents.messages.create(targetAgentId, {
          messages: [{ role: 'user', content: 'Hello! This is a quick test. Please respond briefly.' }]
        });

        return NextResponse.json({
          success: true,
          targetAgent: {
            id: targetAgent.id,
            name: targetAgent.name
          },
          testMessage: {
            success: true,
            messageCount: testResponse.messages.length,
            firstResponse: testResponse.messages[0]?.content?.substring(0, 200) + '...'
          },
          allAgents: allAgents,
          recommendation: `Your original agent is now accessible! Update .env.local to use agent-b78b5849-2940-4c38-92f9-275f2aeb1e7e`
        });

      } catch (messageError) {
        return NextResponse.json({
          success: true,
          targetAgent: {
            id: targetAgent.id,
            name: targetAgent.name
          },
          testMessage: {
            success: false,
            error: (messageError as any).message
          },
          allAgents: allAgents
        });
      }

    } else {
      console.log('Target agent not found in copywriting-demo project');
      return NextResponse.json({
        success: false,
        targetAgentFound: false,
        targetAgentId: targetAgentId,
        allAgents: allAgents,
        message: 'Target agent still not found in copywriting-demo project'
      });
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to search for target agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}