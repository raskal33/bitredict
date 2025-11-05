import { NextRequest, NextResponse } from 'next/server';

interface UserBet {
  id: string;
  poolId: string;
  market: string;
  category: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  totalBet: number;
  amountWon: number;
  profitLoss: number;
  profitLossPercent: number;
  result: 'won' | 'lost' | 'pending' | 'active';
  currency: string;
  timestamp: string;
  settledAt: string | null;
  isSettled: boolean;
  creatorSideWon: boolean;
}

interface BetData {
  bet_id?: string;
  transaction_hash?: string;
  pool_id: string;
  amount: string;
  is_for_outcome: boolean;
  created_at: string;
  settled_at?: string;
  title?: string;
  category?: string;
  league?: string;
  home_team?: string;
  away_team?: string;
  is_settled: boolean;
  creator_side_won: boolean;
  use_bitr?: boolean;
  odds?: number; // Pool odds for P&L calculation
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // 'all', 'active', 'closed'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    console.log('🎯 Fetching user bets for address:', { address, status, limit, offset });

    if (!address) {
      return NextResponse.json({
        success: false,
        message: 'Address is required'
      }, { status: 400 });
    }

    // Fetch bets from backend
    const response = await fetch(`${backendUrl}/api/pool-bets/user/${address}?page=${Math.floor(offset / limit) + 1}&limit=${limit}&sortBy=created_at&sortOrder=desc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    console.log('📊 Backend response structure:', {
      success: data.success,
      dataExists: !!data.data,
      betsExists: !!data.data?.bets,
      betsLength: data.data?.bets?.length || 0,
      firstBet: data.data?.bets?.[0] || null,
      rawResponse: JSON.stringify(data).substring(0, 500) // First 500 chars for debugging
    });

    // Check if we have bets data - backend returns {success: true, data: {bets: [...], pagination: {...}}}
    if (!data.success || !data.data || !Array.isArray(data.data.bets)) {
      console.warn('⚠️ Invalid bets response structure:', data);
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalBets: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        message: 'No bets data available'
      });
    }

    // Process bets to determine win/loss status and calculate profit/loss
    const processedBets = data.data.bets.map((bet: BetData) => {
      const betAmount = parseFloat(bet.amount || '0') / 1e18; // Convert from Wei
      const isSettled = Boolean(bet.is_settled);
      const creatorSideWon = Boolean(bet.creator_side_won);
      const isForOutcome = Boolean(bet.is_for_outcome);
      
      let result: 'won' | 'lost' | 'pending' | 'active' = 'active';
      let amountWon = 0;
      let profitLoss = 0;
      let profitLossPercent = 0;
      
      if (isSettled) {
        // Determine if bettor won or lost
        const bettorWon = (isForOutcome && !creatorSideWon) || (!isForOutcome && creatorSideWon);
        result = bettorWon ? 'won' : 'lost';
        
        if (bettorWon) {
          // Calculate payout using actual pool odds
          // odds is stored as integer (e.g., 150 for 1.5x, 200 for 2.0x)
          const oddsValue = bet.odds ? (typeof bet.odds === 'string' ? parseFloat(bet.odds) : bet.odds) : 200; // Default to 2.0x if no odds
          const oddsMultiplier = oddsValue / 100; // Convert to decimal (150 -> 1.5x)
          const grossPayout = betAmount * oddsMultiplier;
          const fee = grossPayout * 0.05; // 5% fee
          amountWon = grossPayout - fee;
          profitLoss = amountWon - betAmount;
          profitLossPercent = betAmount > 0 ? (profitLoss / betAmount) * 100 : 0;
        } else {
          amountWon = 0;
          profitLoss = -betAmount;
          profitLossPercent = -100;
        }
      } else {
        result = 'pending';
      }
      
      return {
        id: bet.bet_id || bet.transaction_hash || '',
        poolId: String(bet.pool_id),
        market: bet.title || `${bet.home_team || ''} vs ${bet.away_team || ''}`.trim() || bet.category || 'Unknown Market',
        category: bet.category || 'General',
        league: bet.league || '',
        homeTeam: bet.home_team || '',
        awayTeam: bet.away_team || '',
        totalBet: betAmount,
        amountWon: amountWon,
        profitLoss: profitLoss,
        profitLossPercent: profitLossPercent,
        result: result,
        isForOutcome: isForOutcome,
        currency: bet.use_bitr ? 'BITR' : 'STT',
        timestamp: bet.created_at,
        settledAt: bet.settled_at || null,
        isSettled: isSettled,
        creatorSideWon: creatorSideWon
      };
    }).filter((bet: UserBet) => {
      // Filter by status
      if (status === 'active') return bet.result === 'active' || bet.result === 'pending';
      if (status === 'closed') return bet.result === 'won' || bet.result === 'lost';
      return true; // 'all'
    });

           console.log('✅ User bets fetched and processed successfully:', processedBets.length);

           return NextResponse.json({
             success: true,
             data: processedBets,  // Return bets array directly, not nested in {bets: []}
             pagination: data.data?.pagination || {
               currentPage: 1,
               totalPages: 1,
               totalBets: processedBets.length,
               hasNextPage: false,
               hasPrevPage: false
             },
             message: 'User bets fetched successfully'
           }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user bets:', error);

    return NextResponse.json({
      success: false,
      data: [],  // Return empty array directly
      message: 'Failed to fetch user bets'
    }, { status: 500 });
  }
}
