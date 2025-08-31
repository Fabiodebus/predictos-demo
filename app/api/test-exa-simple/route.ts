import { NextRequest, NextResponse } from 'next/server';
import { ExaService } from '@/lib/exa-client';

export async function GET() {
  try {
    if (!process.env.EXA_API_KEY) {
      return NextResponse.json(
        { error: 'EXA_API_KEY not configured' },
        { status: 500 }
      );
    }

    const exaService = new ExaService();
    
    // Simple test search
    const results = await exaService.searchCompany(
      "AI artificial intelligence recent developments", 
      "anthropic.com"
    );

    return NextResponse.json({
      success: true,
      query: "AI artificial intelligence recent developments for anthropic.com",
      resultCount: results.results.length,
      autoprompt: results.autopromptString,
      sampleResults: results.results.slice(0, 3).map(result => ({
        title: result.title,
        url: result.url,
        textPreview: result.text.substring(0, 200) + '...',
        publishedDate: result.publishedDate,
        score: result.score
      }))
    });

  } catch (error) {
    console.error('Exa test error:', error);
    return NextResponse.json(
      { 
        error: 'Exa test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}