import { Pool } from "@/lib/types";

export const getDemoPoolData = (specificId?: string): Pool[] => {
  const poolVariants = [
    {
      title: "Bitcoin will reach $100,000 by March 2025",
      description: "Prediction market on Bitcoin reaching six-figure milestone before March 31, 2025. This challenge tests your ability to predict the macro crypto market trends and timing.",
      category: "crypto",
      creator: {
        address: "0x1234...5678",
        username: "CryptoSage",
        avatar: "/logo.png",
        reputation: 4.8,
        totalPools: 23,
        successRate: 78.3,
        challengeScore: 89,
        totalVolume: 450000,
        badges: ["legendary", "crypto_expert", "whale"],
        createdAt: "2024-01-15T10:30:00Z",
        bio: "Macro crypto analyst with 8 years of experience. Specialized in Bitcoin cycle analysis and institutional adoption trends."
      },
      challengeScore: 89,
      qualityScore: 94,
      difficultyTier: "very_hard",
      predictedOutcome: "Bitcoin will reach $100,000 by March 2025",
      creatorPrediction: "no", // Creator thinks it WON'T happen
      odds: 1.75,
      participants: 247,
      volume: 125000,
      image: "🪙",
      cardTheme: "cyan",
      tags: ["macro", "btc", "institutional", "halving"],
      trending: true,
      boosted: true,
      boostTier: 3,
      socialStats: {
        comments: 89,
        likes: 156,
        views: 2340,
        shares: 23
      },
      defeated: 34
    },
    {
      title: "Ethereum will complete The Merge by September 2024",
      description: "Prediction on Ethereum's transition to Proof of Stake consensus mechanism. This historic event will test your understanding of blockchain technology evolution.",
      category: "crypto",
      creator: {
        address: "0x2345...6789",
        username: "EthereumOracle",
        avatar: "/logo.png",
        reputation: 4.6,
        totalPools: 18,
        successRate: 82.1,
        challengeScore: 85,
        totalVolume: 320000,
        badges: ["ethereum_expert", "developer", "validator"],
        createdAt: "2024-02-01T14:20:00Z",
        bio: "Ethereum developer and validator with deep knowledge of PoS consensus mechanisms and network upgrades."
      },
      challengeScore: 85,
      qualityScore: 91,
      difficultyTier: "hard",
      predictedOutcome: "Ethereum will complete The Merge by September 2024",
      creatorPrediction: "yes", // Creator thinks it WILL happen
      odds: 2.1,
      participants: 189,
      volume: 89000,
      image: "🔷",
      cardTheme: "purple",
      tags: ["eth", "pos", "merge", "upgrade"],
      trending: false,
      boosted: true,
      boostTier: 2,
      socialStats: {
        comments: 67,
        likes: 134,
        views: 1890,
        shares: 18
      },
      defeated: 28
    },
    {
      title: "Tesla stock will hit $300 by end of 2024",
      description: "Prediction market on Tesla's stock performance. This challenge evaluates your ability to analyze electric vehicle market dynamics and company fundamentals.",
      category: "stocks",
      creator: {
        address: "0x3456...7890",
        username: "StockMaster",
        avatar: "/logo.png",
        reputation: 4.7,
        totalPools: 31,
        successRate: 75.9,
        challengeScore: 82,
        totalVolume: 280000,
        badges: ["stock_expert", "tesla_bull", "ev_analyst"],
        createdAt: "2024-01-20T09:15:00Z",
        bio: "Equity analyst specializing in technology and electric vehicle sectors with 12 years of market experience."
      },
      challengeScore: 82,
      qualityScore: 88,
      difficultyTier: "medium",
      predictedOutcome: "Tesla stock will hit $300 by end of 2024",
      creatorPrediction: "no", // Creator thinks it WON'T happen
      odds: 1.45,
      participants: 156,
      volume: 67000,
      image: "🚗",
      cardTheme: "green",
      tags: ["tesla", "stocks", "ev", "technology"],
      trending: true,
      boosted: false,
      boostTier: 1,
      socialStats: {
        comments: 45,
        likes: 98,
        views: 1450,
        shares: 12
      },
      defeated: 22
    },
    {
      title: "US Federal Reserve will cut rates 3 times in 2024",
      description: "Prediction on Federal Reserve monetary policy decisions. This challenge tests your understanding of macroeconomic indicators and central bank behavior.",
      category: "economics",
      creator: {
        address: "0x4567...8901",
        username: "MacroGuru",
        avatar: "/logo.png",
        reputation: 4.9,
        totalPools: 27,
        successRate: 88.2,
        challengeScore: 93,
        totalVolume: 520000,
        badges: ["macro_expert", "fed_watcher", "economist"],
        createdAt: "2024-01-10T16:45:00Z",
        bio: "Macroeconomic analyst with expertise in Federal Reserve policy and interest rate forecasting."
      },
      challengeScore: 93,
      qualityScore: 96,
      difficultyTier: "very_hard",
      predictedOutcome: "US Federal Reserve will cut rates 3 times in 2024",
      creatorPrediction: "yes", // Creator thinks it WILL happen
      odds: 1.25,
      participants: 312,
      volume: 189000,
      image: "🏦",
      cardTheme: "blue",
      tags: ["fed", "rates", "macro", "policy"],
      trending: true,
      boosted: true,
      boostTier: 3,
      socialStats: {
        comments: 123,
        likes: 234,
        views: 3450,
        shares: 34
      },
      defeated: 45
    },
    {
      title: "OpenAI will release GPT-5 by Q3 2024",
      description: "Prediction on OpenAI's next major language model release. This challenge evaluates your understanding of AI development timelines and industry trends.",
      category: "technology",
      creator: {
        address: "0x5678...9012",
        username: "AIProphet",
        avatar: "/logo.png",
        reputation: 4.5,
        totalPools: 15,
        successRate: 71.4,
        challengeScore: 78,
        totalVolume: 180000,
        badges: ["ai_expert", "openai_watcher", "researcher"],
        createdAt: "2024-02-15T11:30:00Z",
        bio: "AI researcher and industry analyst with deep knowledge of language model development and OpenAI's roadmap."
      },
      challengeScore: 78,
      qualityScore: 85,
      difficultyTier: "medium",
      predictedOutcome: "OpenAI will release GPT-5 by Q3 2024",
      creatorPrediction: "no", // Creator thinks it WON'T happen
      odds: 1.8,
      participants: 98,
      volume: 45000,
      image: "🤖",
      cardTheme: "orange",
      tags: ["ai", "openai", "gpt", "technology"],
      trending: false,
      boosted: true,
      boostTier: 2,
      socialStats: {
        comments: 34,
        likes: 78,
        views: 1200,
        shares: 8
      },
      defeated: 15
    },
    {
      title: "SpaceX will successfully land on Mars by 2026",
      description: "Prediction on SpaceX's ambitious Mars mission timeline. This challenge tests your knowledge of space exploration and engineering feasibility.",
      category: "space",
      creator: {
        address: "0x6789...0123",
        username: "SpaceExplorer",
        avatar: "/logo.png",
        reputation: 4.3,
        totalPools: 12,
        successRate: 65.8,
        challengeScore: 72,
        totalVolume: 95000,
        badges: ["space_expert", "spacex_watcher", "engineer"],
        createdAt: "2024-01-25T13:20:00Z",
        bio: "Aerospace engineer and space industry analyst with expertise in rocket technology and Mars mission planning."
      },
      challengeScore: 72,
      qualityScore: 79,
      difficultyTier: "hard",
      predictedOutcome: "SpaceX will successfully land on Mars by 2026",
      creatorPrediction: "yes", // Creator thinks it WILL happen
      odds: 2.5,
      participants: 67,
      volume: 32000,
      image: "🚀",
      cardTheme: "red",
      tags: ["spacex", "mars", "space", "rocket"],
      trending: false,
      boosted: false,
      boostTier: 1,
      socialStats: {
        comments: 23,
        likes: 45,
        views: 890,
        shares: 5
      },
      defeated: 12
    }
  ];

  if (specificId) {
    // Use the specific ID to get the same pool as the home page
    const hash = specificId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const variantIndex = Math.abs(hash) % poolVariants.length;
    const variant = poolVariants[variantIndex];

    return [{
      id: specificId,
      title: variant.title,
      description: variant.description,
      category: variant.category,
      creator: variant.creator,
      challengeScore: variant.challengeScore,
      qualityScore: variant.qualityScore,
      difficultyTier: variant.difficultyTier as "legendary" | "very_hard" | "easy" | "medium" | "hard",
      predictedOutcome: variant.predictedOutcome,
      creatorPrediction: variant.creatorPrediction as 'yes' | 'no',
      eventDetails: {
        startTime: new Date("2024-12-01T00:00:00Z"),
        endTime: new Date("2025-03-31T23:59:59Z"),
        venue: "Global Markets",
        league: "Prediction Markets",
        region: "Global"
      },
      odds: variant.odds,
      participants: variant.participants,
      volume: variant.volume,
      currency: "BITR",
      endDate: "2025-03-31",
      trending: variant.trending,
      boosted: variant.boosted,
      boostTier: variant.boostTier,
      poolType: "single",
      image: variant.image,
      cardTheme: variant.cardTheme,
      socialStats: variant.socialStats,
      comments: [],
      defeated: variant.defeated,
      conditions: [
        "Event must occur within the specified timeframe",
        "Outcome must be verifiable through official sources",
        "Settlement occurs within 24 hours of the event end date",
        "All disputes will be resolved by community consensus"
      ],
      tags: variant.tags
    }];
  }

  // Return all pools for home page
  return poolVariants.map((variant, index) => ({
    id: `pool-${index + 1}`,
    title: variant.title,
    description: variant.description,
    category: variant.category,
    creator: variant.creator,
    challengeScore: variant.challengeScore,
    qualityScore: variant.qualityScore,
    difficultyTier: variant.difficultyTier as "legendary" | "very_hard" | "easy" | "medium" | "hard",
    predictedOutcome: variant.predictedOutcome,
    creatorPrediction: variant.creatorPrediction as 'yes' | 'no',
    odds: variant.odds,
    participants: variant.participants,
    volume: variant.volume,
    currency: "BITR",
    endDate: "2025-03-31",
    trending: variant.trending,
    boosted: variant.boosted,
    boostTier: variant.boostTier,
    poolType: "single",
    image: variant.image,
    cardTheme: variant.cardTheme,
    socialStats: variant.socialStats,
    comments: [],
    defeated: variant.defeated,
    conditions: [
      "Event must occur within the specified timeframe",
      "Outcome must be verifiable through official sources", 
      "Settlement occurs within 24 hours of the event end date",
      "All disputes will be resolved by community consensus"
    ],
    tags: variant.tags
  }));
}; 