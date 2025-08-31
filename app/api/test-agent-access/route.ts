import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== Testing Agent Access ===');
    console.log('Target Agent ID:', process.env.LETTA_AGENT_ID);
    console.log('Project Slug:', 'copywriting-demo');

    // Test 1: List all agents in the project
    const listAgentsResponse = await fetch(`https://api.letta.com/v1/agents`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.LETTA_API_KEY}`,
        "X-Project": "copywriting-demo"
      }
    });

    console.log('List agents response status:', listAgentsResponse.status);
    
    if (!listAgentsResponse.ok) {
      const errorText = await listAgentsResponse.text();
      console.error('Failed to list agents:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Failed to list agents',
        status: listAgentsResponse.status,
        details: errorText
      });
    }

    const agents = await listAgentsResponse.json();
    console.log(`Found ${agents.length} agents in copywriting-demo project`);
    console.log('Agents:', agents.map((a: any) => ({ id: a.id, name: a.name })));

    // Test 2: Check if our target agent exists
    const targetAgent = agents.find((agent: any) => agent.id === process.env.LETTA_AGENT_ID);
    
    if (!targetAgent) {
      console.error('Target agent not found in copywriting-demo project!');
      return NextResponse.json({
        success: false,
        error: 'Target agent not found in project',
        targetAgentId: process.env.LETTA_AGENT_ID,
        availableAgents: agents.map((a: any) => ({ id: a.id, name: a.name }))
      });
    }

    console.log('Target agent found:', targetAgent);

    // Test 3: Try a simple message to the agent (non-streaming)
    const testMessageResponse = await fetch(`https://api.letta.com/v1/agents/${process.env.LETTA_AGENT_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LETTA_API_KEY}`,
        "Content-Type": "application/json",
        "X-Project": "copywriting-demo"
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Hello, are you working?"
          }
        ]
      })
    });

    console.log('Test message response status:', testMessageResponse.status);
    
    if (!testMessageResponse.ok) {
      const errorText = await testMessageResponse.text();
      console.error('Test message failed:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Agent message test failed',
        status: testMessageResponse.status,
        details: errorText,
        agentExists: true,
        agentInfo: targetAgent
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Agent is accessible and working',
      agentInfo: targetAgent,
      totalAgentsInProject: agents.length
    });

  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}