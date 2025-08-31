'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ExaResearchTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('artificial intelligence recent developments funding');
  const [companyDomain, setCompanyDomain] = useState('anthropic.com');

  const testExaResearch = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('Starting NEW Exa research API test...');
      const response = await fetch('/api/test-exa-research-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery,
          companyDomain
        })
      });

      const data = await response.json();
      console.log('New Exa research result:', data);
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
        <h1 className="text-2xl font-bold mb-2">NEW Exa Research API Tester</h1>
        <p className="text-gray-600">Test the new async research API that provides comprehensive research reports</p>
      </div>

      {/* Test Form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Research Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search Query</label>
            <Textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rows={2}
              placeholder="Enter your search query..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company Domain (optional)</label>
            <Input
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              placeholder="e.g., anthropic.com"
            />
          </div>
        </div>
        
        <Button onClick={testExaResearch} disabled={isLoading} className="mt-6">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Test Exa Research API
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
              {/* API Stats */}
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="font-medium text-green-800 mb-2">NEW Research API Call Verified ✅</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Duration:</span> {result.duration}
                  </div>
                  <div>
                    <span className="font-medium">Research ID:</span> {result.researchId}
                  </div>
                  <div>
                    <span className="font-medium">Content Length:</span> {result.output?.contentLength} chars
                  </div>
                  <div>
                    <span className="font-medium">API Type:</span> {result.apiType}
                  </div>
                </div>
                {result.cost && (
                  <div className="mt-2 text-xs text-green-700">
                    <strong>Cost:</strong> ${result.cost.total} | 
                    Searches: {result.cost.numSearches} | 
                    Pages: {result.cost.numPages} | 
                    Tokens: {result.cost.reasoningTokens}
                  </div>
                )}
              </div>

              {/* Research Instructions */}
              {result.instructions && (
                <div className="border rounded p-4">
                  <h3 className="font-medium mb-2">Research Instructions</h3>
                  <p className="text-sm text-gray-700 italic">"{result.instructions.substring(0, 300)}..."</p>
                </div>
              )}

              {/* Research Content */}
              {result.output?.contentPreview && (
                <div className="border rounded p-4">
                  <h3 className="font-medium mb-2">Research Results Preview</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-60 overflow-auto">
                    {result.output.contentPreview}
                  </div>
                  {result.output.fullContent && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 text-sm">View Full Research Report</summary>
                      <div className="mt-2 bg-gray-100 p-3 rounded text-xs max-h-96 overflow-auto whitespace-pre-wrap">
                        {result.output.fullContent}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Results Summary */}
              {result.results && result.results.length > 0 && (
                <div className="border rounded p-4">
                  <h3 className="font-medium mb-2">Search Results ({result.results.length})</h3>
                  <div className="space-y-3">
                    {result.results.slice(0, 3).map((res: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <h4 className="font-medium text-sm text-blue-800">
                          #{res.index}: {res.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1">{res.url}</p>
                        <p className="text-xs text-gray-700">{res.textPreview}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          Score: {res.score} | Length: {res.textLength} chars
                          {res.publishedDate && ` | Published: ${res.publishedDate}`}
                          {res.highlights && ` | Highlights: ${res.highlights.length}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full First Result for Verification */}
              {result.fullFirstResult && (
                <details className="border rounded p-4">
                  <summary className="cursor-pointer font-medium text-blue-700">
                    View Full First Result (Verification)
                  </summary>
                  <div className="mt-4 space-y-2 text-sm">
                    <div><strong>Title:</strong> {result.fullFirstResult.title}</div>
                    <div><strong>URL:</strong> {result.fullFirstResult.url}</div>
                    <div><strong>Author:</strong> {result.fullFirstResult.author || 'N/A'}</div>
                    <div><strong>Published:</strong> {result.fullFirstResult.publishedDate || 'N/A'}</div>
                    <div><strong>Score:</strong> {result.fullFirstResult.score}</div>
                    <div><strong>Text Length:</strong> {result.fullFirstResult.text.length} characters</div>
                    {result.fullFirstResult.highlights && result.fullFirstResult.highlights.length > 0 && (
                      <div>
                        <strong>Highlights:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {result.fullFirstResult.highlights.map((highlight: string, i: number) => (
                            <li key={i} className="text-yellow-800 bg-yellow-100 px-2 py-1 rounded my-1">
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <strong>Full Text Preview (first 500 chars):</strong>
                      <div className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                        {result.fullFirstResult.text.substring(0, 500)}...
                      </div>
                    </div>
                  </div>
                </details>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="font-medium text-red-800 mb-2">API Call Failed ❌</h3>
              <p className="text-red-700 mb-2">{result.error}</p>
              <div className="text-sm text-red-600">
                API Key Present: {result.apiKeyPresent ? 'Yes' : 'No'}
              </div>
            </div>
          )}
          
          {/* Raw JSON for debugging */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">View Raw JSON Response</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}