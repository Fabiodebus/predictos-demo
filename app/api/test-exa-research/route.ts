import { NextRequest, NextResponse } from 'next/server';
import { ExaService } from '@/lib/exa-client';

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

    console.log('=== Testing Exa Research - REAL RESULTS ===');
    console.log('Search Query:', searchQuery);
    console.log('Company Domain:', companyDomain);
    console.log('EXA_API_KEY present:', !!process.env.EXA_API_KEY);
    console.log('EXA_API_KEY first 10 chars:', process.env.EXA_API_KEY?.substring(0, 10));

    const exaService = new ExaService();
    
    console.log('Starting Exa search...');
    const startTime = Date.now();
    
    // Make the actual API call
    const results = await exaService.searchCompany(searchQuery, companyDomain);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Exa search completed in ${duration}ms`);
    console.log('Results received:', {
      totalResults: results.results.length,
      hasAutoprompt: !!results.autopromptString,
      firstResultTitle: results.results[0]?.title || 'N/A',
      firstResultUrl: results.results[0]?.url || 'N/A'
    });

    // Log detailed first result for verification
    if (results.results.length > 0) {
      const firstResult = results.results[0];
      console.log('=== FIRST RESULT DETAILS ===');
      console.log('Title:', firstResult.title);
      console.log('URL:', firstResult.url);
      console.log('Published Date:', firstResult.publishedDate);
      console.log('Author:', firstResult.author);
      console.log('Text Length:', firstResult.text.length);
      console.log('Text Preview:', firstResult.text.substring(0, 200));
      console.log('Highlights Count:', firstResult.highlights?.length || 0);
      console.log('Score:', firstResult.score);
    }

    return NextResponse.json({
      success: true,
      verified: 'REAL_API_CALL',
      query: searchQuery,
      domain: companyDomain,
      duration: `${duration}ms`,
      stats: {
        totalResults: results.results.length,
        autopromptGenerated: !!results.autopromptString,
        autopromptLength: results.autopromptString?.length || 0
      },
      autoprompt: results.autopromptString,
      results: results.results.map((result, index) => ({
        index: index + 1,
        title: result.title,
        url: result.url,
        publishedDate: result.publishedDate,
        author: result.author,
        textLength: result.text.length,
        textPreview: result.text.substring(0, 300) + '...',
        highlights: result.highlights,
        score: result.score
      })),
      // Include first full result for detailed verification
      fullFirstResult: results.results[0] || null
    });

  } catch (error) {
    console.error('=== EXA API ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
    
    return NextResponse.json({
      success: false,
      verified: 'API_CALL_FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? error.stack : null,
      apiKeyPresent: !!process.env.EXA_API_KEY
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Exa Research Test Endpoint - REAL API CALLS',
    usage: 'POST with { searchQuery: string, companyDomain?: string }',
    example: {
      searchQuery: 'artificial intelligence recent funding',
      companyDomain: 'anthropic.com'
    },
    note: 'This endpoint makes real Exa API calls and logs detailed results'
  });
}