import { NextResponse } from 'next/server';

// ✅ Skip this route during static export (handled by Vercel proxy)
export const dynamic = 'force-dynamic';
export const revalidate = false;
export const runtime = 'nodejs';

const BACKEND_URL = process.env.BACKEND_URL || 'https://bitredict-backend.fly.dev';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    // Validate address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Proxy request to backend with cache-busting
    const backendResponse = await fetch(`${BACKEND_URL}/airdrop/eligibility/${address}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store', // Next.js cache control
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to check eligibility' },
        { status: backendResponse.status }
      );
    }

    // ✅ Add cache-busting headers to response
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error checking airdrop eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 