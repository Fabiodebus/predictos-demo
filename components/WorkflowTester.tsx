'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface WorkflowResult {
  success: boolean;
  workflow?: string;
  results?: {
    step1_research: any;
    step2_memories: any;
    step3_memory_update: any;
    step4_chat_reset: any;
    step5_email_generation: any;
  };
  error?: string;
}

export default function WorkflowTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  
  // Test form data
  const [formData, setFormData] = useState({
    searchQuery: 'recent AI developments artificial intelligence funding',
    companyDomain: 'anthropic.com',
    personName: 'Test Person',
    personTitle: 'CTO',
    companyName: 'Anthropic',
    linkedinUrl: 'https://linkedin.com/in/test',
    numberOfEmails: 1,
    language: 'German',
    formality: 'professional'
  });

  const runWorkflow = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/agent-workflow-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: formData.searchQuery,
          companyDomain: formData.companyDomain,
          leadInfo: {
            personName: formData.personName,
            personTitle: formData.personTitle,
            companyName: formData.companyName,
            linkedinUrl: formData.linkedinUrl,
            numberOfEmails: formData.numberOfEmails,
            language: formData.language,
            formality: formData.formality
          }
        })
      });

      const data = await response.json();
      setResult(data);
      
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkMemories = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/agent-memories');
      const data = await response.json();
      
      setResult({
        success: data.success,
        workflow: 'memories-only',
        results: {
          step1_research: null,
          step2_memories: data,
          step3_memory_update: null,
          step4_chat_reset: null,
          step5_email_generation: null
        }
      });
      
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Agent Workflow Tester</h1>
        <p className="text-gray-600">Test the complete Exa → Letta agent workflow</p>
      </div>

      {/* Test Form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search Query</label>
            <Textarea
              value={formData.searchQuery}
              onChange={(e) => setFormData(prev => ({ ...prev, searchQuery: e.target.value }))}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company Domain</label>
            <Input
              value={formData.companyDomain}
              onChange={(e) => setFormData(prev => ({ ...prev, companyDomain: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Person Name</label>
            <Input
              value={formData.personName}
              onChange={(e) => setFormData(prev => ({ ...prev, personName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Person Title</label>
            <Input
              value={formData.personTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, personTitle: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <Button onClick={runWorkflow} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Run Complete Workflow
          </Button>
          <Button variant="outline" onClick={checkMemories} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Check Agent Memories Only
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Results {result.success ? '✅' : '❌'}
          </h2>
          
          {result.error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800">{result.error}</p>
            </div>
          )}
          
          {result.results && (
            <div className="space-y-4">
              {/* Step 1: Research */}
              {result.results.step1_research && (
                <div className="border rounded p-4">
                  <h3 className="font-medium text-green-700">Step 1: Exa Research</h3>
                  <p>✅ Found {result.results.step1_research.resultCount} results</p>
                  {result.results.step1_research.autoprompt && (
                    <p className="text-sm text-gray-600 mt-1">
                      Autoprompt: {result.results.step1_research.autoprompt.substring(0, 100)}...
                    </p>
                  )}
                </div>
              )}
              
              {/* Step 2: Memories */}
              {result.results.step2_memories && (
                <div className="border rounded p-4">
                  <h3 className="font-medium text-blue-700">Step 2: Agent Memories</h3>
                  <p>{result.results.step2_memories.success ? '✅' : '❌'} Found {result.results.step2_memories.memoryCount} memories</p>
                  {result.results.step2_memories.memoryLabels && (
                    <p className="text-sm text-gray-600 mt-1">
                      Labels: {result.results.step2_memories.memoryLabels.join(', ')}
                    </p>
                  )}
                </div>
              )}
              
              {/* Step 3: Memory Update */}
              {result.results.step3_memory_update && (
                <div className="border rounded p-4">
                  <h3 className="font-medium text-purple-700">Step 3: Memory Update</h3>
                  <p>{result.results.step3_memory_update.success ? '✅' : '❌'} Memory update</p>
                  {result.results.step3_memory_update.error && (
                    <p className="text-sm text-red-600 mt-1">{result.results.step3_memory_update.error}</p>
                  )}
                </div>
              )}
              
              {/* Step 4: Chat Reset */}
              {result.results.step4_chat_reset && (
                <div className="border rounded p-4">
                  <h3 className="font-medium text-orange-700">Step 4: Chat Reset</h3>
                  <p>✅ {result.results.step4_chat_reset.note}</p>
                </div>
              )}
              
              {/* Step 5: Agent Message */}
              {result.results.step5_email_generation && (
                <div className="border rounded p-4">
                  <h3 className="font-medium text-indigo-700">Step 5: Agent Response</h3>
                  <p>{result.results.step5_email_generation.success ? '✅' : '❌'} Agent messaging</p>
                  {result.results.step5_email_generation.messageCount && (
                    <p className="text-sm text-gray-600 mt-1">
                      Generated {result.results.step5_email_generation.messageCount} messages
                    </p>
                  )}
                  {result.results.step5_email_generation.error && (
                    <p className="text-sm text-red-600 mt-1">{result.results.step5_email_generation.error}</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Raw JSON for debugging */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">View Raw JSON</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}