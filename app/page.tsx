'use client';

import React, { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import MultiStepForm from '@/components/MultiStepForm';
import ResearchResults from '@/components/ResearchResults';
import AgentReasoning from '@/components/AgentReasoning';
import StreamingAgentReasoning from '@/components/StreamingAgentReasoning';
import EmailOutput from '@/components/EmailOutput';
import { useStreamingWorkflow } from '@/hooks/useStreamingWorkflow';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Brain, Mail, CheckCircle, Clock, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { CampaignFormData } from '@/types/campaign';

type AppStep = 'welcome' | 'form' | 'research-loading' | 'research-results' | 'agent-processing' | 'email-results';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome');
  const [formData, setFormData] = useState<CampaignFormData | null>(null);
  const [workflowResults, setWorkflowResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailCopy, setShowEmailCopy] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true); // Enable streaming by default
  const streamingWorkflow = useStreamingWorkflow();

  const handleEnterPlatform = () => {
    setCurrentStep('form');
  };

  const handleBackToWelcome = () => {
    setCurrentStep('welcome');
    setFormData(null);
    setWorkflowResults(null);
    setError(null);
    setShowEmailCopy(false);
  };

  const handleContinueToEmail = async () => {
    if (useStreaming) {
      // Use streaming workflow
      setCurrentStep('agent-processing');
      setShowEmailCopy(false);
      if (formData) {
        streamingWorkflow.startStreaming(formData);
      }
    } else {
      // Use original workflow
      setCurrentStep('agent-processing');
      setShowEmailCopy(false);
    }
  };

  const handleSeeEmailCopy = () => {
    setShowEmailCopy(true);
  };

  const handleRetryEmailGeneration = async () => {
    if (!formData) return;
    
    // Reset the email copy display and restart email generation only
    setShowEmailCopy(false);
    
    try {
      setIsLoading(true);
      
      // Call the workflow API again, but it will skip research since it's cached
      const response = await fetch('/api/agent-workflow-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to retry email generation');
      }

      // Handle SSE stream properly
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let finalResults = null;

      if (!reader) {
        throw new Error('No response body reader available');
      }

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'workflow_complete') {
                finalResults = data.results;
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line, e);
            }
          }
        }
      }

      if (finalResults) {
        setWorkflowResults(finalResults);
      } else {
        throw new Error('No workflow results received');
      }
      
    } catch (error) {
      console.error('Retry failed:', error);
      setError(error instanceof Error ? error.message : 'Retry failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: CampaignFormData) => {
    setFormData(data);
    setIsLoading(true);
    setError(null);
    setCurrentStep('research-loading');

    try {
      // Complete workflow: Research + Memory Update + Agent Generation
      const payload = {
        searchQuery: data.searchQuery,
        companyDomain: data.companyDomain?.trim(),
        linkedinUrl: data.linkedinUrl,
        numberOfEmails: Number(data.numberOfEmails ?? 3),
        numberOfThreads: Number(data.numberOfThreads ?? 1),
        language: data.language ?? "german",
        formality: data.formality ?? "Sie",
        leadName: data.leadName,
        leadTitle: data.leadTitle,
        companyName: data.companyName,
        leadInfo: {
          personName: data.leadName,
          personTitle: data.leadTitle,
          companyName: data.companyName,
          linkedinUrl: data.linkedinUrl
        }
      };
      
      const workflowResponse = await fetch('/api/agent-workflow-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!workflowResponse.ok) {
        throw new Error(`HTTP ${workflowResponse.status}: Failed to complete workflow`);
      }

      // Handle SSE stream properly
      const reader = workflowResponse.body?.getReader();
      const decoder = new TextDecoder();
      let workflowData = null;
      let finalEmails = null;
      let rawAssistantText = null;

      if (!reader) {
        throw new Error('No response body reader available');
      }

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            
            try {
              const data = JSON.parse(dataStr);
              
              // Capture the canonical final_emails event
              if (data.type === 'final_emails') {
                finalEmails = data.emails;
                rawAssistantText = data.rawAssistantText;
                console.log('📧 Received final_emails:', finalEmails?.length || 0, 'emails');
              }
              
              if (data.type === 'workflow_complete') {
                workflowData = data;
                
                // Inject final_emails if we have them
                if (finalEmails && workflowData.results?.step5_email_generation) {
                  workflowData.results.step5_email_generation.finalEmails = finalEmails;
                  workflowData.results.step5_email_generation.rawAssistantText = rawAssistantText;
                }
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line, e);
            }
          }
        }
      }

      if (workflowData) {
        console.log('Complete workflow results:', workflowData);
        setWorkflowResults(workflowData.results);
      } else {
        throw new Error('No workflow results received');
      }
      
      // Show research results and stop here - user manually continues
      setCurrentStep('research-results');

    } catch (error) {
      console.error('Campaign generation error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setCurrentStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const renderResearchLoadingScreen = () => (
    <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
      <div className="text-center space-y-8">
        {/* Simple loading indicator */}
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-[#0201ff]/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 bg-[#0201ff]/40 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 bg-[#0201ff] rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Simple text */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Company Research Started...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we gather company intelligence
          </p>
        </div>

        <p className="text-muted-foreground text-sm">
          This may take 2-4 minutes depending on research complexity...
        </p>
      </div>
    </div>
  );

  const renderResearchResultsScreen = () => (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Company Research Found
          </h1>
          <p className="text-muted-foreground">
            Successfully gathered comprehensive company intelligence
          </p>
        </div>
        
        {workflowResults && (
          <ResearchResults 
            workflowResults={workflowResults}
            searchQuery={formData?.searchQuery || ''}
            companyDomain={formData?.companyDomain}
            isLoading={false}
            onContinue={handleContinueToEmail}
          />
        )}

      </div>
    </div>
  );

  const renderAgentProcessingScreen = () => (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <TextShimmerWave 
            className="text-3xl font-bold text-foreground" 
            duration={1.5}
          >
            AI Copywriting Agent
          </TextShimmerWave>
          <p className="text-muted-foreground mt-4">
            {useStreaming 
              ? 'Watch your AI agent analyze research and craft personalized content in real-time'
              : 'Your Letta agent is analyzing research and crafting personalized content'
            }
          </p>
        </div>

        {/* Streaming Components */}
        {useStreaming ? (
          <>
            <StreamingAgentReasoning streamingState={streamingWorkflow} />

            {/* Show "See Email Copy" button when streaming is complete */}
            {streamingWorkflow.workflowResults?.step5_email_generation?.success && !showEmailCopy && (
              <div className="text-center mt-8">
                <Button
                  onClick={handleSeeEmailCopy}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 px-8 py-3"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  See Email Copy
                </Button>
              </div>
            )}

            {/* Show "Try Again" button when streaming fails */}
            {streamingWorkflow.error && (
              <div className="text-center mt-8 space-y-4">
                <div className="flex space-x-3 justify-center">
                  <Button
                    onClick={() => formData && streamingWorkflow.startStreaming(formData)}
                    size="lg"
                    disabled={streamingWorkflow.isStreaming}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 px-8 py-3"
                  >
                    {streamingWorkflow.isStreaming ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Try Again
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleBackToWelcome}
                    size="lg"
                    variant="outline"
                    className="px-6 py-3"
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            )}

            {/* Show EmailOutput when button is clicked (using streaming results) */}
            {showEmailCopy && streamingWorkflow.workflowResults && (
              <EmailOutput 
                workflowResults={streamingWorkflow.workflowResults}
                campaignData={formData || undefined}
                onStartOver={handleBackToWelcome}
              />
            )}
          </>
        ) : (
          /* Original Non-Streaming Components */
          <>
            {workflowResults && (
              <AgentReasoning 
                workflowResults={workflowResults}
                formData={formData || undefined}
                isLoading={false}
              />
            )}

            {/* Original buttons for non-streaming mode */}
            {workflowResults?.step5_email_generation?.success && !showEmailCopy && (
              <div className="text-center mt-8">
                <Button
                  onClick={handleSeeEmailCopy}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 px-8 py-3"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  See Email Copy
                </Button>
              </div>
            )}

            {workflowResults?.step5_email_generation?.success === false && (
              <div className="text-center mt-8 space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
                        Email generation incomplete
                      </p>
                      <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                        Your research is saved and ready to try again
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 justify-center">
                  <Button
                    onClick={handleRetryEmailGeneration}
                    size="lg"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 px-8 py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Try Again
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleBackToWelcome}
                    size="lg"
                    variant="outline"
                    className="px-6 py-3"
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            )}

            {showEmailCopy && workflowResults && (
              <EmailOutput 
                workflowResults={workflowResults}
                campaignData={formData || undefined}
                onStartOver={handleBackToWelcome}
              />
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderEmailResultsScreen = () => (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Campaign Generated
          </h1>
          <p className="text-muted-foreground">
            Your personalized email campaign is ready
          </p>
        </div>

        <EmailOutput 
          workflowResults={workflowResults}
          campaignData={formData || undefined}
          onStartOver={handleBackToWelcome}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'welcome' && (
        <WelcomeScreen onEnter={handleEnterPlatform} />
      )}

      {currentStep === 'form' && (
        <div className="min-h-screen bg-background">
          <MultiStepForm 
            onSubmit={handleFormSubmit}
            onBack={handleBackToWelcome}
            isLoading={isLoading}
          />
        </div>
      )}

      {currentStep === 'research-loading' && renderResearchLoadingScreen()}
      {currentStep === 'research-results' && renderResearchResultsScreen()}
      {currentStep === 'agent-processing' && renderAgentProcessingScreen()}
      {currentStep === 'email-results' && renderEmailResultsScreen()}
    </div>
  );
}