import { NextRequest, NextResponse } from 'next/server';
import { ExaService } from '@/lib/exa-client';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Testing Exa API Research ===');

    const body = await request.json();
    const { searchQuery, companyDomain } = body;

    console.log('Search Query:', searchQuery);
    console.log('Company Domain:', companyDomain);

    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const exaService = new ExaService();
    
    console.log('Starting Exa search...');
    const startTime = Date.now();
    
    const results = await exaService.searchCompany(searchQuery, companyDomain);
    
    const endTime = Date.now();
    console.log(`Exa search completed in ${endTime - startTime}ms`);
    console.log(`Found ${results.results.length} results`);

    // Log first result for debugging
    if (results.results.length > 0) {
      const firstResult = results.results[0];
      console.log('First result preview:');
      console.log('- Title:', firstResult.title);
      console.log('- URL:', firstResult.url);
      console.log('- Text length:', firstResult.text.length);
      console.log('- Has highlights:', firstResult.highlights?.length || 0);
    }

    return NextResponse.json({
      success: true,
      query: searchQuery,
      domain: companyDomain,
      resultCount: results.results.length,
      searchDuration: `${endTime - startTime}ms`,
      autoprompt: results.autopromptString,
      results: results.results.map(result => ({
        title: result.title,
        url: result.url,
        publishedDate: result.publishedDate,
        author: result.author,
        text: result.text.substring(0, 500) + '...', // Truncate for test
        textLength: result.text.length,
        highlights: result.highlights,
        score: result.score
      })),
      // Include full first result for detailed inspection
      sampleResult: results.results[0] || null
    });

  } catch (error) {
    console.error('Exa API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Exa API Test Endpoint',
    usage: 'POST with { searchQuery: string, companyDomain?: string }',
    example: {
      searchQuery: 'recent funding and product launches',
      companyDomain: 'openai.com'
    }
  });
}