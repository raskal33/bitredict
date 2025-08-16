import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerAddress, predictions, cycleId } = body;

    console.log('🎯 Placing slip:', { playerAddress, predictionsCount: predictions?.length, cycleId });

    if (!playerAddress || !predictions || !Array.isArray(predictions) || predictions.length !== 10) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request: playerAddress and 10 predictions required'
      }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    const response = await fetch(`${backendUrl}/api/oddyssey/place-slip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress,
        predictions,
        cycleId
      }),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Slip placed successfully:', data);

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Slip placed successfully'
    });

  } catch (error) {
    console.error('❌ Error placing slip:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to place slip'
    }, { status: 500 });
  }
} 