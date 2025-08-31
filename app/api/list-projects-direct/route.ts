import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== Listing Projects via Direct REST API ===');

    // Call the Letta REST API directly
    const response = await fetch('https://api.letta.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LETTA_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error:', response.status, errorText);
      return NextResponse.json({
        error: `Failed to fetch projects: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Projects API Response:', data);

    // Extract projects array
    const projects = data.projects || [];
    console.log(`Found ${projects.length} projects:`, projects.map((p: any) => p.name));

    // Now try to get agents from each project
    const projectDetails = [];
    
    for (const project of projects) {
      console.log(`Getting agents for project: ${project.name}`);
      
      try {
        // Use the Letta client to get agents for this specific project
        const { LettaClient } = await import('@letta-ai/letta-client');
        const projectClient = new LettaClient({
          token: process.env.LETTA_API_KEY,
          project: project.name,
        });
        
        const agents = await projectClient.agents.list();
        const agentList = agents.map((a: any) => ({
          id: a.id,
          name: a.name,
        }));

        projectDetails.push({
          ...project,
          agentCount: agents.length,
          agents: agentList,
          hasTargetAgent: agentList.some((a: any) => a.id === process.env.LETTA_AGENT_ID)
        });

        console.log(`Project "${project.name}": ${agents.length} agents`);
        
      } catch (agentError) {
        console.log(`Failed to get agents for project "${project.name}":`, (agentError as any).message);
        projectDetails.push({
          ...project,
          error: (agentError as any).message,
          agentCount: 0,
          agents: []
        });
      }
    }

    // Find which project contains the target agent
    const targetProject = projectDetails.find(p => p.hasTargetAgent);

    return NextResponse.json({
      success: true,
      totalProjects: projects.length,
      projects: projectDetails,
      targetAgent: process.env.LETTA_AGENT_ID,
      targetAgentFound: !!targetProject,
      targetAgentProject: targetProject?.name || null,
      recommendation: targetProject ? 
        `Use project "${targetProject.name}" to access your agent` :
        `Agent ${process.env.LETTA_AGENT_ID} not found in any accessible project`
    });

  } catch (error) {
    console.error('Error listing projects:', error);
    return NextResponse.json({
      error: 'Failed to list projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}