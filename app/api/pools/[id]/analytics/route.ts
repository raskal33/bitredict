import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const poolId = id;
    
    // Fetch analytics data from backend
    const backendUrl = process.env.BACKEND_URL || 'https://bitredict-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/pools/${poolId}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const backendData = await response.json();
    
    if (!backendData.success) {
      throw new Error(backendData.error || 'Failed to fetch analytics from backend');
    }

    // Transform backend data to match frontend expectations
    const analyticsData = {
      participantCount: backendData.data.participantCount || 0,
      fillPercentage: backendData.data.fillPercentage || 0,
      totalVolume: backendData.data.totalVolume || '0',
      timeToFill: backendData.data.timeToFill || null,
      betCount: backendData.data.betCount || 0,
      avgBetSize: backendData.data.avgBetSize || '0',
      creatorReputation: backendData.data.creatorReputation || 0,
      categoryRank: backendData.data.categoryRank || 0,
      isHot: backendData.data.isHot || false,
      lastActivity: backendData.data.lastActivity ? new Date(backendData.data.lastActivity) : new Date()
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching pool analytics:', error);
    
    // Return fallback data if backend is unavailable
    const fallbackData = {
      participantCount: 0,
      fillPercentage: 0,
      totalVolume: '0',
      timeToFill: null,
      betCount: 0,
      avgBetSize: '0',
      creatorReputation: 0,
      categoryRank: 0,
      isHot: false,
      lastActivity: new Date()
    };

    return NextResponse.json(fallbackData);
  }
}
