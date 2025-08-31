import { NextRequest, NextResponse } from 'next/server';
import { ExaService } from '@/lib/exa-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchQuery, companyDomain } = body;

    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (!process.env.EXA_API_KEY) {
      return NextResponse.json(
        { error: 'Exa API key not configured' },
        { status: 500 }
      );
    }

    const exaService = new ExaService();
    
    // Perform the search with company domain context
    const searchResults = await exaService.searchCompany(searchQuery, companyDomain);
    
    // Also get recent company news if domain is provided
    let companyNews: any[] = [];
    if (companyDomain) {
      try {
        companyNews = await exaService.getCompanyNews(companyDomain, 3);
      } catch (newsError) {
        console.warn('Failed to fetch company news:', newsError);
        // Continue without news - not critical
      }
    }

    // Combine results with news prioritized
    const combinedResults = {
      ...searchResults,
      results: [
        ...companyNews,
        ...searchResults.results.filter(result => 
          !companyNews.some(news => news.url === result.url)
        )
      ].slice(0, 10) // Limit total results
    };

    return NextResponse.json(combinedResults);

  } catch (error) {
    console.error('Research API error:', error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key configuration' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to perform research. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Research API endpoint',
      usage: 'POST with { searchQuery: string, companyDomain?: string }' 
    },
    { status: 200 }
  );
}