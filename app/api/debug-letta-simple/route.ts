import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== Simple Letta API Test ===');
    
    // Test 1: Just try to get agent info first
    console.log('\n--- Test 1: Get Agent Info ---');
    const agentResponse = await fetch(`https://api.letta.com/v1/agents/${process.env.LETTA_AGENT_ID}`, {
      method: "GET", 
      headers: {
        "Authorization": `Bearer ${process.env.LETTA_API_KEY}`,
        "x-project": "6093c633-6b6b-44f7-ad74-27c9b15b1e88"
      }
    });
    
    console.log('Agent API status:', agentResponse.status);
    
    if (agentResponse.ok) {
      const agentData = await agentResponse.json();
      console.log('Agent data received, ID:', agentData.id);
      
      // Test 2: Try to list agents to verify project access
      console.log('\n--- Test 2: List Agents ---');
      const listResponse = await fetch(`https://api.letta.com/v1/agents`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.LETTA_API_KEY}`,
          "x-project": "6093c633-6b6b-44f7-ad74-27c9b15b1e88"
        }
      });
      
      console.log('List agents status:', listResponse.status);
      
      if (listResponse.ok) {
        const agentsData = await listResponse.json();
        console.log('Found agents count:', agentsData.length);
        
        return NextResponse.json({
          success: true,
          agentExists: true,
          agentId: agentData.id,
          agentName: agentData.name,
          totalAgents: agentsData.length,
          projectId: '6093c633-6b6b-44f7-ad74-27c9b15b1e88'
        });
      } else {
        const listError = await listResponse.text();
        return NextResponse.json({
          success: false,
          step: 'list-agents',
          error: listError,
          agentExists: true,
          agentId: agentData.id
        });
      }
    } else {
      const agentError = await agentResponse.text();
      return NextResponse.json({
        success: false,
        step: 'get-agent',
        error: agentError,
        status: agentResponse.status
      });
    }

  } catch (error) {
    console.error('Simple test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}