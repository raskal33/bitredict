import { NextRequest, NextResponse } from 'next/server';

const RPC_URLS = [
  'https://dream-rpc.somnia.network/',
  'https://rpc.ankr.com/somnia_testnet/c8e336679a7fe85909f310fbbdd5fbb18d3b7560b1d3eca7aa97874b0bb81e97',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Try each RPC URL until one works
    for (const rpcUrl of RPC_URLS) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        });

        if (response.ok) {
          const data = await response.text();
          return new NextResponse(data, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          });
        }
      } catch (error) {
        console.warn(`RPC URL ${rpcUrl} failed:`, error);
        continue;
      }
    }

    // If all RPC URLs fail
    return NextResponse.json(
      { error: 'All RPC endpoints failed' },
      { status: 503 }
    );
  } catch (error) {
    console.error('RPC Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal proxy error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}