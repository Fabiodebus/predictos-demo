import { NextRequest, NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

export async function GET() {
  try {
    console.log('=== Listing All Projects ===');

    // Connect without specifying a project first
    const client = new LettaClient({
      token: process.env.LETTA_API_KEY,
    });

    try {
      // Try to list projects
      console.log('Attempting to list projects...');
      const projects = await client.projects.list();
      console.log('Found projects:', projects.length);

      const projectList = projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || 'No description',
        created: p.created_at || 'Unknown',
      }));

      console.log('Project details:', projectList);

      // Now try to get agents from each project
      const projectAgents: any = {};
      
      for (const project of projects) {
        try {
          console.log(`Getting agents for project: ${project.name}`);
          const projectClient = new LettaClient({
            token: process.env.LETTA_API_KEY,
            project: project.name,
          });
          
          const agents = await projectClient.agents.list();
          projectAgents[project.name] = agents.map((a: any) => ({
            id: a.id,
            name: a.name,
          }));
          console.log(`Project "${project.name}" has ${agents.length} agents`);
          
        } catch (projectError) {
          console.log(`Failed to get agents for project "${project.name}":`, (projectError as any).message);
          projectAgents[project.name] = { error: (projectError as any).message };
        }
      }

      return NextResponse.json({
        success: true,
        projectCount: projects.length,
        projects: projectList,
        agentsByProject: projectAgents,
        targetAgent: process.env.LETTA_AGENT_ID,
        searchResult: findAgentInProjects(projectAgents, process.env.LETTA_AGENT_ID!)
      });

    } catch (projectsError) {
      console.log('Failed to list projects:', (projectsError as any).message);
      
      // If projects.list() fails, maybe the method doesn't exist
      // Let's try to get project info another way or just return what we know
      return NextResponse.json({
        error: 'Could not list projects',
        details: (projectsError as any).message,
        suggestion: 'The projects.list() method might not be available. Try checking your Letta dashboard manually.',
        availableAgentsInDefaultScope: await getDefaultAgents(client)
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to connect to Letta',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function findAgentInProjects(projectAgents: any, targetAgentId: string): any {
  for (const [projectName, agents] of Object.entries(projectAgents)) {
    if (Array.isArray(agents)) {
      const foundAgent = (agents as any[]).find((a: any) => a.id === targetAgentId);
      if (foundAgent) {
        return {
          found: true,
          projectName,
          agent: foundAgent
        };
      }
    }
  }
  return { found: false };
}

async function getDefaultAgents(client: any): Promise<any[]> {
  try {
    const agents = await client.agents.list();
    return agents.map((a: any) => ({ id: a.id, name: a.name }));
  } catch {
    return [];
  }
}