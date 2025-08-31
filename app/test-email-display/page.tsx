'use client';

import React from 'react';
import EmailOutput from '@/components/EmailOutput';
import { WorkflowResults, CampaignFormData } from '@/types/campaign';

// Mock successful workflow results based on our test response
const mockWorkflowResults: WorkflowResults = {
  step1_research: {
    success: true,
    researchId: 'test-123',
    contentLength: 1000,
    cost: 0.10,
    duration: 5000
  },
  step2_memories: {
    success: true,
    agentName: 'test-agent',
    memoryCount: 9,
    memoryLabels: [],
    blocks: []
  },
  step3_memory_update: {
    success: true,
    blockId: 'test-block',
    blockLabel: 'lead-company-research',
    updated: true
  },
  step4_chat_reset: {
    success: true,
    previousMessageCount: 0,
    note: 'Reset successful'
  },
  step5_agent_message: {
    success: true,
    messageCount: 4,
    reasoning: [
      {
        content: "I need to process this JSON input for an email campaign. Let me analyze what I have: 1. Campaign information: - 1 thread, 1 email - English language - Professional formality 2. Lead information: - Company domain: anthropic.com - LinkedIn URL provided"
      }
    ],
    toolCalls: [],
    assistantMessages: [
      {
        content: `**Inner Monologue (Campaign Strategy):**

Analyzing the lead - Anthropic is an AI safety company, not a typical IT services firm that would be Predict PA's ICP. However, they may still have B2B sales challenges, especially as they scale their enterprise offerings.

The angle I'll take:
- Focus on their potential B2B/enterprise sales needs as they commercialize AI solutions
- Reference their growth stage (founded 2021, rapid scaling)
- Position Predict PA as helping tech companies build predictable enterprise pipelines
- Keep it exploratory and humble since they're outside core ICP

---

**Email Campaign Output:**

\`\`\`json
{
  "thread_1": {
    "email_1": {
      "subject": "Enterprise pipeline at Anthropic",
      "body": "Hi there,\\n\\nI came across Anthropic while researching AI companies expanding their enterprise footprint. With your focus on building helpful, harmless, and honest AI systems, I imagine scaling B2B relationships is becoming increasingly important.\\n\\nMany rapidly growing tech companies tell us that enterprise sales feels unpredictable - qualified meetings happen sporadically despite significant investment in outbound efforts. The challenge intensifies when targeting Fortune 500 decision-makers who are notoriously hard to reach at the right moment.\\n\\nWe've helped companies like Randstad Digital build predictable pipelines with 20+ qualified enterprise meetings monthly using signal-based intelligence that identifies when prospects are actually evaluating solutions - not just cold outreach hoping for timing.\\n\\nWould building more predictable enterprise pipeline be relevant for Anthropic's growth plans, or is this not a current priority?\\n\\nBest regards,\\n[Your name]",
      "metadata": {
        "thread_index": 1,
        "email_index": 1,
        "cta_type": "soft",
        "personalization_elements": ["company_mission", "growth_stage", "enterprise_focus"],
        "word_count": 138
      }
    }
  }
}
\`\`\``
      }
    ],
    allMessages: [],
    campaignData: {
      requestSent: {},
      agentProcessed: true
    }
  }
};

const mockCampaignData: CampaignFormData = {
  linkedinUrl: 'https://linkedin.com/in/test',
  companyDomain: 'anthropic.com',
  searchQuery: 'AI safety research',
  leadName: 'John Doe',
  leadTitle: 'CTO',
  companyName: 'Anthropic',
  senderName: 'Test Sender',
  senderEmail: 'test@example.com',
  numberOfEmails: 1,
  numberOfThreads: 1,
  language: 'english',
  formality: 'professional'
};

export default function TestEmailDisplayPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Test Email Display
          </h1>
          <p className="text-muted-foreground">
            Testing EmailOutput component with successful Letta response
          </p>
        </div>
        
        <EmailOutput 
          workflowResults={mockWorkflowResults}
          campaignData={mockCampaignData}
          onStartOver={() => console.log('Start over clicked')}
        />
      </div>
    </div>
  );
}