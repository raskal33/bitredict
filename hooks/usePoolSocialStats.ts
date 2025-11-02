import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

interface SocialStats {
  likes: number;
  comments: number;
  views: number;
  shares: number;
}

export function usePoolSocialStats(poolId: string | number) {
  const { address } = useAccount();
  const [socialStats, setSocialStats] = useState<SocialStats>({
    likes: 0,
    comments: 0,
    views: 0,
    shares: 0
  });
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Track view when pool is viewed
  const trackView = useCallback(async () => {
    try {
      await fetch(`/api/social/pools/${poolId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address })
      });
    } catch (error) {
      console.warn('Failed to track view:', error);
    }
  }, [poolId, address]);

  // Like/unlike pool
  const toggleLike = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet to like pools');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/pools/${poolId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address })
      });

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.data.liked);
        setSocialStats(prev => ({
          ...prev,
          likes: data.data.likes_count || prev.likes + (data.data.liked ? 1 : -1)
        }));
        toast.success(data.data.message);
      } else {
        toast.error(data.error || 'Failed to like pool');
      }
    } catch (error) {
      console.error('Error liking pool:', error);
      toast.error('Failed to like pool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [poolId, address]);

  // Fetch social stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/social/pools/${poolId}/stats`);
      const data = await response.json();
      if (data.success) {
        setSocialStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching social stats:', error);
    }
  }, [poolId]);

  return {
    socialStats,
    isLiked,
    isLoading,
    trackView,
    toggleLike,
    fetchStats
  };
}

