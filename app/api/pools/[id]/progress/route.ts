import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://bitredict-backend.fly.dev';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: poolId } = await params;

    if (!poolId || isNaN(parseInt(poolId))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid pool ID is required'
        },
        { status: 400 }
      );
    }

    // Fetch pool progress from backend
    const response = await fetch(`${API_BASE_URL}/api/guided-markets/pools/${poolId}/progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If backend doesn't have progress data, return default values
      return NextResponse.json({
        success: true,
        data: {
          bettorCount: 0,
          lpCount: 0,
          fillPercentage: 0,
          totalPoolSize: '0',
          currentBettorStake: '0',
          currentLpStake: '0',
          lastActivity: new Date().toISOString()
        }
      });
    }

    const data = await response.json();

    if (!data.success) {
      // Return default values if backend fails
      return NextResponse.json({
        success: true,
        data: {
          bettorCount: 0,
          lpCount: 0,
          fillPercentage: 0,
          totalPoolSize: '0',
          currentBettorStake: '0',
          currentLpStake: '0',
          lastActivity: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: data.data
    });

  } catch (error) {
    console.error('Error fetching pool progress:', error);
    
    // Return default values on error
    return NextResponse.json({
      success: true,
      data: {
        bettorCount: 0,
        lpCount: 0,
        fillPercentage: 0,
        totalPoolSize: '0',
        currentBettorStake: '0',
        currentLpStake: '0',
        lastActivity: new Date().toISOString()
      }
    });
  }
}
