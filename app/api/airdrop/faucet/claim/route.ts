import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://bitredict-backend.fly.dev';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, signature } = body;

    // Validate request
    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid wallet address format',
          message: 'Please provide a valid Ethereum address'
        },
        { status: 400 }
      );
    }

    // TODO: Add additional validation here such as:
    // - Rate limiting
    // - Signature verification
    // - Smart contract interaction
    
    // For now, proxy to backend (in production, this might interact directly with smart contracts)
    const backendResponse = await fetch(`${BACKEND_URL}/airdrop/faucet/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userAddress, signature }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || 'Failed to claim faucet',
          message: data.message || 'An error occurred while processing your claim'
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing faucet claim:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
} 