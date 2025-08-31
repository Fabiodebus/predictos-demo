// New Exa Research API client using the correct async research endpoints

export interface ResearchTask {
  researchId: string;
  model: string;
  instructions: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  createdAt: number;
  finishedAt?: number;
  output?: {
    content: string;
    parsed?: any;
  };
  costDollars?: {
    total: number;
    numSearches: number;
    numPages: number;
    reasoningTokens: number;
  };
  error?: string;
}

export class ExaResearchService {
  private apiKey: string;
  private baseUrl = 'https://api.exa.ai/research/v1';

  constructor() {
    if (!process.env.EXA_API_KEY) {
      throw new Error('EXA_API_KEY is required');
    }
    this.apiKey = process.env.EXA_API_KEY;
  }

  async createResearchTask(instructions: string, model: string = 'exa-research'): Promise<ResearchTask> {
    try {
      console.log('Creating research task with instructions:', instructions.substring(0, 100) + '...');
      
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          instructions
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create research task: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const task = await response.json();
      console.log('Research task created:', { id: task.researchId, status: task.status });
      return task;
    } catch (error) {
      console.error('Failed to create research task:', error);
      throw new Error(`Research task creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getResearchTask(researchId: string): Promise<ResearchTask> {
    try {
      const response = await fetch(`${this.baseUrl}/${researchId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get research task: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const task = await response.json();
      return task;
    } catch (error) {
      console.error('Failed to get research task:', error);
      throw new Error(`Research task retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async waitForCompletion(researchId: string, maxWaitTimeMs: number = 300000): Promise<ResearchTask> {
    console.log(`Waiting for research task ${researchId} to complete (max ${maxWaitTimeMs}ms)...`);
    
    const startTime = Date.now();
    let attempts = 0;
    
    while (Date.now() - startTime < maxWaitTimeMs) {
      attempts++;
      
      try {
        const task = await this.getResearchTask(researchId);
        console.log(`Poll attempt ${attempts}: status = ${task.status}`);
        
        if (task.status === 'completed') {
          console.log('Research completed successfully!');
          console.log('Cost:', task.costDollars);
          return task;
        }
        
        if (task.status === 'failed') {
          throw new Error(`Research task failed: ${task.error}`);
        }
        
        if (task.status === 'canceled') {
          throw new Error('Research task was canceled');
        }
        
        // Wait before next poll (exponential backoff)
        const waitTime = Math.min(5000, 1000 * Math.pow(1.5, attempts - 1));
        console.log(`Waiting ${waitTime}ms before next poll...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('Research task failed')) {
          throw error;
        }
        console.warn(`Poll attempt ${attempts} failed:`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error(`Research task timed out after ${maxWaitTimeMs}ms`);
  }

  async performCompanyResearch(searchQuery: string, companyDomain?: string): Promise<ResearchTask> {
    // Build comprehensive research instructions
    const instructions = companyDomain 
      ? `Research the company ${companyDomain} with focus on: ${searchQuery}. 

Please provide comprehensive information about:
1. Company overview and business model
2. Products and services offered
3. Target market and customer segments
4. Recent news, funding, or business developments
5. Growth initiatives and market positioning
6. Leadership team and key personnel
7. Competitive landscape and differentiation

Focus specifically on: ${searchQuery}

Make sure to find real, current information and cite sources. Don't speculate or add information not found in sources.`
      : `Research and analyze: ${searchQuery}. 

Provide comprehensive information with real sources and citations. Focus on factual, current information.`;

    console.log('Starting comprehensive company research...');
    console.log('Instructions length:', instructions.length);
    
    // Create research task
    const task = await this.createResearchTask(instructions);
    
    // Wait for completion
    const completedTask = await this.waitForCompletion(task.researchId);
    
    return completedTask;
  }
}