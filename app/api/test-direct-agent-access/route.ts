import { NextRequest, NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

export async function GET() {
  try {
    console.log('=== Testing Direct Agent Access ===');

    // Method 1: Direct REST API call (like user's successful example)
    const directResponse = await fetch(`https://api.letta.com/v1/agents/?project_id=6093c633-6b6b-44f7-ad74-27c9b15b1e88`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LETTA_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!directResponse.ok) {
      console.log('Direct API call failed:', directResponse.status);
      return NextResponse.json({
        error: `Direct REST API failed: ${directResponse.status}`,
        details: await directResponse.text()
      }, { status: directResponse.status });
    }

    const directAgents = await directResponse.json();
    console.log('Direct REST API found', directAgents.length, 'agents');

    const targetAgent = directAgents.find((a: any) => a.id === process.env.LETTA_AGENT_ID);
    
    if (targetAgent) {
      console.log('SUCCESS: Found target agent via direct REST API!');
      
      // Now test if we can send a message using the SDK with the correct project
      try {
        const client = new LettaClient({
          token: process.env.LETTA_API_KEY,
          project: "copywriting-demo", // Using slug that works
        });

        const testResponse = await client.agents.messages.create(process.env.LETTA_AGENT_ID!, {
          messages: [{ role: 'user', content: 'Quick test - please respond briefly to confirm the connection works.' }]
        });

        return NextResponse.json({
          success: true,
          method: 'direct-rest-api',
          targetAgent: {
            id: targetAgent.id,
            name: targetAgent.name
          },
          sdkTest: {
            success: true,
            messageCount: testResponse.messages.length,
            preview: testResponse.messages[0]?.content?.substring(0, 200) + '...'
          },
          allDirectAgents: directAgents.map((a: any) => ({ id: a.id, name: a.name }))
        });

      } catch (sdkError) {
        return NextResponse.json({
          success: true,
          method: 'direct-rest-api',
          targetAgent: {
            id: targetAgent.id,
            name: targetAgent.name
          },
          sdkTest: {
            success: false,
            error: (sdkError as any).message
          }
        });
      }

    } else {
      return NextResponse.json({
        error: 'Target agent not found even with direct REST API',
        targetAgentId: process.env.LETTA_AGENT_ID,
        allDirectAgents: directAgents.map((a: any) => ({ id: a.id, name: a.name }))
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      error: 'Failed to test direct agent access',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}