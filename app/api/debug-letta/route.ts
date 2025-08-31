import { NextRequest, NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

export async function GET() {
  try {
    console.log('=== Debug Letta Connection ===');

    // Try 1: Connect without project (see if this works)
    console.log('Attempt 1: Connecting without project...');
    try {
      const client1 = new LettaClient({
        token: process.env.LETTA_API_KEY,
      });
      
      const agents1 = await client1.agents.list();
      console.log('SUCCESS: Connected without project, found', agents1.length, 'agents');
      
      return NextResponse.json({
        success: true,
        method: 'no-project',
        agentCount: agents1.length,
        agents: agents1.map((a: any) => ({ id: a.id, name: a.name }))
      });
      
    } catch (error1) {
      console.log('Failed without project:', (error1 as any).message);
    }

    // Try 2: Connect with the exact project name
    console.log('Attempt 2: Connecting with project "Copywriting - Demo"...');
    try {
      const client2 = new LettaClient({
        token: process.env.LETTA_API_KEY,
        project: "Copywriting - Demo",
      });
      
      const agents2 = await client2.agents.list();
      console.log('SUCCESS: Connected with "Copywriting - Demo", found', agents2.length, 'agents');
      
      return NextResponse.json({
        success: true,
        method: 'with-project',
        project: 'Copywriting - Demo',
        agentCount: agents2.length,
        agents: agents2.map((a: any) => ({ id: a.id, name: a.name }))
      });
      
    } catch (error2) {
      console.log('Failed with "Copywriting - Demo":', (error2 as any).message);
    }

    // Try 3: Try URL-encoding the project name
    console.log('Attempt 3: Connecting with URL-encoded project name...');
    try {
      const client3 = new LettaClient({
        token: process.env.LETTA_API_KEY,
        project: encodeURIComponent("Copywriting - Demo"),
      });
      
      const agents3 = await client3.agents.list();
      console.log('SUCCESS: Connected with URL-encoded project, found', agents3.length, 'agents');
      
      return NextResponse.json({
        success: true,
        method: 'url-encoded-project',
        project: encodeURIComponent("Copywriting - Demo"),
        agentCount: agents3.length,
        agents: agents3.map((a: any) => ({ id: a.id, name: a.name }))
      });
      
    } catch (error3) {
      console.log('Failed with URL-encoded project:', (error3 as any).message);
    }

    return NextResponse.json({
      error: 'All connection attempts failed',
      apiKeyLength: process.env.LETTA_API_KEY?.length,
      project: process.env.LETTA_PROJECT
    }, { status: 500 });

  } catch (error) {
    console.error('Debug failed:', error);
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}