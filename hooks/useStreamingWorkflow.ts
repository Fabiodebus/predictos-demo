import { useState, useRef, useCallback } from 'react';
import { CampaignFormData } from '@/types/campaign';

export interface StreamingUpdate {
  type: string;
  step?: number;
  message?: string;
  content?: string;
  results?: any;
  error?: string;
  success?: boolean;
  timestamp?: string;
}

export interface StreamingState {
  isStreaming: boolean;
  currentStep: number;
  statusMessage: string;
  reasoningSteps: Array<{
    step: number;
    content: string;
    timestamp: string;
  }>;
  emailContent: string;
  final_assistant_text: string;
  workflowResults: any;
  error: string | null;
}

export function useStreamingWorkflow() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentStep: 0,
    statusMessage: '',
    reasoningSteps: [],
    emailContent: '',
    final_assistant_text: '',
    workflowResults: null,
    error: null
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startStreaming = useCallback(async (formData: CampaignFormData) => {
    // Reset state
    setState({
      isStreaming: true,
      currentStep: 0,
      statusMessage: 'Initializing...',
      reasoningSteps: [],
      emailContent: '',
      final_assistant_text: '',
      workflowResults: null,
      error: null
    });

    try {
      // Create a POST request to start the streaming workflow
      const response = await fetch('/api/agent-workflow-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      // Read the stream
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamingUpdate = JSON.parse(line.slice(6));
              handleStreamingUpdate(data);
            } catch (e) {
              console.warn('Failed to parse SSE data:', line, e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: error instanceof Error ? error.message : 'Streaming failed'
      }));
    }
  }, []);

  const handleStreamingUpdate = (update: StreamingUpdate) => {
    setState(prev => {
      const newState = { ...prev };

      switch (update.type) {
        case 'status':
          newState.currentStep = update.step || prev.currentStep;
          newState.statusMessage = update.message || '';
          break;

        case 'reasoning_step':
          // Replace reasoning content with accumulated content from server
          newState.reasoningSteps = [
            {
              step: 1,
              content: update.content || '',
              timestamp: update.timestamp || new Date().toISOString()
            }
          ];
          newState.statusMessage = `Agent thinking...`;
          break;

        case 'email_generated':
          newState.emailContent = update.content || '';
          newState.statusMessage = 'Email generated successfully!';
          break;

        case 'workflow_complete':
          newState.isStreaming = false;
          newState.workflowResults = update.results;
          newState.statusMessage = 'Workflow completed successfully!';
          break;

        case 'workflow_error':
        case 'fatal_error':
          newState.isStreaming = false;
          newState.error = update.error || 'Unknown error occurred';
          newState.statusMessage = 'Workflow failed';
          break;

        case 'research_complete':
          newState.statusMessage = 'Research completed, connecting to agent...';
          // Store research results for display
          if (!newState.workflowResults) {
            newState.workflowResults = {};
          }
          if (update.results) {
            newState.workflowResults.step1_research = update.results;
          }
          break;

        case 'agent_ready':
          newState.statusMessage = 'Agent ready, updating memory...';
          // Store agent discovery results
          if (!newState.workflowResults) {
            newState.workflowResults = {};
          }
          if (update.results) {
            newState.workflowResults.step2_agent_discovery = update.results;
          }
          break;

        case 'memory_updated':
          newState.statusMessage = 'Memory updated, preparing agent...';
          // Store memory update results
          if (!newState.workflowResults) {
            newState.workflowResults = {};
          }
          if (update.results) {
            newState.workflowResults.step3_memory_management = update.results;
          }
          break;

        case 'state_reset':
          newState.statusMessage = 'Agent prepared, starting email generation...';
          // Store state reset results
          if (!newState.workflowResults) {
            newState.workflowResults = {};
          }
          if (update.results) {
            newState.workflowResults.step4_state_reset = update.results;
          }
          break;

        case 'agent_thinking':
          newState.statusMessage = update.message || 'Agent is thinking...';
          break;

        case 'final_assistant_text':
          newState.final_assistant_text = update.content || '';
          break;
      }

      return newState;
    });
  };

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isStreaming: false
    }));
  }, []);

  const reset = useCallback(() => {
    stopStreaming();
    setState({
      isStreaming: false,
      currentStep: 0,
      statusMessage: '',
      reasoningSteps: [],
      emailContent: '',
      final_assistant_text: '',
      workflowResults: null,
      error: null
    });
  }, [stopStreaming]);

  return {
    ...state,
    startStreaming,
    stopStreaming,
    reset
  };
}