import { LettaClient } from '@letta-ai/letta-client';

export interface MemoryBlock {
  id: string;
  label: string;
  value: string;
  description?: string;
}

export class MemoryService {
  private client: LettaClient;

  constructor(client: LettaClient) {
    this.client = client;
  }

  // List memory blocks for an agent
  async listBlocks(agentId: string): Promise<MemoryBlock[]> {
    try {
      console.log('Listing memory blocks for agent:', agentId);
      
      // Debug project from env
      const resolvedProject = (process.env.LETTA_PROJECT ?? 'copywriting-demo').trim();
      console.log('🔍 Memory Service - Using project:', JSON.stringify(resolvedProject));
      
      // Use typed interface to handle SDK variations
      const client = this.client as LettaClient & { agents: { blocks: { list: (agentId: string, options?: unknown) => Promise<MemoryBlock[]> & { withRawResponse?: () => Promise<{ data: MemoryBlock[], rawResponse: Response }> } } } };
      
      if (!client.agents.blocks?.list) {
        throw new Error('Blocks API not available in current SDK version');
      }
      
      // Try with explicit header override as backup
      const blocks = await client.agents.blocks.list(agentId, {
        headers: { 'X-Project': resolvedProject }
      }).catch(async (error: unknown) => {
        console.log('🔄 Retrying with raw response for debugging...');
        
        // Try with withRawResponse for detailed error info
        try {
          const result = await client.agents.blocks.list(agentId).withRawResponse();
          console.log('🔍 Raw response status:', result.rawResponse.status);
          console.log('🔍 Raw response headers:', Object.fromEntries(result.rawResponse.headers.entries()));
          return result.data;
        } catch (rawError) {
          console.error('🔍 Raw response error:', rawError);
          throw error; // Re-throw original error
        }
      });
      
      console.log(`Found ${blocks.length} memory blocks`);
      
      return blocks.map((block: MemoryBlock) => ({
        id: block.id,
        label: block.label || 'unlabeled',
        value: block.value || '',
        description: block.description || ''
      }));
    } catch (error) {
      console.error('Failed to list memory blocks:', error);
      throw new Error(`Failed to list memory blocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update lead company research memory block
  async updateLeadResearch(agentId: string, research: string): Promise<void> {
    try {
      console.log('Updating lead-company-research memory block...');
      
      // First, list existing blocks
      const blocks = await this.listBlocks(agentId);
      const researchBlock = blocks.find(block => block.label === 'lead-company-research');
      
      const client = this.client as LettaClient & { agents: { blocks: { modify: (agentId: string, label: string, options: { value: string, description?: string }) => Promise<MemoryBlock>, create: (agentId: string, options: { label: string, value: string, description?: string }) => Promise<MemoryBlock> } } };
      
      if (researchBlock) {
        // Modify existing block
        console.log('Found existing lead-company-research block, updating...');
        
        if (!client.agents.blocks?.modify) {
          throw new Error('Block modify method not available in current SDK version');
        }
        
        await client.agents.blocks.modify(agentId, 'lead-company-research', {
          value: research.substring(0, 4500), // Truncate to fit memory limits
          description: 'Company research data from Exa API - used for email personalization'
        });
        
        console.log('Memory block updated successfully');
      } else {
        // Create new block workflow: create → attach → modify
        console.log('Creating new lead-company-research block...');
        
        if (!client.blocks?.create || !client.agents.blocks?.attach) {
          throw new Error('Block creation/attachment methods not available in current SDK version');
        }
        
        // Step 1: Create global block
        const newBlock = await client.blocks.create({
          label: 'lead-company-research',
          value: research.substring(0, 4500),
          description: 'Company research data from Exa API - used for email personalization'
        });
        
        console.log('Created new block with ID:', newBlock.id);
        
        // Step 2: Attach to agent
        await client.agents.blocks.attach(agentId, newBlock.id);
        console.log('Attached block to agent');
        
        // Step 3: Optional - modify if needed (already has content from creation)
        console.log('Memory block created and attached successfully');
      }
    } catch (error) {
      console.error('Failed to update lead research memory:', error);
      throw new Error(`Failed to update memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Find block by label
  async findBlockByLabel(agentId: string, label: string): Promise<MemoryBlock | null> {
    try {
      const blocks = await this.listBlocks(agentId);
      return blocks.find(block => block.label === label) || null;
    } catch (error) {
      console.error(`Failed to find block with label ${label}:`, error);
      return null;
    }
  }

  // Generic method to update any memory block by label
  async updateBlockByLabel(
    agentId: string, 
    label: string, 
    value: string, 
    description?: string
  ): Promise<void> {
    try {
      console.log(`Updating memory block with label: ${label}`);
      
      const blocks = await this.listBlocks(agentId);
      const targetBlock = blocks.find(block => block.label === label);
      
      const client = this.client as LettaClient & { agents: { blocks: { modify: (agentId: string, label: string, options: { value: string, description?: string }) => Promise<MemoryBlock>, create: (agentId: string, options: { label: string, value: string, description?: string }) => Promise<MemoryBlock> } } };
      
      if (targetBlock) {
        // Update existing block
        if (!client.agents.blocks?.modify) {
          throw new Error('Block modify method not available in current SDK version');
        }
        
        await client.agents.blocks.modify(agentId, label, {
          value: value.substring(0, 4500), // Truncate to fit memory limits
          description: description || targetBlock.description || `Updated ${label} block`
        });
        
        console.log(`Memory block ${label} updated successfully`);
      } else {
        // Create new block
        if (!client.blocks?.create || !client.agents.blocks?.attach) {
          throw new Error('Block creation/attachment methods not available in current SDK version');
        }
        
        const newBlock = await client.blocks.create({
          label,
          value: value.substring(0, 4500),
          description: description || `${label} memory block`
        });
        
        await client.agents.blocks.attach(agentId, newBlock.id);
        console.log(`Memory block ${label} created and attached successfully`);
      }
    } catch (error) {
      console.error(`Failed to update memory block ${label}:`, error);
      throw new Error(`Failed to update memory block: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}