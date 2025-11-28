import { NextRequest, NextResponse } from 'next/server';

// ✅ Excluded from static export (proxied to backend via vercel.json)
export const dynamic = 'force-dynamic';
export const revalidate = false;
export const runtime = 'nodejs';

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

    // SECURITY FIX: Require signature verification
    if (!signature) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Signature required',
          message: 'Please provide a signature to verify ownership'
        },
        { status: 400 }
      );
    }
    
    // SECURITY FIX: Basic rate limiting (simple in-memory implementation)
    // Note: For production, use a proper rate limiting service
    interface RateLimitRecord {
      count: number;
      resetTime: number;
    }
    
    type RateLimitStore = Map<string, RateLimitRecord>;
    
    const rateLimitKey = `faucet-claim:${userAddress}`;
    const globalObj = global as typeof globalThis & { rateLimitStore?: RateLimitStore };
    const rateLimitStore = globalObj.rateLimitStore || new Map<string, RateLimitRecord>();
    const now = Date.now();
    const record = rateLimitStore.get(rateLimitKey);
    const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
    const RATE_LIMIT_MAX = 3; // 3 claims per minute per address
    
    if (record && now < record.resetTime) {
      if (record.count >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.'
          },
          { status: 429 }
        );
      }
      record.count++;
    } else {
      rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }
    globalObj.rateLimitStore = rateLimitStore;
    
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