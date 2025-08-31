import Exa from 'exa-js';
import { ExaApiResponse, ExaSearchResult } from '@/types/campaign';

export class ExaService {
  private exa: Exa;

  constructor() {
    if (!process.env.EXA_API_KEY) {
      throw new Error('EXA_API_KEY is required');
    }
    this.exa = new Exa(process.env.EXA_API_KEY);
  }

  async searchCompany(query: string, domain?: string): Promise<ExaApiResponse> {
    try {
      // Construct search query with domain focus if provided
      const searchQuery = domain 
        ? `${query} site:${domain} OR "${domain}"` 
        : query;

      const response = await this.exa.searchAndContents(searchQuery, {
        type: 'neural',
        useAutoprompt: true,
        numResults: 10,
        text: {
          maxCharacters: 2000,
          includeHtmlTags: false,
        },
        highlights: {
          numSentences: 3,
        },
      });

      const results: ExaSearchResult[] = response.results.map((result: any) => ({
        title: result.title || 'Untitled',
        url: result.url,
        publishedDate: result.publishedDate,
        author: result.author,
        text: result.text || '',
        highlights: result.highlights || [],
        score: result.score || 0,
      }));

      return {
        results,
        autopromptString: response.autopromptString,
      };
    } catch (error) {
      console.error('Exa API error:', error);
      throw new Error(`Failed to search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCompanyNews(domain: string, limit: number = 5): Promise<ExaSearchResult[]> {
    try {
      const response = await this.searchCompany(
        `news updates press releases "${domain}"`,
        domain
      );

      // Sort by published date (most recent first) and limit results
      return response.results
        .filter(result => result.publishedDate)
        .sort((a, b) => {
          const dateA = new Date(a.publishedDate!).getTime();
          const dateB = new Date(b.publishedDate!).getTime();
          return dateB - dateA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get company news:', error);
      return [];
    }
  }
}