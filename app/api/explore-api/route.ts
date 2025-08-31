import { NextRequest, NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

export async function GET() {
  try {
    const client = new LettaClient({
      token: process.env.LETTA_API_KEY,
    });

    console.log('=== Exploring Letta Client API ===');
    
    // Check what properties/methods are available on the client
    const clientKeys = Object.keys(client);
    console.log('Client properties:', clientKeys);
    
    // Check what's available on client.agents
    const agentsKeys = Object.keys(client.agents);
    console.log('client.agents methods:', agentsKeys);

    // Try some different possible method names for projects
    const projectMethods = [];
    try {
      if ('projects' in client) {
        const projectsKeys = Object.keys((client as any).projects);
        console.log('client.projects methods:', projectsKeys);
        projectMethods.push(...projectsKeys);
      }
    } catch (e) {
      console.log('No projects property on client');
    }

    // Let's try to call some methods that might give us project info
    let projectInfo: any = null;
    const attemptedMethods = [];

    // Try different possible project-related methods
    const methodsToTry = [
      'client.projects?.list()',
      'client.projects?.get()',
      'client.listProjects()',
      'client.getProjects()',
    ];

    for (const methodName of methodsToTry) {
      try {
        let result;
        attemptedMethods.push({ method: methodName, status: 'attempting' });
        
        if (methodName.includes('client.projects?.list()')) {
          result = await (client as any).projects?.list?.();
        } else if (methodName.includes('client.projects?.get()')) {
          result = await (client as any).projects?.get?.();
        } else if (methodName.includes('client.listProjects()')) {
          result = await (client as any).listProjects?.();
        } else if (methodName.includes('client.getProjects()')) {
          result = await (client as any).getProjects?.();
        }
        
        if (result !== undefined) {
          projectInfo = result;
          attemptedMethods[attemptedMethods.length - 1].status = 'success';
          attemptedMethods[attemptedMethods.length - 1].result = result;
          console.log(`SUCCESS with ${methodName}:`, result);
          break;
        } else {
          attemptedMethods[attemptedMethods.length - 1].status = 'undefined';
        }
      } catch (error) {
        attemptedMethods[attemptedMethods.length - 1].status = 'error';
        attemptedMethods[attemptedMethods.length - 1].error = (error as any).message;
        console.log(`Failed ${methodName}:`, (error as any).message);
      }
    }

    return NextResponse.json({
      clientProperties: clientKeys,
      agentsMethods: agentsKeys,
      projectsMethods: projectMethods,
      attemptedMethods: attemptedMethods,
      projectInfo: projectInfo,
      recommendation: projectInfo ? 
        'Found project info! Check the projectInfo field.' : 
        'No project listing method found. You may need to check your Letta dashboard manually to find the correct project name.'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to explore API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}