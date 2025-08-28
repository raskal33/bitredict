import { NextRequest, NextResponse } from 'next/server';

// The actual Somnia RPC endpoint
const SOMNIA_RPC_URL = 'https://dream-rpc.somnia.network/';

export async function POST(request: NextRequest) {
  try {
    // Get the JSON-RPC request from the client
    const body = await request.json();
    
    console.log('🔄 RPC Proxy: Forwarding request to Somnia network');
    
    // Forward the request to the actual Somnia RPC endpoint
    const response = await fetch(SOMNIA_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ RPC Proxy: Somnia RPC returned error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'RPC request failed', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the response with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('❌ RPC Proxy: Error forwarding request:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
