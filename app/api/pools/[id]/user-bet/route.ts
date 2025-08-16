import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface BetQueryResult {
  total_bet_amount: string;
  bet_count: string;
  last_bet_date: string;
  bet_side: 'yes' | 'no';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: poolId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get('address');

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      );
    }

    // Check if user has bet on this pool
    const bets = (await query(`
      SELECT 
        COALESCE(SUM(bet_amount), '0') as total_bet_amount,
        COUNT(*) as bet_count,
        MAX(created_at) as last_bet_date,
        bet_side
      FROM pool_bets 
      WHERE pool_id = ? AND user_address = ?
      GROUP BY bet_side
    `, [poolId, userAddress]) as unknown) as BetQueryResult[];

    const hasBet = bets.length > 0;
    const totalBetAmount = hasBet ? bets.reduce((sum: number, bet: BetQueryResult) => sum + parseFloat(bet.total_bet_amount), 0) : 0;

    return NextResponse.json({
      success: true,
      data: {
        hasBet,
        betAmount: totalBetAmount,
        betCount: hasBet ? bets.reduce((sum: number, bet: BetQueryResult) => sum + parseInt(bet.bet_count), 0) : 0,
        lastBetDate: hasBet ? bets[0].last_bet_date : null,
        betSides: bets.map((bet: BetQueryResult) => ({
          side: bet.bet_side,
          amount: parseFloat(bet.total_bet_amount),
          count: parseInt(bet.bet_count)
        }))
      }
    });

  } catch (error) {
    console.error('Error checking user bet status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check bet status' },
      { status: 500 }
    );
  }
} 