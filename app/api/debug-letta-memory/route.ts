import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== Debug Letta Memory API ===');
    console.log('Agent ID:', process.env.LETTA_AGENT_ID);
    console.log('API Key present:', !!process.env.LETTA_API_KEY);
    console.log('API Key prefix:', process.env.LETTA_API_KEY?.substring(0, 15) + '...');

    // Try different API endpoints to find the right one
    const endpoints = [
      `https://api.letta.com/v1/agents/${process.env.LETTA_AGENT_ID}/core-memory/blocks`,
      `https://api.letta.com/v1/agents/${process.env.LETTA_AGENT_ID}/core-memory`,
      `https://api.letta.com/v1/agents/${process.env.LETTA_AGENT_ID}/memory`,
      `https://api.letta.com/v1/agents/${process.env.LETTA_AGENT_ID}/memory/blocks`
    ];

    const results = [];

    for (const endpoint of endpoints) {
      console.log(`\nTesting endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${process.env.LETTA_API_KEY}`,
            "x-project": "6093c633-6b6b-44f7-ad74-27c9b15b1e88"
          }
        });

        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('SUCCESS! Data:', JSON.stringify(data, null, 2).substring(0, 500));
          results.push({
            endpoint,
            status: response.status,
            success: true,
            data: data
          });
        } else {
          const errorText = await response.text();
          console.log(`Error: ${response.status} - ${errorText}`);
          results.push({
            endpoint,
            status: response.status,
            success: false,
            error: errorText
          });
        }
      } catch (error) {
        console.log(`Exception: ${error}`);
        results.push({
          endpoint,
          status: 'EXCEPTION',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      debug: 'letta-memory-endpoints',
      agentId: process.env.LETTA_AGENT_ID,
      projectId: '6093c633-6b6b-44f7-ad74-27c9b15b1e88',
      results: results
    });

  } catch (error) {
    console.error('Debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}