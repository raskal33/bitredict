import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string; commentId: string }> }
) {
  try {
    const { poolId, commentId } = await params;
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/api/social/pools/${poolId}/comments/${commentId}/like`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error proxying comment like:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to like comment',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

