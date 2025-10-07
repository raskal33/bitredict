"use client";

import { useState, useEffect, useCallback } from 'react';
import { PoolContractService } from '@/services/poolContractService';
import { Pool } from '@/lib/types';

interface BatchPoolDataOptions {
  batchSize?: number;
  delay?: number;
  enabled?: boolean;
}

interface BatchPoolDataResult {
  pools: Pool[];
  loading: boolean;
  error: string | null;
  progress: number;
  total: number;
}

export function useBatchPoolData(
  poolIds: number[],
  options: BatchPoolDataOptions = {}
): BatchPoolDataResult {
  const {
    batchSize = 5,
    delay = 100,
    enabled = true
  } = options;

  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const loadPoolsInBatches = useCallback(async () => {
    if (!enabled || poolIds.length === 0) return;

    setLoading(true);
    setError(null);
    setProgress(0);
    setPools([]);

    try {
      const allPools: Pool[] = [];
      
      for (let i = 0; i < poolIds.length; i += batchSize) {
        const batch = poolIds.slice(i, i + batchSize);
        
        // Load batch in parallel
        const batchPromises = batch.map(async (poolId) => {
          try {
            const poolData = await PoolContractService.getPool(poolId);
            return poolData;
          } catch (error) {
            console.warn(`Failed to load pool ${poolId}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validPools = batchResults.filter((pool): pool is Pool => pool !== null);
        
        allPools.push(...validPools);
        setPools([...allPools]);
        setProgress(Math.min(100, ((i + batchSize) / poolIds.length) * 100));

        // Add delay between batches to prevent overwhelming the contract
        if (i + batchSize < poolIds.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      console.log(`✅ Loaded ${allPools.length} pools in batches`);
    } catch (error) {
      console.error('Error loading pools in batches:', error);
      setError('Failed to load pools');
    } finally {
      setLoading(false);
    }
  }, [poolIds, batchSize, delay, enabled]);

  useEffect(() => {
    loadPoolsInBatches();
  }, [loadPoolsInBatches]);

  return {
    pools,
    loading,
    error,
    progress,
    total: poolIds.length
  };
}

// Hook for loading pools with smart caching
export function useSmartPoolLoading(
  limit: number = 50,
  offset: number = 0
) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get pool count first
      const poolCount = await PoolContractService.getPoolCount();
      const totalPools = Number(poolCount);
      
      if (totalPools === 0) {
        setPools([]);
        return;
      }

      // Calculate which pools to load
      const startId = Math.max(0, totalPools - offset - limit);
      const endId = Math.min(totalPools - 1, startId + limit - 1);
      
      const poolIds = Array.from(
        { length: endId - startId + 1 }, 
        (_, i) => startId + i
      ).reverse(); // Most recent first

      console.log(`🔄 Loading pools ${startId}-${endId} (${poolIds.length} pools)`);

      // Load in batches
      const batchSize = 5;
      const allPools: Pool[] = [];

      for (let i = 0; i < poolIds.length; i += batchSize) {
        const batch = poolIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (poolId) => {
          try {
            return await PoolContractService.getPool(poolId);
          } catch (error) {
            console.warn(`Failed to load pool ${poolId}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validPools = batchResults.filter((pool): pool is Pool => pool !== null);
        allPools.push(...validPools);

        // Small delay between batches
        if (i + batchSize < poolIds.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setPools(allPools);
      console.log(`✅ Loaded ${allPools.length} pools successfully`);
    } catch (error) {
      console.error('Error loading pools:', error);
      setError('Failed to load pools');
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  return {
    pools,
    loading,
    error,
    refetch: loadPools
  };
}
