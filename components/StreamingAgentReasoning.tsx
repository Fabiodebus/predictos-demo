'use client';

import React from 'react';
import { Brain, CheckCircle, Clock, Loader2, Zap, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StreamingState } from '@/hooks/useStreamingWorkflow';

interface StreamingAgentReasoningProps {
  streamingState: StreamingState;
}

export default function StreamingAgentReasoning({ streamingState }: StreamingAgentReasoningProps) {
  if (!streamingState.isStreaming && streamingState.reasoningSteps.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <CardTitle className="text-xl text-foreground">
            AI Agent Analysis
          </CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Watch the AI agent analyze your research and craft personalized email copy
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center space-x-3 p-4 border border-border rounded-lg bg-card">
            {streamingState.isStreaming ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            ) : streamingState.error ? (
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <div>
              <h4 className="font-medium text-foreground">
                {streamingState.error ? 'Analysis Failed' : 
                 streamingState.isStreaming ? 'Analyzing...' : 'Analysis Complete'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {streamingState.error || streamingState.statusMessage}
              </p>
            </div>
          </div>

          {/* Reasoning Content */}
          {streamingState.reasoningSteps.length > 0 && (
            <div className="space-y-4">
              {streamingState.reasoningSteps.map((reasoningStep, idx) => (
                <div key={idx} className="relative">
                  <div className="border border-border rounded-lg p-6 bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium text-foreground">Agent Thinking</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {reasoningStep.timestamp ? new Date(reasoningStep.timestamp).toLocaleTimeString() : 'Processing...'}
                      </span>
                    </div>
                    
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {reasoningStep.content}
                        {/* Live cursor effect for active step */}
                        {idx === streamingState.reasoningSteps.length - 1 && streamingState.isStreaming && (
                          <span className="inline-block w-0.5 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show message when no reasoning yet */}
          {streamingState.reasoningSteps.length === 0 && streamingState.isStreaming && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2 text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span>Waiting for agent to start analyzing...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}