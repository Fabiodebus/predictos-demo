import { NextRequest, NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

export async function GET() {
  try {
    console.log('=== Testing Project Slugs vs Names ===');

    // Test both the name and slug for "Copywriting - Demo"
    const projectTests = [
      { type: 'name', value: 'Copywriting - Demo' },
      { type: 'slug', value: 'copywriting-demo' },
      { type: 'name', value: 'pred-copy' },
      { type: 'slug', value: 'pred-copy' }
    ];

    const results = [];

    for (const test of projectTests) {
      try {
        console.log(`Testing ${test.type}: "${test.value}"`);
        
        const client = new LettaClient({
          token: process.env.LETTA_API_KEY,
          project: test.value,
        });
        
        const agents = await client.agents.list();
        
        console.log(`SUCCESS with ${test.type} "${test.value}": found ${agents.length} agents`);
        
        results.push({
          projectType: test.type,
          projectValue: test.value,
          success: true,
          agentCount: agents.length,
          agents: agents.map((a: any) => ({ id: a.id, name: a.name })),
          hasTargetAgent: agents.some((a: any) => a.id === process.env.LETTA_AGENT_ID)
        });
        
      } catch (error) {
        console.log(`FAILED with ${test.type} "${test.value}":`, (error as any).message);
        results.push({
          projectType: test.type,
          projectValue: test.value,
          success: false,
          error: (error as any).message
        });
      }
    }

    // Find successful connections that have the target agent
    const targetAgentResults = results.filter(r => r.hasTargetAgent);

    return NextResponse.json({
      success: true,
      testResults: results,
      targetAgent: process.env.LETTA_AGENT_ID,
      targetAgentFound: targetAgentResults.length > 0,
      workingProjects: targetAgentResults,
      recommendation: targetAgentResults.length > 0 ? 
        `Use project ${targetAgentResults[0].projectType} "${targetAgentResults[0].projectValue}" to access your agent` :
        'Agent not found in tested projects'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test project connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}