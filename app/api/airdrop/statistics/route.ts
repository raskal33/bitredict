import { NextResponse } from 'next/server';

// ✅ Excluded from static export (proxied to backend via vercel.json)
export const dynamic = 'force-dynamic';
export const revalidate = false;
export const runtime = 'nodejs';

const BACKEND_URL = process.env.BACKEND_URL || 'https://bitredict-backend.fly.dev';

export async function GET() {
  try {
    // Proxy request to backend
    const backendResponse = await fetch(`${BACKEND_URL}/airdrop/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch statistics' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching airdrop statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 