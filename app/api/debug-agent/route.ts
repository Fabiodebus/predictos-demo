import { NextRequest, NextResponse } from 'next/server';
import { LettaService } from '@/lib/letta-client';
import { MemoryService } from '@/lib/memory-service';

export async function GET() {
  try {
    console.log('🔍 Debugging agent configuration...');
    
    const lettaService = new LettaService();
    const memoryService = new MemoryService(lettaService.getClient());
    
    // 1. Check agent accessibility
    console.log('Step 1: Checking agent access...');
    const blocks = await memoryService.listBlocks(lettaService.getAgentId());
    
    // 2. Look for research block specifically
    const researchBlock = blocks.find(block => block.label === 'lead-company-research');
    
    // 3. Check agent's recent conversation history (if possible)
    const client = lettaService.getClient() as any;
    let conversationHistory = null;
    try {
      if (client.agents.messages?.list) {
        conversationHistory = await client.agents.messages.list(lettaService.getAgentId());
      }
    } catch (error) {
      console.log('Could not fetch conversation history:', error);
    }
    
    // 4. Build a test prompt
    const testCampaignData = {
      linkedinUrl: 'https://linkedin.com/in/test',
      companyDomain: 'example.com', 
      numberOfEmails: 1,
      numberOfThreads: 1,
      language: 'english',
      formality: 'professional',
      leadName: 'John Doe',
      leadTitle: 'CEO',
      companyName: 'Example Corp'
    };
    
    const testPrompt = lettaService.buildPrompt(testCampaignData, []);
    
    return NextResponse.json({
      success: true,
      debug: {
        agentId: lettaService.getAgentId(),
        totalMemoryBlocks: blocks.length,
        memoryBlockLabels: blocks.map(b => b.label),
        researchBlockExists: !!researchBlock,
        researchBlockContent: researchBlock ? researchBlock.value?.substring(0, 200) + '...' : null,
        conversationHistoryLength: conversationHistory?.length || 'N/A',
        testPrompt: JSON.parse(testPrompt),
        testPromptLength: testPrompt.length
      }
    });
    
  } catch (error) {
    console.error('❌ Agent debug failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}