export interface CampaignFormData {
  linkedinUrl: string;
  companyDomain: string;
  searchQuery: string;
  leadName: string;
  leadTitle: string;
  companyName: string;
  senderName: string;
  senderEmail: string;
  numberOfEmails: number;
  numberOfThreads: number;
  language: 'english' | 'spanish' | 'french' | 'german' | 'italian';
  formality: 'formal' | 'semi-formal' | 'casual';
}

export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text: string;
  highlights?: string[];
  score: number;
}

export interface ExaApiResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
}

export interface LettaMessageType {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  messageType: 'assistant_message' | 'tool_call_message' | 'tool_return_message' | 'reasoning_message';
  toolCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  toolReturn?: any;
  reasoning?: string;
  timestamp: string;
}

export interface LettaResponse {
  messages: LettaMessageType[];
  usage?: {
    stepCount?: number;
    completionTokens?: number;
    promptTokens?: number;
  };
}

export interface EmailGenerationRequest {
  campaignData: CampaignFormData;
  researchResults: ExaSearchResult[];
}

export interface WorkflowResults {
  step1_research: {
    success: boolean;
    researchId: string;
    contentLength: number;
    cost: number;
    duration: number;
  };
  step2_memories: {
    success: boolean;
    agentName: string;
    memoryCount: number;
    memoryLabels: string[];
    blocks: any[];
  };
  step3_memory_update: {
    success: boolean;
    blockId?: string;
    blockLabel?: string;
    updated?: boolean;
    error?: string;
  };
  step4_chat_reset: {
    success: boolean;
    previousMessageCount?: number;
    note?: string;
    error?: string;
  };
  step5_email_generation: {
    success: boolean;
    messageCount?: number;
    reasoning?: any[];
    toolCalls?: any[];
    assistantMessages?: any[];
    allMessages?: any[];
    campaignData?: {
      requestSent: any;
      agentProcessed: boolean;
    };
    error?: string;
  };
}

export interface ApplicationState {
  step: 'form' | 'processing' | 'complete';
  formData?: CampaignFormData;
  researchResults?: ExaSearchResult[];
  workflowResults?: WorkflowResults;
  agentMessages?: LettaMessageType[];
  finalEmail?: string;
  error?: string;
}