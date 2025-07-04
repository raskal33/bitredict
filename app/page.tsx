"use client";

import { useEffect, useCallback, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import { Pool } from "@/lib/types";

export default function HomePage() {
  const { isConnected } = useAccount();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pools/featured');
      const data = await response.json();
      if (data.success) {
        setPools(data.data);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* ... JSX to display pools ... */}
      <ArrowTrendingUpIcon className="w-6 h-6" />
      <TrophyIcon className="w-6 h-6" />
      <ChatBubbleLeftRightIcon className="w-6 h-6" />
      {pools.map(pool => (
        <Link href={`/bet/${pool.id}`} key={pool.id}>
          <motion.div>
            {pool.title}
          </motion.div>
        </Link>
      ))}
      {!isConnected && <p>Connect your wallet</p>}
    </div>
  );
}
