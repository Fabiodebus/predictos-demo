'use client';

import React, { useState } from 'react';
import { Mail, Copy, Check, Download, Send, Eye, Edit, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { WorkflowResults, CampaignFormData } from '@/types/campaign';
import { copyToClipboard } from '@/lib/utils';

interface EmailOutputProps {
  workflowResults?: WorkflowResults;
  campaignData?: CampaignFormData;
  onStartOver?: () => void;
}

export default function EmailOutput({ workflowResults, campaignData, onStartOver }: EmailOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState<Set<number>>(new Set());

  // Helper functions for email parsing
  const extractSubject = (email: string): string => {
    if (typeof email !== 'string') {
      console.warn('extractSubject received non-string:', typeof email, email);
      return 'Personalized Outreach';
    }
    const subjectMatch = email.match(/Subject:\s*(.+)/i);
    return subjectMatch ? subjectMatch[1].trim() : 'Personalized Outreach';
  };

  const extractEmailBody = (email: string): string => {
    if (typeof email !== 'string') {
      console.warn('extractEmailBody received non-string:', typeof email, email);
      return '';
    }
    // Remove subject line and return the body
    return email.replace(/Subject:\s*.+\n?/i, '').trim();
  };

  // Helper function to convert email body to string
  const getBodyString = (body: any): string => {
    if (typeof body === 'string') return body;
    if (Array.isArray(body)) {
      return body.map((part: any) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          return part.content || part.text || part.body || String(part);
        }
        return String(part || '');
      }).join('');
    }
    if (body && typeof body === 'object') {
      return body.content || body.text || body.body || String(body);
    }
    return String(body || '');
  };

  // Parse JSON email campaign from agent response
  const parseEmailCampaign = (content: string) => {
    try {
      // First, convert content to string if it's not already
      const contentStr = getBodyString(content);
      
      // Look for different JSON patterns that the agent might return
      
      // Pattern 1: Look for email_sequence structure
      let jsonMatch = contentStr.match(/\{[\s\S]*"email_sequence"[\s\S]*\}/);
      if (jsonMatch) {
        const campaign = JSON.parse(jsonMatch[0]);
        if (campaign.email_sequence && Array.isArray(campaign.email_sequence)) {
          console.log('Found email_sequence with', campaign.email_sequence.length, 'emails');
          return campaign;
        }
      }
      
      // Pattern 2: Look for thread_1 structure (like in our test response)
      jsonMatch = contentStr.match(/\{[\s\S]*"thread_1"[\s\S]*\}/);
      if (jsonMatch) {
        const threadData = JSON.parse(jsonMatch[0]);
        console.log('Found thread structure:', threadData);
        
        // Convert thread structure to email_sequence format
        const emails: any[] = [];
        Object.keys(threadData).forEach(threadKey => {
          const thread = threadData[threadKey];
          Object.keys(thread).forEach(emailKey => {
            const email = thread[emailKey];
            emails.push({
              subject: email.subject,
              body: email.body,
              email_number: emails.length + 1
            });
          });
        });
        
        if (emails.length > 0) {
          console.log('Converted thread structure to', emails.length, 'emails');
          return { email_sequence: emails };
        }
      }
      
      // Pattern 3: Look for any JSON with subject and body
      const subjectMatch = contentStr.match(/"subject":\s*"([^"]+)"/);
      const bodyMatch = contentStr.match(/"body":\s*"([^"]*(?:\\.[^"]*)*)"/);
      
      if (subjectMatch && bodyMatch) {
        console.log('Found single email with subject/body pattern');
        return {
          email_sequence: [{
            subject: subjectMatch[1],
            body: bodyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
            email_number: 1
          }]
        };
      }
      
      console.warn('No recognized email structure found in:', contentStr.substring(0, 300));
      
    } catch (error) {
      console.warn('Failed to parse email campaign JSON:', error);
      console.warn('Content was:', content);
    }
    return null;
  };

  // Extract all emails from workflow results
  const getAllEmails = (): Array<{subject: string, body: string, email_number: number}> => {
    if (!workflowResults?.step5_email_generation) {
      console.warn('No step5_email_generation in workflowResults');
      return [];
    }
    
    // 1) Prefer server-mapped emails, remap `content` -> `body`
    let emails: Array<{subject: string, body: string, email_number: number}> = (workflowResults.step5_email_generation.assistantMessages || [])
      .map((e: any, index: number) => ({ 
        subject: e.subject || `Email ${index + 1}`, 
        body: e.content || e.body || '', 
        email_number: index + 1 
      }))
      .filter((e: any) => e.subject || e.body);

    // 2) Fallback: parse final assistant text locally
    if (!emails.length) {
      const raw = workflowResults.step5_email_generation.final_assistant_text || 
                  workflowResults.final_assistant_text || 
                  workflowResults.step5_email_generation.assistantMessages?.[0]?.content || '';
      
      console.log('🧩 Parsing raw content locally:', raw.slice(0, 200) + '...');
      const obj = extractCampaignJson(raw);
      if (obj) {
        const mappedEmails = mapCampaignToEmails(obj);
        emails = mappedEmails.map((email, index) => ({
          subject: email.subject,
          body: email.body,
          email_number: index + 1
        }));
        console.log('✅ Local parsing succeeded:', emails.length, 'emails');
      } else {
        console.warn('❌ Local parsing failed');
      }
    }

    console.log('📧 Final emails returned:', emails.length);
    return emails;
  };

  // Extract the final email from workflow results
  const getFinalEmail = (): string => {
    const emails = getAllEmails();
    if (emails.length > 0) {
      const firstEmail = emails[0];
      return `Subject: ${firstEmail.subject}\n\n${firstEmail.body}`;
    }
    return '';
  };

  const finalEmail = getFinalEmail();
  const agentFailed = !workflowResults?.step5_email_generation?.success;
  const agentError = workflowResults?.step5_email_generation?.error;

  const handleCopyEmail = async () => {
    if (await copyToClipboard(finalEmail)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([finalEmail], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `email_${campaignData?.companyDomain || 'unknown'}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatEmailForDisplay = (email: string) => {
    if (isPreview) {
      return email.split('\n').map((line, index) => (
        <p key={index} className={`${line.trim() === '' ? 'mb-4' : 'mb-2'}`}>
          {line || '\u00A0'}
        </p>
      ));
    }
    return email;
  };

  // Get raw agent output for fallback display
  const getRawAgentOutput = (): string => {
    if (!workflowResults?.step5_email_generation) return '';
    
    // Try multiple sources for raw output
    const raw = workflowResults.step5_email_generation.final_assistant_text || 
                workflowResults.final_assistant_text || 
                workflowResults.step5_email_generation.assistantMessages?.[0]?.content || '';
    
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) return raw.join('');
    return String(raw || '');
  };

  // Show failure state with detailed error handling
  if (agentFailed || !finalEmail) {
    const rawOutput = getRawAgentOutput();
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Email Generation Issue
              </CardTitle>
            </div>
            <span className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
              Partial Success
            </span>
          </div>
          <CardDescription>
            The research and memory steps completed successfully, but the email generation encountered an issue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Raw Agent Output Fallback */}
          {rawOutput && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Raw Agent Response</span>
              </h4>
              <div className="max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-3 rounded border">
                  {rawOutput.slice(0, 4000)}
                </pre>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                The agent generated content above, but it couldn't be parsed into the expected email format. 
                You may be able to manually extract useful content from this response.
              </p>
              {rawOutput.length > 4000 && (
                <p className="text-xs text-gray-400 mt-1">
                  (Showing first 4000 characters of {rawOutput.length} total)
                </p>
              )}
            </div>
          )}

          {/* Error Details */}
          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              What Happened?
            </h4>
            <p className="text-amber-800 dark:text-amber-300 text-sm mb-3">
              {agentError || 'The Letta agent failed to generate an email response. This may be due to API overload or a temporary service issue.'}
            </p>
            <p className="text-amber-800 dark:text-amber-300 text-sm">
              <strong>Good news:</strong> Your company research was successfully completed and stored in the agent's memory. You can retry the email generation.
            </p>
          </div>

          {/* Success Summary */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              ✅ Completed Successfully
            </h4>
            <div className="space-y-1 text-sm text-green-800 dark:text-green-300">
              <div>• Company research with Exa API</div>
              <div>• Agent memory updated with research data</div>
              <div>• Chat history reset for clean generation</div>
              <div>• Campaign settings configured</div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Next Steps
            </h4>
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              You can retry the email generation since all the research data is already prepared. 
              Alternatively, you can check the agent reasoning section above to see exactly what happened.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          {onStartOver && (
            <>
              <Button
                onClick={onStartOver}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={onStartOver}
                variant="outline"
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    );
  }

  const emails = getAllEmails();

  const toggleEmail = (emailNumber: number) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailNumber)) {
      newExpanded.delete(emailNumber);
    } else {
      newExpanded.add(emailNumber);
    }
    setExpandedEmails(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Email Campaign Header */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Generated Email Campaign</span>
            <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
              {emails.length} email{emails.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
          <CardDescription>
            Your personalized email sequence crafted by AI analysis
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Email Sequence */}
      {emails.map((email, index) => (
        <Card key={email.email_number} className="w-full max-w-4xl mx-auto">
          <CardContent className="p-0">
            {/* Email Header */}
            <div 
              className="border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => toggleEmail(email.email_number)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Email Number Badge */}
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {email.email_number}
                  </div>
                  
                  {/* Email Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Email {email.email_number}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          → {campaignData?.leadName || 'Lead'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {index === 0 ? 'Day 1' : index === 1 ? 'Day 3' : 'Day 7'}
                      </span>
                    </div>
                    
                    <div className="mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {email.subject}
                      </h3>
                    </div>
                    
                    {!expandedEmails.has(email.email_number) ? (
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {email.body.substring(0, 100)}...
                      </p>
                    ) : null}
                  </div>
                </div>
                
                {/* Expand Icon */}
                <div className="ml-4">
                  {expandedEmails.has(email.email_number) ? (
                    <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>

            {/* Full Email Content */}
            {expandedEmails.has(email.email_number) && (
              <div className="p-6 bg-white dark:bg-gray-950">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Subject: {email.subject}
                    </h4>
                  </div>
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-line text-gray-900 dark:text-gray-100">
                      {email.body}
                    </div>
                  </div>
                </div>

                {/* Email Actions */}
                <div className="mt-4 flex space-x-2">
                  <Button
                    onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Email {email.email_number}</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Campaign Actions */}
      {emails.length > 0 && (
        <Card className="w-full max-w-4xl mx-auto">
          <CardFooter>
            <div className="flex space-x-3 w-full">
              <Button
                onClick={async () => {
                  const allEmailsText = emails.map((email, index) => 
                    `=== EMAIL ${email.email_number} ===\nSubject: ${email.subject}\n\n${email.body}`
                  ).join('\n\n');
                  if (await copyToClipboard(allEmailsText)) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                variant="outline"
                className="flex items-center space-x-2 flex-1"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy All Emails'}</span>
              </Button>
              <Button
                onClick={() => {
                  const allEmailsText = emails.map((email, index) => 
                    `=== EMAIL ${email.email_number} ===\nSubject: ${email.subject}\n\n${email.body}`
                  ).join('\n\n');
                  const element = document.createElement('a');
                  const file = new Blob([allEmailsText], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = `email_campaign_${campaignData?.companyDomain || 'unknown'}_${Date.now()}.txt`;
                  element.click();
                }}
                variant="outline"
                className="flex items-center space-x-2 flex-1"
              >
                <Download className="h-4 w-4" />
                <span>Download Campaign</span>
              </Button>
              {onStartOver && (
                <Button
                  onClick={onStartOver}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Another
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}