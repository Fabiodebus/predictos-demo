import { LettaClient } from '@letta-ai/letta-client';
import { LettaResponse, LettaMessageType } from '@/types/campaign';

// Letta SDK type definitions
interface LettaStreamEvent {
  id?: string;
  message_type?: string;
  messageType?: string;
  reasoning?: string | unknown;
  content?: string | unknown;
  assistant_message?: string | unknown;
  [key: string]: unknown;
}

interface LettaAPIResponse {
  messages: Array<Record<string, unknown>>;
  usage?: unknown;
}

interface CampaignFormData {
  linkedinUrl?: string;
  companyDomain?: string;
  numberOfEmails?: number;
  numberOfThreads?: number;
  language?: string;
  formality?: string;
  leadName?: string;
  leadTitle?: string;
  companyName?: string;
}

// Extend LettaMessageType to include ping
type ExtendedMessageType = LettaMessageType['messageType'] | 'ping';

// Helper function to safely convert any value to string
function textify(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    // Handle content arrays like [{type:"text", text:"..."}, ...]
    return val.map(textify).join("");
  }
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;           // {text: "..."}
    if (typeof o.content === "string") return o.content;     // {content: "..."}
    if (Array.isArray(o.content)) return o.content.map(textify).join("");
    try { return JSON.stringify(o); } catch { return String(o); }
  }
  return String(val);
}

// Helper functions for streamed events
function extractReasoning(evt: LettaStreamEvent): string {
  // streamed reasoning lives in evt.reasoning
  return textify(evt.reasoning ?? evt.content);
}

function extractAssistantDelta(evt: LettaStreamEvent): string {
  // streamed assistant text commonly in evt.assistant_message; fall back to evt.content
  return textify(evt.assistant_message ?? evt.content);
}

// Enhanced utility function to normalize Letta messages with proper string handling
function toLettaMessageType(m: Record<string, unknown>): LettaMessageType {
  const type = m.message_type ?? m.messageType ?? "assistant_message";

  const content =
    type === "assistant_message" ? textify(m.assistant_message ?? m.content) :
    type === "reasoning_message" ? textify(m.reasoning ?? m.content) :
    textify(m.content);

  return {
    id: m.id ?? crypto.randomUUID(),
    role: m.role ?? (type === "assistant_message" ? "assistant" : "system"),
    content,
    messageType: type,
    toolCall: m.tool_calls ?? m.toolCall ?? null,
    toolReturn: m.tool_return ?? m.toolReturn ?? null,
    reasoning: textify(m.reasoning) || undefined,
    timestamp: new Date().toISOString(),
  };
}

export class LettaService {
  private client: LettaClient;
  private agentId: string;

  constructor() {
    if (!process.env.LETTA_API_KEY) {
      throw new Error('LETTA_API_KEY is required');
    }
    if (!process.env.LETTA_AGENT_ID) {
      throw new Error('LETTA_AGENT_ID is required');
    }

    // Debug project slug
    const resolvedProject = (process.env.LETTA_PROJECT ?? 'copywriting-demo').trim();
    console.log('🔍 Debug - Using X-Project:', JSON.stringify(resolvedProject));
    console.log('🔍 Debug - Agent ID:', process.env.LETTA_AGENT_ID);
    console.log('🔍 Debug - API Key prefix:', process.env.LETTA_API_KEY?.substring(0, 20) + '...');

    this.client = new LettaClient({
      token: process.env.LETTA_API_KEY,
      project: resolvedProject,
    });
    this.agentId = process.env.LETTA_AGENT_ID;
  }

  async generateEmail(prompt: string): Promise<LettaResponse> {
    try {
      console.log('Attempting to create message with agent ID:', this.agentId);
      console.log('API key starts with:', process.env.LETTA_API_KEY?.substring(0, 10) + '...');
      
      // Create a timeout wrapper for the API call (10 minutes - Letta service can be very slow)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Letta API timeout after 600 seconds')), 600000);
      });
      
      // Use string format as required by Letta API
      const apiCall = await this.client.agents.messages.create(this.agentId, {
        messages: [{ role: 'user', content: prompt }],
        enableThinking: "true" as unknown,  // String format required by API
        maxSteps: 50
      });
      
      // Race between API call and timeout
      const response = await Promise.race([apiCall, timeoutPromise]) as LettaAPIResponse;

