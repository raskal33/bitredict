import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PoolContractService } from '@/services/poolContractService';

interface ProgressData {
  bettor_count: string;
  lp_count: string;
  total_yes_volume: string;
  total_no_volume: string;
  creator_stake: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: poolId } = await params;

    // Get pool progress data
    const progressData = await query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN bet_side = 'yes' THEN user_address END) as bettor_count,
        COUNT(DISTINCT CASE WHEN bet_side = 'no' THEN user_address END) as lp_count,
        COALESCE(SUM(CASE WHEN bet_side = 'yes' THEN bet_amount ELSE 0 END), 0) as total_yes_volume,
        COALESCE(SUM(CASE WHEN bet_side = 'no' THEN bet_amount ELSE 0 END), 0) as total_no_volume,
        (
          SELECT creator_stake 
          FROM pools 
          WHERE id = ?
        ) as creator_stake
      FROM pool_bets 
      WHERE pool_id = ?
    `, [poolId, poolId]) as unknown as ProgressData[];

    if (progressData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          bettorCount: 0,
          lpCount: 0,
          fillPercentage: 0,
          totalVolume: '0'
        }
      });
    }

    const data = progressData[0];
    const creatorStake = parseFloat(data.creator_stake || '0');
    const totalYesVolume = parseFloat(data.total_yes_volume || '0');
    const totalNoVolume = parseFloat(data.total_no_volume || '0');
    
    // Get pool odds from contract to calculate correct pool size
    let poolOdds = 2.0; // Default odds
    let maxPoolSize = creatorStake * 0.5; // Default calculation
    
    try {
      // Fetch actual pool data from contract
      const poolData = await PoolContractService.getPool(parseInt(poolId));
      if (poolData) {
        poolOdds = poolData.odds;
        const contractCreatorStake = parseFloat(poolData.creatorStake || "0") / 1e18;
        // CORRECTED: Use contract formula: (creatorStake * 100) / (odds - 100)
        // Convert odds to contract format (1.65 -> 165)
        const contractOdds = Math.round(poolOdds * 100);
        maxPoolSize = (contractCreatorStake * 100) / (contractOdds - 100);
      }
    } catch (error) {
      console.warn('Failed to fetch contract data, using defaults:', error);
    }
    
    const fillPercentage = maxPoolSize > 0 ? (totalYesVolume / maxPoolSize) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        bettorCount: parseInt(data.bettor_count || '0'),
        lpCount: parseInt(data.lp_count || '0'),
        fillPercentage: Math.min(100, fillPercentage),
        totalVolume: (totalYesVolume + totalNoVolume).toString()
      }
    });

  } catch (error) {
    console.error('Error fetching pool progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pool progress' },
      { status: 500 }
    );
  }
}
