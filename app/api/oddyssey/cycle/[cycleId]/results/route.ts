import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  let cycleId: string = 'unknown';
  try {
    const resolvedParams = await params;
    cycleId = resolvedParams.cycleId;
    console.log(`🎯 Fetching results for cycle: ${cycleId}`);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    // First try to get results from /results/all and filter by cycleId
    const response = await fetch(`${backendUrl}/api/oddyssey/results/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ All results fetched, filtering for cycle:', cycleId);

    if (data.success && data.data?.cycles?.length > 0) {
      // Find the specific cycle
      const targetCycle = data.data.cycles.find((cycle: { cycleId: number | string }) => 
        cycle.cycleId === parseInt(cycleId) || cycle.cycleId === cycleId
      );

      if (targetCycle) {
        console.log('✅ Found target cycle:', targetCycle.cycleId);
        
        return NextResponse.json({
          success: true,
          data: {
            cycleId: targetCycle.cycleId,
            isResolved: targetCycle.isResolved || targetCycle.evaluationCompleted || false,
            matchesCount: targetCycle.matchesCount || targetCycle.matches?.length || 0,
            startTime: targetCycle.startTime,
            endTime: targetCycle.endTime,
            matches: targetCycle.matches || []
          },
          message: `Results for cycle ${cycleId} fetched successfully`
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      } else {
        console.warn(`❌ Cycle ${cycleId} not found in results`);
        return NextResponse.json({
          success: false,
          data: {
            cycleId: parseInt(cycleId),
            isResolved: false,
            matchesCount: 0,
            matches: []
          },
          message: `Cycle ${cycleId} not found`
        }, { 
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
    } else {
      throw new Error('No cycles found in backend response');
    }

  } catch (error) {
    console.error(`❌ Error fetching results for cycle ${cycleId}:`, error);

    return NextResponse.json({
      success: false,
      data: {
        cycleId: parseInt(cycleId),
        isResolved: false,
        matchesCount: 0,
        matches: []
      },
      message: `Failed to fetch results for cycle ${cycleId}`
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

