import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== API Key Verification ===');
    console.log('LETTA_API_KEY exists:', !!process.env.LETTA_API_KEY);
    console.log('LETTA_API_KEY length:', process.env.LETTA_API_KEY?.length);
    console.log('LETTA_API_KEY first 10 chars:', process.env.LETTA_API_KEY?.substring(0, 10));
    console.log('LETTA_API_KEY last 10 chars:', process.env.LETTA_API_KEY?.substring(-10));
    console.log('LETTA_AGENT_ID exists:', !!process.env.LETTA_AGENT_ID);
    console.log('LETTA_AGENT_ID:', process.env.LETTA_AGENT_ID);
    console.log('LETTA_PROJECT:', process.env.LETTA_PROJECT);

    // Check for common issues
    const apiKey = process.env.LETTA_API_KEY;
    const issues = [];

    if (!apiKey) {
      issues.push('API key is missing');
    } else {
      if (apiKey.includes(' ')) issues.push('API key contains spaces');
      if (apiKey.includes('\n')) issues.push('API key contains newlines');
      if (apiKey.length < 50) issues.push('API key seems too short');
      if (!apiKey.startsWith('yosk-')) issues.push('API key doesn\'t start with expected prefix');
    }

    const agentId = process.env.LETTA_AGENT_ID;
    if (!agentId) {
      issues.push('Agent ID is missing');
    } else {
      if (!agentId.startsWith('agent-')) issues.push('Agent ID doesn\'t start with "agent-"');
    }

    return NextResponse.json({
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey?.length,
      apiKeyPrefix: apiKey?.substring(0, 10),
      agentIdExists: !!agentId,
      agentId: agentId,
      project: process.env.LETTA_PROJECT,
      issues: issues,
      recommendation: issues.length > 0 
        ? 'Please check your .env.local file and regenerate your API key if needed'
        : 'Credentials look properly formatted'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to verify credentials',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}