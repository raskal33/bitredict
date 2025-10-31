"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import Button from "@/components/button";
import { useTrendingPools } from "@/hooks/useMarkets";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";



export default function Page() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Real-time data from backend
  const { data: trendingData, isLoading: trendingLoading } = useTrendingPools({ limit: 8 });
  
  const isLoading = trendingLoading;
  
  // Use real trending pools or fallback data
  const predictionPools = trendingData || [];

  const categories = ["All", "Crypto", "Sports", "Politics", "Finance"];
  
  // Ensure predictionPools is always an array for type safety
  const poolsArray = Array.isArray(predictionPools) ? predictionPools : [];

  const filteredPools = selectedCategory === "All" 
    ? poolsArray 
    : poolsArray.filter((pool) => pool.category === selectedCategory);

  const trendingPools = poolsArray.filter((pool) => pool.isTrending);

  const stats = [
    {
      label: "Total Volume",
      value: "12.5M",
      unit: "STT",
      change: "+15.2%",
      positive: true,
      icon: "💰"
    },
    {
      label: "Active Markets",
      value: "156",
      unit: "",
      change: "+8",
      positive: true,
      icon: "📊"
    },
    {
      label: "Total Pools",
      value: "2,847",
      unit: "",
      change: "+156",
      positive: true,
      icon: "👥"
    },
    {
      label: "Total Bets",
      value: "18.4K",
      unit: "",
      change: "+2.1%",
      positive: true,
      icon: "🏆"
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Loading Skeleton */}
        <div className="glass-card p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card-bg rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="h-4 bg-card-bg rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-card-bg rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-card-bg rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 lg:p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-violet/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl lg:text-4xl font-bold text-white"
              >
                Welcome to <span className="bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">BitRedict</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg lg:text-xl text-text-secondary max-w-3xl"
              >
                Predict the future, earn rewards. Join the most advanced decentralized prediction market on Somnia Network.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/create-prediction">
                <Button size="lg" className="shadow-xl hover:shadow-2xl">
                  Create Your First Market
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                stat.positive 
                  ? 'text-green-400 bg-green-400/10' 
                  : 'text-red-400 bg-red-400/10'
              }`}>
                {stat.change}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{stat.value}</span>
                {stat.unit && <span className="text-text-secondary">{stat.unit}</span>}
              </div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Trending Markets Carousel */}
      {trendingPools.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🔥 Trending Markets
            </h2>
            <Link href="/markets" className="text-brand-cyan hover:text-brand-blue transition-colors">
              View All
            </Link>
          </div>
          
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 1, spaceBetween: 16 },
              768: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
              1280: { slidesPerView: 4, spaceBetween: 24 },
            }}
            className="trending-swiper"
          >
            {trendingPools.map((pool) => (
              <SwiperSlide key={pool.poolId}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass-card p-3 h-full cursor-pointer group min-h-[260px] flex flex-col"
                >
                                      <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 bg-brand-cyan/20 text-brand-cyan rounded-full text-xs font-medium">
                        {pool.category}
                      </span>
                      <span className="text-text-secondary text-xs">
                        {pool.totalBettorStake ? parseFloat(pool.totalBettorStake).toFixed(0) : 0} participants
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-brand-cyan transition-colors line-clamp-2 min-h-[2.5rem]">
                      {pool.title}
                    </h3>
                    
                    <p className="text-text-secondary text-xs mb-3 line-clamp-2 min-h-[2rem] flex-1">
                      {`Prediction pool created by ${pool.creator.slice(0, 6)}...`}
                    </p>
                  
                                      <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="text-xs">
                        <span className="text-text-secondary">Pool: </span>
                        <span className="text-white font-semibold">
                          {parseFloat(pool.creatorStake).toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                                                                            <span className="px-1 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                            Yes {pool.odds}x
                          </span>
                          <span className="px-1 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                            No {pool.odds}x
                          </span>
                      </div>
                    </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      )}

      {/* Categories and Markets */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Prediction Markets</h2>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-brand-cyan to-brand-blue text-black"
                  : "text-text-secondary hover:text-white hover:bg-card-bg"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Markets Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredPools.map((pool, index) => (
              <motion.div
                key={pool.poolId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-4 cursor-pointer group min-h-[300px] flex flex-col"
              >
                                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-brand-violet/20 text-brand-violet rounded-full text-xs font-medium">
                        {pool.category}
                      </span>
                      {pool.isBoosted && (
                        <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                          ⭐ Boosted
                        </span>
                      )}
                    </div>
                    {pool.eventEndTime && (
                      <span className="text-text-secondary text-xs">
                        Ends {new Date(Number(pool.eventEndTime) * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-brand-cyan transition-colors line-clamp-2 min-h-[2.5rem]">
                    {pool.title}
                  </h3>
                  
                  <p className="text-text-secondary text-xs mb-3 line-clamp-2 min-h-[2rem] flex-1">
                    {`Prediction pool: ${pool.homeTeam} vs ${pool.awayTeam}`}
                  </p>
                
                <div className="flex items-center justify-between mb-3 mt-auto">
                  <div className="space-y-1">
                    <div className="text-xs text-text-secondary">Total Pool</div>
                    <div className="text-base font-bold text-white">
                      {parseFloat(pool.creatorStake).toFixed(2)} {pool.usesBitr ? 'BITR' : 'STT'}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="text-xs text-text-secondary">Participants</div>
                    <div className="text-base font-bold text-white">
                      {pool.totalBettorStake ? parseFloat(pool.totalBettorStake).toFixed(0) : 0}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs py-1.5">
                    Yes {pool.odds}x
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs py-1.5">
                    No {pool.odds}x
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredPools.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No markets found</h3>
            <p className="text-text-secondary">Try selecting a different category or check back later.</p>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Link href="/create-prediction" className="group">
          <div className="glass-card p-4 text-center hover:bg-card-bg/50 transition-all group-hover:scale-105">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🚀</div>
            <h3 className="text-base font-semibold text-white mb-2">Create Market</h3>
            <p className="text-text-secondary text-sm">Launch your own prediction market</p>
          </div>
        </Link>
        
        <Link href="/dashboard/financial-summary" className="group">
          <div className="glass-card p-4 text-center hover:bg-card-bg/50 transition-all group-hover:scale-105">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">💼</div>
            <h3 className="text-base font-semibold text-white mb-2">Portfolio</h3>
            <p className="text-text-secondary text-sm">Track your predictions and earnings</p>
          </div>
        </Link>
        
        <Link href="/dashboard/performance-charts" className="group">
          <div className="glass-card p-4 text-center hover:bg-card-bg/50 transition-all group-hover:scale-105">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📈</div>
            <h3 className="text-base font-semibold text-white mb-2">Analytics</h3>
            <p className="text-text-secondary text-sm">View detailed performance metrics</p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
} 