      const mappedMessages: LettaMessageType[] = response.messages.map(toLettaMessageType);

      return {
        messages: mappedMessages,
        usage: response.usage,
      };
    } catch (error) {
      console.error('Letta API error:', error);
      
      // Log request body for 400s for debugging
      if (error && typeof error === 'object' && 'status' in error && error.status === 400) {
        console.error('400 error - Request details:', {
          agentId: this.agentId,
          project: process.env.LETTA_PROJECT,
          promptLength: prompt.length
        });
      }
      
      throw new Error(`Failed to generate email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *streamEmailGeneration(prompt: string): AsyncGenerator<LettaMessageType> {
    let stream: AsyncIterable<LettaStreamEvent>;
    
    try {
      // Try with boolean first (preferred for SDK)
      stream = await this.client.agents.messages.createStream(this.agentId, {
        messages: [{ role: 'user', content: prompt }],
        enableThinking: true,    // Boolean first
        streamTokens: true,      // Live typing  
        includePings: true,      // Prevent disconnects
        maxSteps: 50
      } as unknown) as AsyncIterable<LettaStreamEvent>;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('enableThinking boolean failed, trying string:', errorMessage);
      // Fallback to string if type mismatch
      if (errorMessage.includes('Expected string') || errorMessage.includes('boolean')) {
        try {
          stream = await this.client.agents.messages.createStream(this.agentId, {
            messages: [{ role: 'user', content: prompt }],
            enableThinking: "true",  // String fallback
            streamTokens: true,
            includePings: true,
            maxSteps: 50
          } as unknown) as AsyncIterable<LettaStreamEvent>;
          console.log('enableThinking string fallback succeeded');
        } catch (fallbackError) {
          console.error('Both enableThinking attempts failed:', fallbackError);
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
    
    try {

      let curType = "";
      let curId = "";
      let ansBuf = "";
      let reasonBuf = "";

      for await (const evtRaw of stream) {
        const evt = evtRaw as LettaStreamEvent;
        const type = evt.message_type ?? evt.messageType ?? "";
        const id = evt.id ?? "";

        // new message boundary? flush if needed
        const boundary = type !== curType || id !== curId;
        if (boundary) {
          curType = type; 
          curId = id;
        }

        // Handle ping events for keep-alive
        if (type === "ping") {
          yield {
            id: evt.id || crypto.randomUUID(),
            role: 'system',
            content: '',
            messageType: 'ping' as ExtendedMessageType,  // Extend type for ping
            toolCall: undefined,
            toolReturn: undefined,  
            reasoning: undefined,
            timestamp: new Date().toISOString()
          } as LettaMessageType;
          continue;
        }

        if (type === "reasoning_message") {
          const delta = extractReasoning(evt);
          console.log('📝 Reasoning message:', { type, delta: delta?.slice(0, 100) + '...', total: reasonBuf.length });
          if (delta) {
            // If the model returns the full-so-far, replace; else append
            if (delta.startsWith(reasonBuf)) {
              reasonBuf = delta; // cumulative update
            } else {
              reasonBuf += delta; // true delta
            }
            yield toLettaMessageType({ ...evt, message_type: type, reasoning: reasonBuf });
          }
        } else if (type === "assistant_message") {
          const delta = extractAssistantDelta(evt);
          console.log('🤖 Assistant message:', { type, delta: delta?.slice(0, 100) + '...', total: ansBuf.length });
          if (delta) {
            // If the model returns the full-so-far, replace; else append
            if (delta.startsWith(ansBuf)) {
              ansBuf = delta; // cumulative update
            } else {
              ansBuf += delta; // true delta
            }
            yield toLettaMessageType({ ...evt, message_type: type, assistant_message: ansBuf });
          }
        } else {
          console.log('🔧 Other message type:', { type, evt: JSON.stringify(evt).slice(0, 200) + '...' });
          // tool_call_message/tool_return_message/etc — pass through if you display them
          yield toLettaMessageType(evt);
        }
      }
    } catch (error) {
      console.error('Letta streaming error:', error);
      
      // Log request body for 400s for debugging
      if (error && typeof error === 'object' && 'status' in error && error.status === 400) {
        console.error('400 streaming error - Request details:', {
          agentId: this.agentId,
          project: process.env.LETTA_PROJECT,
          promptLength: prompt.length
        });
      }
      
      throw new Error(`Failed to stream email generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Reset agent state before new conversations
  async resetAgentState(): Promise<void> {
    try {
      console.log('Resetting agent state for fresh conversation...');
      // Use typed interface to handle SDK method variations
      const client = this.client as LettaClient & { agents: { messages: { reset?: (agentId: string, options: { addDefaultInitialMessages: boolean }) => Promise<void> } } };
      if (client.agents.messages.reset) {
        await client.agents.messages.reset(this.agentId, {
          addDefaultInitialMessages: false  // Start truly cold
        });
      } else {
        console.warn('Reset method not available in current SDK version');
      }
      console.log('Agent state reset successfully');
    } catch (error) {
      console.error('Failed to reset agent state:', error);
      throw new Error(`Failed to reset agent state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get client instance for external operations
  getClient(): LettaClient {
    return this.client;
  }

  // Get agent ID
  getAgentId(): string {
    return this.agentId;
  }

  buildPrompt(campaignData: CampaignFormData, researchResults: unknown[]): string {
    const { 
      linkedinUrl, 
      companyDomain, 
      numberOfEmails, 
      numberOfThreads, 
      language, 
      formality,
      leadName,
      leadTitle,
      companyName
    } = campaignData;
    
    // Build structured JSON payload for the agent with actual user data
    const leadInfo = {
      lead_name: leadName?.split(' ')[0] || '',
      lead_surname: leadName?.split(' ').slice(1).join(' ') || '',
      lead_default_position_title: leadTitle || '',
      employer: companyName || '',
      lead_current_title: leadTitle || '',
      lead_company_domain: companyDomain || '',
      lead_company_name: companyName || '',
      linkedin_url: linkedinUrl || ''
    };

    const campaignInfo = {
      number_threads: String(numberOfThreads || 1),
      number_emails: String(numberOfEmails || 1),
      language: language || 'german',
      formality: formality || 'Sie'
    };

    // Create the structured message the agent expects
    const message = {
      campaign_information: campaignInfo,
      lead_information: leadInfo
    };

    return JSON.stringify(message, null, 2);
  }
}

// Robust JSON extractor (string-aware, balanced braces, handles markdown and malformed JSON)
// Balanced scanner that yields top-level JSON objects from an arbitrary string
function* balancedObjects(src: string): Generator<{ start: number; end: number }> {
  let inStr = false, esc = false, depth = 0, start = -1;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      esc = ch === '\\' ? !esc : false;
      if (!esc && ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') { if (depth === 0) start = i; depth++; continue; }
    if (ch === '}') { depth--; if (depth === 0 && start !== -1) { yield { start, end: i + 1 }; start = -1; } }
  }
}

export function extractCampaignJson(s: string): CampaignData | null {
  if (!s) return null;

  // 1) try ```json fenced blocks
  const blocks = Array.from(s.matchAll(/```json\s*([\s\S]*?)```/gi)).map(m => m[1].trim());
  for (const b of blocks) {
    try { 
      const o = JSON.parse(b); 
      if (o && (o.campaign || /"campaign"\s*:/.test(b))) return o; 
    } catch {}
  }

  // 2) scan whole string for balanced objects and pick the first that parses & contains "campaign"
  for (const { start, end } of balancedObjects(s)) {
    const candidate = s.slice(start, end);
    if (!candidate.includes('"campaign"')) continue;
    try { 
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && parsed.campaign) return parsed;
    } catch {}
  }

  // 3) last resort: try progressive truncation from the right on the *last* candidate that contains "campaign"
  const lastIdx = s.lastIndexOf('{"campaign"');
  if (lastIdx !== -1) {
    console.log('🔧 Attempting progressive truncation from position', lastIdx);
    // shrink from the end until parse succeeds or we give up
    for (let e = s.length; e > lastIdx + 20; e -= 50) {
      const chunk = s.slice(lastIdx, e);
      try { 
        const parsed = JSON.parse(chunk);
        if (parsed && typeof parsed === 'object') {
          console.log('✅ Progressive truncation succeeded at length', chunk.length);
          return parsed;
        }
      } catch {}
    }
  }

  console.warn('❌ Could not extract valid campaign JSON from', s.length, 'characters');
  return null;
}

export type Email = { subject: string; body: string; cta_type?: string };

// Define campaign data structure
export interface CampaignData {
  campaign?: {
    thread_1?: Record<string, EmailData>;
    emails?: EmailData[];
  };
  kampagne?: {
    faden_1?: Record<string, EmailData>;
  };
  sequence?: {
    thread_1?: Record<string, EmailData>;
  };
  emails?: EmailData[];
  email_sequence?: EmailData[];
  emails_de?: EmailData[];
  sequenz?: EmailData[];
  // Flat structure support
  email_1?: EmailData;
  email_2?: EmailData;
  email_3?: EmailData;
  mail_1?: EmailData;
  mail_2?: EmailData;
  mail_3?: EmailData;
  // Very flat structure
  subject_1?: string;
  subject_2?: string;
  subject_3?: string;
  betreff_1?: string;
  betreff_2?: string;
  betreff_3?: string;
  body_1?: string;
  body_2?: string;
  body_3?: string;
  inhalt_1?: string;
  inhalt_2?: string;
  inhalt_3?: string;
  text_1?: string;
  text_2?: string;
  text_3?: string;
  cta_1?: string;
  cta_2?: string;
  cta_3?: string;
}

export interface EmailData {
  subject?: string;
  subject_line?: string;
  titel?: string;
  betreff?: string;
  body?: string;
  körper?: string;
  inhalt?: string;
  text?: string;
  cta_type?: string;
  cta?: string;
  handlungsaufforderung?: string;
}

export function mapCampaignToEmails(obj: CampaignData | Record<string, unknown>): Email[] {
  if (!obj || typeof obj !== 'object') return [];

  const t = (x: unknown): string =>
    typeof x === 'string' ? x : String((x as Record<string, unknown>)?.text ?? (x as Record<string, unknown>)?.content ?? '');

  const asEmail = (node: EmailData | Record<string, unknown> | undefined): Email | null => {
    if (!node) return null;
    const emailData = node as EmailData;
    const subject = t(emailData.subject ?? emailData.subject_line ?? emailData.titel ?? emailData.betreff ?? '');
    const body    = t(emailData.body ?? emailData.körper ?? emailData.inhalt ?? emailData.text ?? '');
    const cta     = emailData.cta_type ?? emailData.cta ?? emailData.handlungsaufforderung;
    if (!subject && !body) return null;
    return { subject, body, cta_type: String(cta ?? '') };
  };

  const campaign = obj as CampaignData;
  
  // A) canonical nested thread
  const t1 = campaign?.campaign?.thread_1 ?? campaign?.kampagne?.faden_1 ?? campaign?.sequence?.thread_1;
  if (t1) {
    const order = ['email_1','email_2','email_3','mail_1','mail_2','mail_3'];
    const items = order.map(k => asEmail(t1[k])).filter(Boolean) as Email[];
    if (items.length) return items.slice(0, 3);
  }

  // B) arrays
  const arrays =
    campaign?.campaign?.thread_1?.emails ??
    campaign?.campaign?.emails ??
    campaign?.emails ??
    campaign?.email_sequence ??
    campaign?.emails_de ??
    campaign?.sequenz;
  if (Array.isArray(arrays)) {
    const items = arrays.map(asEmail).filter(Boolean) as Email[];
    if (items.length) return items.slice(0, 3);
  }

  // C) flat keyed
  const flat = ['email_1','email_2','email_3','mail_1','mail_2','mail_3']
    .map(k => asEmail(campaign[k])).filter(Boolean) as Email[];
  if (flat.length) return flat.slice(0, 3);

  // D) extremely flat (subject_1/body_1 …)
  const flat2: Email[] = [];
  for (let i = 1; i <= 3; i++) {
    const e = asEmail({
      subject: campaign[`subject_${i}` as keyof CampaignData] ?? campaign[`betreff_${i}` as keyof CampaignData],
      body:    campaign[`body_${i}` as keyof CampaignData]    ?? campaign[`inhalt_${i}` as keyof CampaignData] ?? campaign[`text_${i}` as keyof CampaignData],
      cta:     campaign[`cta_${i}` as keyof CampaignData]
    });
    if (e) flat2.push(e);
  }
  if (flat2.length) return flat2;

  return [];
}

// Export textify for use in other modules
export { textify };