import { NextRequest, NextResponse } from 'next/server';

interface RecentBet {
  id: string;
  user: {
    address: string;
    username: string;
    avatar?: string;
  };
  pool: {
    id: string;
    title: string;
    category: string;
    odds: number;
    currency: 'BITR' | 'STT';
  };
  amount: string;
  side: 'creator' | 'bettor';
  timestamp: number;
  boostTier?: 'BRONZE' | 'SILVER' | 'GOLD';
  trending?: boolean;
}

// Mock data for recent bets
const mockRecentBets: RecentBet[] = [
  {
    id: "bet-1",
    user: {
      address: "0x1234...5678",
      username: "CryptoWhale",
      avatar: "/logo.png"
    },
    pool: {
      id: "pool-1",
      title: "Bitcoin will reach $100,000 by March 2025",
      category: "crypto",
      odds: 1.75,
      currency: "BITR"
    },
    amount: "2,500",
    side: "bettor",
    timestamp: Date.now() - 30000,
    boostTier: "GOLD",
    trending: true
  },
  {
    id: "bet-2",
    user: {
      address: "0x2345...6789",
      username: "StockMaster",
      avatar: "/logo.png"
    },
    pool: {
      id: "pool-2",
      title: "Tesla stock will hit $300 by end of 2024",
      category: "stocks",
      odds: 2.1,
      currency: "BITR"
    },
    amount: "1,800",
    side: "creator",
    timestamp: Date.now() - 45000,
    boostTier: "SILVER"
  },
  {
    id: "bet-3",
    user: {
      address: "0x3456...7890",
      username: "MacroGuru",
      avatar: "/logo.png"
    },
    pool: {
      id: "pool-3",
      title: "US Federal Reserve will cut rates 3 times in 2024",
      category: "economics",
      odds: 1.25,
      currency: "BITR"
    },
    amount: "5,200",
    side: "bettor",
    timestamp: Date.now() - 60000,
    boostTier: "GOLD",
    trending: true
  },
  {
    id: "bet-4",
    user: {
      address: "0x4567...8901",
      username: "TechProphet",
      avatar: "/logo.png"
    },
    pool: {
      id: "pool-4",
      title: "OpenAI will release GPT-5 by Q3 2024",
      category: "technology",
      odds: 1.8,
      currency: "STT"
    },
    amount: "3,100",
    side: "creator",
    timestamp: Date.now() - 75000,
    boostTier: "BRONZE"
  },
  {
    id: "bet-5",
    user: {
      address: "0x5678...9012",
      username: "SpaceExplorer",
      avatar: "/logo.png"
    },
    pool: {
      id: "pool-5",
      title: "SpaceX will successfully land on Mars by 2026",
      category: "space",
      odds: 2.5,
      currency: "BITR"
    },
    amount: "950",
    side: "bettor",
    timestamp: Date.now() - 90000,
    trending: true
  },
  {
    id: "bet-6",
    user: {
      address: "0x6789...0123",
      username: "EthereumOracle",
      avatar: "/logo.png"
    },
    pool: {
      id: "pool-6",
      title: "Ethereum will complete The Merge by September 2024",
      category: "crypto",
      odds: 2.1,
      currency: "BITR"
    },
    amount: "4,200",
    side: "creator",
    timestamp: Date.now() - 105000,
    boostTier: "SILVER"
  },
  {
    id: "bet-7",
    user: {
      address: "0x7890...1234",
      username: "SportsAnalyst",
      avatar: "/logo.png"
    },
    pool: {
      id: "pool-7",
      title: "Real Madrid will win Champions League 2024",
      category: "sports",
      odds: 3.2,
      currency: "BITR"
    },
    amount: "1,200",
    side: "bettor",
    timestamp: Date.now() - 120000,
    boostTier: "BRONZE"
  },
  {
    id: "bet-8",
    user: {
      address: "0x8901...2345",
      username: "ClimateExpert",
      avatar: "/logo.png"
    },
    pool: {
      id: "pool-8",
      title: "Global temperature will rise 1.5°C by 2030",
      category: "environment",
      odds: 1.4,
      currency: "STT"
    },
    amount: "2,800",
    side: "creator",
    timestamp: Date.now() - 135000,
    boostTier: "GOLD",
    trending: true
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const trending = searchParams.get('trending') === 'true';

    let filteredBets = [...mockRecentBets];

    // Filter by category if specified
    if (category && category !== 'all') {
      filteredBets = filteredBets.filter(bet => bet.pool.category === category);
    }

    // Filter by trending if specified
    if (trending) {
      filteredBets = filteredBets.filter(bet => bet.trending);
    }

    // Sort by timestamp (most recent first)
    filteredBets.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    const limitedBets = filteredBets.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limitedBets,
      meta: {
        total: filteredBets.length,
        limit,
        category,
        trending
      }
    });

  } catch (error) {
    console.error('Error fetching recent bets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recent bets' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, pool, amount, side, boostTier } = body;

    // Validate required fields
    if (!user || !pool || !amount || !side) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Create new bet entry
    const newBet: RecentBet = {
      id: `bet-${Date.now()}`,
      user,
      pool,
      amount,
      side,
      timestamp: Date.now(),
      boostTier,
      trending: Math.random() > 0.7 // 30% chance of trending
    };

    // In a real implementation, you would save this to a database
    // For now, we'll just return the created bet
    return NextResponse.json({
      success: true,
      data: newBet,
      message: 'Bet recorded successfully'
    });

  } catch (error) {
    console.error('Error creating bet:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create bet' 
      },
      { status: 500 }
    );
  }
}
