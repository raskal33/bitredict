"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatSTT, formatShortDate } from "@/utils/formatters";
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://bitredict-backend.fly.dev';

export default function CreatedPredictionsPage() {
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "settled">("all");

  // Fetch created pools
  const { data: pools, isLoading } = useQuery({
    queryKey: ['createdPools', address],
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(`${BACKEND_URL}/api/pools?creator=${address}`);
      if (!response.ok) throw new Error('Failed to fetch pools');
      const data = await response.json();
      return data.pools || [];
    },
    enabled: !!address,
    staleTime: 60000
  });

  if (!address) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <SparklesIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Your Wallet</h2>
          <p className="text-text-secondary">Please connect your wallet to view created predictions</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="glass-card p-8">
          <div className="h-8 bg-card-bg rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-6 bg-card-bg rounded mb-2"></div>
                <div className="h-4 bg-card-bg rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const createdPools = pools || [];
  
  interface Pool {
    pool_id: string;
    title?: string;
    is_settled: boolean;
    category?: string;
    created_at: string;
    total_bettor_stake?: string;
    creator_stake?: string;
  }
  
  // Filter pools
  const filteredPools = createdPools.filter((pool: Pool) => {
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !pool.is_settled) ||
      (statusFilter === "settled" && pool.is_settled);
    const matchesSearch = searchQuery === "" || 
      (pool.title && pool.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPools = createdPools.length;
  const activePools = createdPools.filter((p: Pool) => !p.is_settled).length;
  const settledPools = createdPools.filter((p: Pool) => p.is_settled).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Created Predictions</h1>
          <Link 
            href="/create-prediction"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-black rounded-button font-semibold shadow-button hover:brightness-110 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4" />
            Create New
          </Link>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-text-primary mb-1">{totalPools}</div>
            <div className="text-sm text-text-muted">Total Pools</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">{activePools}</div>
            <div className="text-sm text-text-muted">Active</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-green-400 mb-1">{settledPools}</div>
            <div className="text-sm text-text-muted">Settled</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-2">
            {['all', 'active', 'settled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as "all" | "active" | "settled")}
                className={`px-4 py-2 rounded-button text-sm font-medium transition-all duration-200 ${
                  statusFilter === status
                    ? 'bg-gradient-primary text-black'
                    : 'glass-card text-text-secondary hover:text-text-primary'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search pools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-bg-card border border-border-card rounded-button text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </motion.div>

      {/* Pools List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {filteredPools.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <SparklesIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Pools Found</h3>
            <p className="text-text-secondary mb-4">
              {searchQuery !== "" 
                ? "Try adjusting your search query."
                : "Start creating prediction pools to see them here."
              }
            </p>
            <Link 
              href="/create-prediction"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary text-black rounded-button font-semibold shadow-button hover:brightness-110 transition-all duration-200"
            >
              <PlusIcon className="h-4 w-4" />
              Create Your First Pool
            </Link>
          </div>
        ) : (
          filteredPools.map((pool: Pool, index: number) => (
            <motion.div
              key={pool.pool_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              className="glass-card p-6 hover:bg-[rgba(255,255,255,0.02)] transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-3 py-1 rounded-button text-xs font-medium border ${
                      pool.is_settled 
                        ? 'text-green-400 bg-green-500/10 border-green-500/30'
                        : 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                    }`}>
                      {pool.is_settled ? 'Settled' : 'Active'}
                    </div>
                    {pool.category && (
                      <span className="text-xs text-text-muted">{pool.category}</span>
                    )}
                  </div>
                  
                  <Link 
                    href={`/bet/${pool.pool_id}`}
                    className="block mb-2"
                  >
                    <h4 className="font-semibold text-text-primary hover:text-primary transition-colors line-clamp-1">
                      {pool.title || `Pool #${pool.pool_id}`}
                    </h4>
                  </Link>
                  
                  <div className="text-sm text-text-muted">
                    Created {formatShortDate(pool.created_at)}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-text-muted mb-1">Total Volume</div>
                    <div className="font-medium text-text-primary">
                      {formatSTT((parseFloat(pool.total_bettor_stake || '0') + parseFloat(pool.creator_stake || '0')).toString())}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-text-muted mb-1">Your Liquidity</div>
                    <div className="font-medium text-cyan-400">
                      {formatSTT(pool.creator_stake || '0')}
                    </div>
                  </div>
                  
                  <Link 
                    href={`/bet/${pool.pool_id}`}
                    className="px-4 py-2 bg-gradient-primary text-black rounded-button font-medium hover:brightness-110 transition-all duration-200"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
