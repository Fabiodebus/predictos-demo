'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function MemoryUpdateTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testValue, setTestValue] = useState('This is a test update to verify memory block modification works correctly. Testing with simple text content.');

  const testMemoryUpdate = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('Testing memory update with value:', testValue);
      const response = await fetch('/api/test-memory-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testValue }) // Even though the endpoint doesn't use this, for consistency
      });

      const data = await response.json();
      console.log('Memory update test result:', data);
      setResult(data);
      
    } catch (error) {
      console.error('Test failed:', error);
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
        <h1 className="text-2xl font-bold mb-2">Letta Memory Update Tester</h1>
        <p className="text-gray-600">Test updating the lead-company-research memory block</p>
      </div>

      {/* Test Form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Test Value to Store</label>
          <Textarea
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            rows={4}
            placeholder="Enter test content to store in memory..."
          />
        </div>
        
        <Button onClick={testMemoryUpdate} disabled={isLoading} className="mt-4">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Test Memory Update
        </Button>
      </Card>

      {/* Results */}
      {result && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Results {result.success ? '✅ SUCCESS' : '❌ FAILED'}
          </h2>
          
          {result.success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="font-medium text-green-800 mb-2">Memory Update Successful ✅</h3>
                <div className="text-sm">
                  <div><strong>Status:</strong> {result.status}</div>
                  <div><strong>Block ID:</strong> {result.updatedBlock?.id}</div>
                  <div><strong>Block Label:</strong> {result.updatedBlock?.label}</div>
                  <div><strong>Updated Value Length:</strong> {result.updatedBlock?.value?.length} chars</div>
                </div>
              </div>
              
              {result.updatedBlock && (
                <details className="border rounded p-4">
                  <summary className="cursor-pointer font-medium">View Updated Block Data</summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(result.updatedBlock, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="font-medium text-red-800 mb-2">Memory Update Failed ❌</h3>
              <p className="text-red-700 mb-2"><strong>Error:</strong> {result.error}</p>
              <div className="text-sm text-red-600 space-y-1">
                <div><strong>Status:</strong> {result.status} {result.statusText}</div>
                {result.errorDetails && (
                  <div>
                    <strong>Details:</strong>
                    <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-auto max-h-40">
                      {result.errorDetails}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Raw JSON for debugging */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">View Raw Response</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}