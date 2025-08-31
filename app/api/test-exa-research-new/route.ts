import { NextRequest, NextResponse } from 'next/server';
import { ExaResearchService } from '@/lib/exa-research-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchQuery, companyDomain } = body;

    if (!searchQuery) {
      return NextResponse.json(
        { error: 'searchQuery is required' },
        { status: 400 }
      );
    }

    console.log('=== TESTING NEW EXA RESEARCH API ===');
    console.log('Search Query:', searchQuery);
    console.log('Company Domain:', companyDomain);
    console.log('API Key present:', !!process.env.EXA_API_KEY);

    const researchService = new ExaResearchService();
    
    const startTime = Date.now();
    console.log('Starting research task...');
    
    // This will create the task and wait for completion
    const completedTask = await researchService.performCompanyResearch(searchQuery, companyDomain);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('=== RESEARCH COMPLETED ===');
    console.log('Duration:', `${duration}ms`);
    console.log('Research ID:', completedTask.researchId);
    console.log('Status:', completedTask.status);
    console.log('Cost:', completedTask.costDollars);
    console.log('Content length:', completedTask.output?.content?.length || 0);
    console.log('Content preview:', completedTask.output?.content?.substring(0, 200));

    return NextResponse.json({
      success: true,
      apiType: 'NEW_EXA_RESEARCH_API',
      researchId: completedTask.researchId,
      duration: `${duration}ms`,
      status: completedTask.status,
      model: completedTask.model,
      instructions: completedTask.instructions,
      cost: completedTask.costDollars,
      output: {
        contentLength: completedTask.output?.content?.length || 0,
        contentPreview: completedTask.output?.content?.substring(0, 1000) + '...',
        fullContent: completedTask.output?.content,
        parsed: completedTask.output?.parsed
      },
      timing: {
        createdAt: completedTask.createdAt,
        finishedAt: completedTask.finishedAt,
        durationMs: duration
      }
    });

  } catch (error) {
    console.error('=== RESEARCH API ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      success: false,
      apiType: 'NEW_EXA_RESEARCH_API',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'New Exa Research API Test Endpoint',
    usage: 'POST with { searchQuery: string, companyDomain?: string }',
    apiType: 'Research API (async task-based)',
    example: {
      searchQuery: 'recent funding and product developments',
      companyDomain: 'anthropic.com'
    },
    note: 'This uses the new Exa Research API that creates async tasks and provides comprehensive research results'
  });
}