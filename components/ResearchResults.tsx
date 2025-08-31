'use client';

import React, { useState } from 'react';
import { ExternalLink, Calendar, User, Search, TrendingUp, CheckCircle, DollarSign, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { WorkflowResults } from '@/types/campaign';
import { formatDate, truncateText } from '@/lib/utils';

interface ResearchResultsProps {
  workflowResults: WorkflowResults;
  searchQuery: string;
  companyDomain?: string;
  isLoading?: boolean;
  onContinue?: () => void;
}

// Helper function to parse markdown content into sections
function parseMarkdownSections(content: string) {
  const sections: Array<{ title: string; content: string[] }> = [];
  const lines = content.split('\n');
  let currentSection: { title: string; content: string[] } | null = null;
  
  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace('### ', '').trim(),
        content: []
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

// Helper function to format content and convert links
function formatContent(content: string[]): string {
  return content
    .join('\n')
    // Remove screenshot paths
    .replace(/\/var\/folders\/[^']+\.png/g, '')
    // Remove all markdown links and sources
    .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '')
    // Convert **text:** to bold HTML and fix list formatting
    .replace(/\*\*([^*]+):\*\*/g, '<strong>$1:</strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*\s+/g, '• ')
    .replace(/^\s+[\*•]\s+/gm, '• ')
    .trim();
}

export default function ResearchResults({ 
  workflowResults, 
  searchQuery, 
  companyDomain, 
  isLoading = false,
  onContinue
}: ResearchResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };
  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-xl">Researching Company...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workflowResults.step1_research.success) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-xl">Research Failed</CardTitle>
          </div>
          <CardDescription>
            We couldn&apos;t complete the research for your search query.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const research = workflowResults.step1_research;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
              Research Completed
            </CardTitle>
          </div>
          <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
            ✓ Success
          </span>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {companyDomain && (
            <span><span className="font-medium">Company:</span> {companyDomain}</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>

        {/* Research Content */}
        {research.content && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Research Findings</span>
            </h4>
            
            <div className="space-y-3">
              {parseMarkdownSections(research.content).map((section, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {section.title}
                    </span>
                    {expandedSections[section.title] ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedSections[section.title] && (
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="pt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        <div 
                          className="whitespace-pre-wrap font-sans"
                          dangerouslySetInnerHTML={{ __html: formatContent(section.content) }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Step */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-300 text-sm mb-4">
            <strong>✓ Research Complete:</strong> Comprehensive company research has been completed. Review the findings above and continue when ready to generate your personalized email campaign.
          </p>
          
          {onContinue && (
            <div className="flex justify-end">
              <button
                onClick={onContinue}
                className="bg-[#0201ff] hover:bg-[#0201ff]/90 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <span>Generate Email Campaign</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}