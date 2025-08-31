import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Testing Memory Update Only ===');

    const testValue = "This is a test update from the API endpoint to verify memory block modification works correctly.";
    
    console.log('Agent ID:', process.env.LETTA_AGENT_ID);
    console.log('Test value length:', testValue.length);

    const updateResponse = await fetch(`https://api.letta.com/v1/agents/${process.env.LETTA_AGENT_ID}/core-memory/blocks/lead-company-research`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${process.env.LETTA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        project_id: "6093c633-6b6b-44f7-ad74-27c9b15b1e88",
        value: testValue
      })
    });

    console.log('Update response status:', updateResponse.status);
    console.log('Update response headers:', Object.fromEntries(updateResponse.headers.entries()));

    if (updateResponse.ok) {
      const updatedBlock = await updateResponse.json();
      console.log('SUCCESS! Updated block:', updatedBlock);
      
      return NextResponse.json({
        success: true,
        status: updateResponse.status,
        updatedBlock: updatedBlock,
        testValue: testValue
      });
    } else {
      const errorText = await updateResponse.text();
      console.error('FAILED! Error response:', errorText);
      
      return NextResponse.json({
        success: false,
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        errorDetails: errorText,
        requestBody: {
          project_id: "6093c633-6b6b-44f7-ad74-27c9b15b1e88",
          value: testValue
        }
      });
    }

  } catch (error) {
    console.error('Exception in memory update test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Memory Update Test Endpoint',
    usage: 'POST to test memory block update with simple test value'
  });
}