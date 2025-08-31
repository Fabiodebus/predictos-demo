'use client';

import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Clock, Cog, MessageSquare, Settings, Database, RotateCcw, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { WorkflowResults, CampaignFormData } from '@/types/campaign';
import { formatDate } from '@/lib/utils';

interface AgentReasoningProps {
  workflowResults: WorkflowResults;
  formData?: CampaignFormData;
  isLoading?: boolean;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'success' | 'error' | 'pending';
  icon: React.ReactNode;
  data: any;
  timestamp?: string;
}

export default function AgentReasoning({ workflowResults, formData, isLoading = false }: AgentReasoningProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(['step5'])); // Auto-expand agent messages

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const createWorkflowSteps = (): WorkflowStep[] => {
    // Only show Email Generation step (reasoning)
    const steps: WorkflowStep[] = [
      {
        id: 'step5',
        title: 'Agent Reasoning',
        description: workflowResults.step5_email_generation?.success 
          ? `Agent analyzed research and generated ${workflowResults.step5_email_generation.messageCount || 0} messages (${workflowResults.step5_email_generation.reasoning?.length || 0} reasoning steps)`
          : `Email generation failed: ${workflowResults.step5_email_generation?.error}`,
        status: workflowResults.step5_email_generation?.success ? 'success' : 'error',
        icon: <Brain className="h-4 w-4" />,
        data: workflowResults.step5_email_generation
      }
    ];
    
    return steps;
  };

  const getStepColor = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10';
      case 'pending':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10';
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-xl">Agent Processing...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Your Letta agent is analyzing the research and generating a personalized email...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const workflowSteps = createWorkflowSteps();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
            Agent Reasoning Process
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Watch the AI agent analyze your research and craft personalized email copy
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Workflow Steps */}
          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.id}
                className={`border rounded-lg transition-all duration-200 ${getStepColor(step.status)}`}
              >
                <button
                  onClick={() => toggleStep(step.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-opacity-70 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {step.icon}
                      {getStatusIcon(step.status)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {expandedSteps.has(step.id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>

                {expandedSteps.has(step.id) && (
                  <div className="px-4 pb-4">
                    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                      {/* Special rendering for agent messages */}
                      {step.id === 'step5' && step.data.success && (
                        <div className="space-y-6">
                          {/* Agent Reasoning Stream */}
                          {step.data.reasoning && step.data.reasoning.length > 0 && (
                            <div>
                              <div className="flex items-center space-x-2 mb-4">
                                <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                  Agent Thinking Process
                                </h5>
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {step.data.reasoning.length} thought{step.data.reasoning.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              <div className="space-y-4">
                                {step.data.reasoning.map((msg: any, idx: number) => (
                                  <div key={idx} className="relative">
                                    {/* Timeline connector - dynamic height based on content */}
                                    {idx < step.data.reasoning.length - 1 && (
                                      <div className="absolute left-6 top-16 w-0.5 bg-purple-200 dark:bg-purple-800" 
                                           style={{ height: '2rem' }}></div>
                                    )}
                                    
                                    <div className="flex items-start space-x-4">
                                      {/* Step indicator with different styles for different positions */}
                                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                                        idx === 0 
                                          ? 'bg-purple-200 dark:bg-purple-900/50 border-purple-400 dark:border-purple-600' // First step
                                          : idx === step.data.reasoning.length - 1
                                          ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600' // Last step
                                          : 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700' // Middle steps
                                      }`}>
                                        <span className={`text-sm font-semibold ${
                                          idx === step.data.reasoning.length - 1 
                                            ? 'text-green-700 dark:text-green-300'
                                            : 'text-purple-700 dark:text-purple-300'
                                        }`}>
                                          {idx + 1}
                                        </span>
                                      </div>
                                      
                                      {/* Reasoning content with better typography for longer content */}
                                      <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                                        <div className="text-purple-900 dark:text-purple-100 leading-relaxed">
                                          <div className="whitespace-pre-wrap text-sm">
                                            {msg.content || msg.reasoning || 'Analyzing...'}
                                          </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs text-purple-600 dark:text-purple-400">
                                          <span>Step {idx + 1}</span>
                                          <span>{new Date().toLocaleTimeString()}</span>
                                          {idx === step.data.reasoning.length - 1 && (
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-medium">
                                              Final Step
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tool Calls (if any) */}
                          {step.data.toolCalls && step.data.toolCalls.length > 0 && (
                            <div>
                              <div className="flex items-center space-x-2 mb-3">
                                <Cog className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                  Tool Usage
                                </h5>
                              </div>
                              <div className="space-y-2">
                                {step.data.toolCalls.map((msg: any, idx: number) => (
                                  <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                                      🔧 {msg.toolCall?.name || 'Unknown Tool'}
                                    </div>
                                    {msg.toolCall?.arguments && (
                                      <pre className="text-xs bg-blue-100 dark:bg-blue-800 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(msg.toolCall.arguments, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Final Output Preview */}
                          {step.data.assistantMessages && step.data.assistantMessages.length > 0 && (
                            <div>
                              <div className="flex items-center space-x-2 mb-3">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                  Email Generated
                                </h5>
                                <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                                  {step.data.assistantMessages.length} email{step.data.assistantMessages.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                <div className="text-sm text-green-800 dark:text-green-300 mb-2">
                                  ✅ Agent successfully generated personalized email copy
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  Ready to review • Click "See Email Copy" below to view full content
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Error handling for failed step5 */}
                      {step.id === 'step5' && !step.data.success && (
                        <div className="space-y-4">
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">
                                  Agent Processing Failed
                                </h5>
                                <p className="text-red-800 dark:text-red-300 text-sm leading-relaxed">
                                  {step.data.error || 'An unknown error occurred during email generation.'}
                                </p>
                                
                                {step.data.error?.includes('timeout') && (
                                  <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded border">
                                    <h6 className="text-xs font-medium text-red-700 dark:text-red-300 mb-1 uppercase tracking-wide">
                                      What happened?
                                    </h6>
                                    <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                                      The AI agent is taking longer than expected to process your request. This can happen with complex research data or high server load. Your research data has been saved and you can try generating the email again.
                                    </p>
                                  </div>
                                )}
                                
                                <div className="mt-3 text-xs text-red-600 dark:text-red-400">
                                  💡 <strong>Good news:</strong> Your research was completed successfully and saved to the agent's memory.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Generic data display for other steps */}
                      {step.id !== 'step5' && (
                        <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-auto max-h-60">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-purple-800 dark:text-purple-300 text-sm">
            <strong>Complete Reasoning Transparency:</strong> This section shows the AI agent's complete thought process 
            as it analyzes your research data and crafts personalized email copy. Every reasoning step is logged 
            for full transparency in the email generation process.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}