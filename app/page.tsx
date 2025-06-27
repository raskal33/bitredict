"use client";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/button";
import { AnimatePresence, motion } from "motion/react";
import { 
  ChartBarIcon, 
  FireIcon, 
  TrophyIcon, 
  UsersIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  BoltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  EyeIcon,
  ArrowUpIcon,
  StarIcon
} from "@heroicons/react/24/outline";

export default function Page() {
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [stats, setStats] = useState({
    totalVolume: 0,
    activePools: 0,
    totalBets: 0,
    successRate: 0
  });

  // Simulate stats loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        totalVolume: 2840000,
        activePools: 156,
        totalBets: 8924,
        successRate: 73.2
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const poolData = [
    {
      id: 1,
      title: "Bitcoin will reach $100,000 by March 2025",
      category: "Crypto",
      description: "Prediction market on Bitcoin reaching six-figure milestone",
      progress: 650,
      total: 1000,
      odds: 1.75,
      outcome: "Yes",
      participants: 247,
      endDate: "2025-03-31",
      trending: true,
      image: "🪙",
      cardTheme: "cyan",
      volume24h: 12500,
      change24h: 8.5,
      confidence: 73
    },
    {
      id: 2,
      title: "Manchester City wins Premier League 2024/25",
      category: "Sports",
      description: "Premier League championship prediction market",
      progress: 420,
      total: 800,
      odds: 2.1,
      outcome: "Yes",
      participants: 189,
      endDate: "2025-05-25",
      trending: false,
      image: "⚽",
      cardTheme: "magenta",
      volume24h: 8900,
      change24h: -2.1,
      confidence: 65
    },
    {
      id: 3,
      title: "US Federal Reserve cuts rates by 0.5% in Q1 2025",
      category: "Finance",
      description: "Federal Reserve monetary policy prediction",
      progress: 380,
      total: 600,
      odds: 1.6,
      outcome: "Yes",
      participants: 156,
      endDate: "2025-03-31",
      trending: true,
      image: "🏦",
      cardTheme: "violet",
      volume24h: 15600,
      change24h: 12.3,
      confidence: 81
    },
    {
      id: 4,
      title: "Tesla stock hits $400 before June 2025",
      category: "Stocks",
      description: "Tesla stock price prediction market",
      progress: 290,
      total: 500,
      odds: 2.3,
      outcome: "Yes",
      participants: 134,
      endDate: "2025-06-01",
      trending: false,
      image: "🚗",
      cardTheme: "blue",
      volume24h: 6700,
      change24h: 4.8,
      confidence: 58
    },
    {
      id: 5,
      title: "Ethereum 2.0 staking rewards exceed 8% APY",
      category: "Crypto",
      description: "Ethereum staking yield prediction",
      progress: 180,
      total: 400,
      odds: 1.9,
      outcome: "Yes",
      participants: 98,
      endDate: "2025-04-15",
      trending: true,
      image: "💎",
      cardTheme: "indigo",
      volume24h: 4200,
      change24h: 15.7,
      confidence: 69
    },
    {
      id: 6,
      title: "Next FIFA World Cup final viewership breaks 2B",
      category: "Sports", 
      description: "Global viewership prediction for World Cup final",
      progress: 520,
      total: 750,
      odds: 1.4,
      outcome: "Yes",
      participants: 312,
      endDate: "2026-07-19",
      trending: false,
      image: "🏆",
      cardTheme: "cyan",
      volume24h: 9800,
      change24h: 6.2,
      confidence: 77
    },
  ];

  const categories = ["All", "Crypto", "Sports", "Finance", "Stocks", "Politics", "Entertainment"];

  const filteredPools = activeCategory === "" || activeCategory === "All" 
    ? poolData 
    : poolData.filter(pool => pool.category === activeCategory);

  const handleSetCategory = (category: string) => {
    setActiveCategory(category === "All" ? "" : category);
  };

  const StatCard = ({ icon: Icon, label, value, suffix = "" }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string; value: number; suffix?: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="stats-card group cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-center justify-center mb-3">
        <div className="p-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
          <Icon className="h-6 w-6 text-primary group-hover:text-secondary transition-colors duration-300" />
        </div>
      </div>
      <div className="stat-value group-hover:text-primary transition-colors duration-300">
        {value.toLocaleString()}{suffix}
      </div>
      <div className="stat-label">{label}</div>
      
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
    </motion.div>
  );

  const getCardTheme = (theme: string) => {
    const themes = {
      cyan: {
        background: "bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent",
        border: "border-cyan-500/20",
        glow: "shadow-[0_0_30px_rgba(34,199,255,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(34,199,255,0.2)]",
        accent: "text-cyan-400",
        progressBg: "bg-gradient-to-r from-cyan-500 to-blue-500",
        badgeBg: "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30"
      },
      magenta: {
        background: "bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent",
        border: "border-pink-500/20",
        glow: "shadow-[0_0_30px_rgba(255,0,128,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(255,0,128,0.2)]",
        accent: "text-pink-400",
        progressBg: "bg-gradient-to-r from-pink-500 to-rose-500",
        badgeBg: "bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-500/30"
      },
      violet: {
        background: "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent",
        border: "border-violet-500/20",
        glow: "shadow-[0_0_30px_rgba(140,0,255,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(140,0,255,0.2)]",
        accent: "text-violet-400",
        progressBg: "bg-gradient-to-r from-violet-500 to-purple-500",
        badgeBg: "bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/30"
      },
      blue: {
        background: "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent",
        border: "border-blue-500/20",
        glow: "shadow-[0_0_30px_rgba(0,123,255,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(0,123,255,0.2)]",
        accent: "text-blue-400",
        progressBg: "bg-gradient-to-r from-blue-500 to-indigo-500",
        badgeBg: "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30"
      },
      indigo: {
        background: "bg-gradient-to-br from-indigo-500/10 via-slate-500/5 to-transparent",
        border: "border-indigo-500/20",
        glow: "shadow-[0_0_30px_rgba(60,0,165,0.1)]",
        hoverGlow: "hover:shadow-[0_0_40px_rgba(60,0,165,0.2)]",
        accent: "text-indigo-400",
        progressBg: "bg-gradient-to-r from-indigo-500 to-slate-500",
        badgeBg: "bg-gradient-to-r from-indigo-500/20 to-slate-500/20 border-indigo-500/30"
      }
    };
    return themes[theme as keyof typeof themes] || themes.cyan;
  };

  const PoolCard = ({ pool }: { pool: { id: number; title: string; category: string; cardTheme: string; trending?: boolean; image: string; confidence: number; odds: number; participants: number; volume24h: number; change24h: number; progress: number; total: number; endDate: string } }) => {
    const theme = getCardTheme(pool.cardTheme);
    const progressPercentage = (pool.progress / pool.total) * 100;
    const isPositiveChange = pool.change24h > 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className={`
          relative overflow-hidden rounded-2xl border backdrop-blur-xl
          ${theme.background} ${theme.border} ${theme.glow} ${theme.hoverGlow}
          transition-all duration-500 cursor-pointer group
        `}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
        </div>

        {/* Trending Glow Effect */}
        {pool.trending && (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-yellow-500/5" />
        )}

        <Link href={`/bet/${pool.id}`}>
          <div className="relative p-6 space-y-4">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl filter drop-shadow-lg">
                  {pool.image}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${theme.badgeBg}`}>
                      {pool.category}
                    </span>
                    {pool.trending && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 text-orange-300 text-xs rounded-full font-semibold">
                        <FireIcon className="h-3 w-3" />
                        Hot
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Confidence Score */}
              <div className="flex items-center gap-1 text-xs">
                <StarIcon className="h-3 w-3 text-yellow-400" />
                <span className="text-text-muted">{pool.confidence}%</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-bold text-text-primary text-lg leading-tight group-hover:text-white transition-colors line-clamp-2">
              {pool.title}
            </h3>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-xl font-bold ${theme.accent}`}>
                  {pool.odds}x
                </div>
                <div className="text-xs text-text-muted">Odds</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-text-primary flex items-center justify-center gap-1">
                  <UsersIcon className="h-4 w-4" />
                  {pool.participants}
                </div>
                <div className="text-xs text-text-muted">Traders</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-text-primary">
                  ${(pool.volume24h / 1000).toFixed(1)}k
                </div>
                <div className="text-xs text-text-muted">24h Vol</div>
              </div>
            </div>

            {/* 24h Change */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">24h Change</span>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                isPositiveChange ? 'text-green-400' : 'text-red-400'
              }`}>
                <ArrowUpIcon className={`h-3 w-3 ${!isPositiveChange && 'rotate-180'}`} />
                {Math.abs(pool.change24h)}%
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary font-medium">Pool Progress</span>
                <span className="text-sm font-bold text-text-primary">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="relative">
                <div className="w-full bg-white/5 rounded-full h-3 border border-white/10 overflow-hidden">
                  <motion.div 
                    className={`h-full rounded-full ${theme.progressBg} relative overflow-hidden`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  >

                  </motion.div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-text-muted font-medium">{pool.progress} SOL</span>
                  <span className="text-xs text-text-muted font-medium">{pool.total} SOL</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <ClockIcon className="h-3 w-3" />
                <span>Ends {pool.endDate}</span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all duration-200">
                  <EyeIcon className="h-4 w-4" />
                </button>
                <Button size="sm" variant="outline" className="text-xs">
                  Place Bet
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative section-padding overflow-hidden">
        <div className="absolute inset-0 bg-gradient-somnia opacity-5" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <SparklesIcon className="h-8 w-8 text-primary" />
              <span className="text-primary font-medium">
                Powered by{" "}
                <span className="gradient-text font-bold">Somnia Network</span>
              </span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-text-primary">
              The Future of{" "}
              <span className="gradient-text">Decentralized</span>{" "}
              Prediction Markets
            </h1>
            
            <p className="text-xl text-text-secondary mb-8 text-balance">
              Trade on real-world outcomes with transparent, blockchain-powered markets. 
              Join thousands of traders making informed predictions on sports, crypto, politics, and more.
            </p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  className="sm:w-auto w-full group" 
                  leftIcon={<BoltIcon className="h-5 w-5 group-hover:text-black transition-colors duration-200" />}
                >
                  Start Trading
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <a 
                  href="https://bitredict.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="sm:w-auto w-full group hover:border-primary/50 transition-all duration-200"
                  >
                    Learn More
                  </Button>
                </a>
              </motion.div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative"
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl blur-xl -z-10" />
              
              <StatCard 
                icon={CurrencyDollarIcon}
                label="Total Volume"
                value={stats.totalVolume}
                suffix="+"
              />
              <StatCard 
                icon={ChartBarIcon}
                label="Active Pools"
                value={stats.activePools}
              />
              <StatCard 
                icon={UsersIcon}
                label="Total Bets"
                value={stats.totalBets}
                suffix="+"
              />
              <StatCard 
                icon={TrophyIcon}
                label="Success Rate"
                value={stats.successRate}
                suffix="%"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trending Pools Carousel */}
      <section className="section-padding">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <FireIcon className="h-6 w-6 text-orange-500" />
              <h2 className="text-3xl font-bold text-text-primary">Trending Pools</h2>
            </div>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Discover the most popular prediction markets with high engagement and exciting outcomes
            </p>
          </motion.div>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000, pauseOnMouseEnter: true }}
            spaceBetween={24}
            breakpoints={{
              1024: { slidesPerView: 3 },
              768: { slidesPerView: 2 },
              0: { slidesPerView: 1 },
            }}
            loop
            className="trending-swiper"
          >
            {poolData.filter(pool => pool.trending).map((pool) => (
              <SwiperSlide key={pool.id}>
                <PoolCard pool={pool} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* All Pools Section */}
      <section className="section-padding">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-4">All Prediction Markets</h2>
            <p className="text-text-secondary max-w-2xl mx-auto mb-8">
              Explore all available markets across different categories and find the perfect opportunity
            </p>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleSetCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    (category === "All" && activeCategory === "") || activeCategory === category
                      ? "bg-gradient-primary text-black shadow-button"
                      : "bg-bg-card text-text-secondary hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary border border-border-card"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Pools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPools.map((pool, index) => (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PoolCard pool={pool} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Markets
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding relative">
        <div className="absolute inset-0 bg-gradient-somnia opacity-10" />
        <div className="glass-card container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-text-primary">
              Ready to Start Trading?
            </h2>
            <p className="text-xl mb-8 text-text-secondary">
              Join the future of prediction markets. Create your first market or place your first bet today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="sm:w-auto w-full"
                leftIcon={<ArrowTrendingUpIcon className="h-5 w-5" />}
              >
                Create Market
              </Button>
              <Button 
                size="lg" 
                variant="primary"
                className="sm:w-auto w-full"
              >
                Connect Wallet
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
