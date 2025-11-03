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

  // Like/unlike pool - prevent duplicate likes
  const toggleLike = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet to like pools');
      return;
    }

    // Prevent multiple clicks while loading
    if (isLoading) {
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
        const newLikedState = data.data.liked;
        setIsLiked(newLikedState);
        setSocialStats(prev => ({
          ...prev,
          likes: data.data.likes_count || prev.likes + (newLikedState ? 1 : -1)
        }));
        // Only show toast for success, not for every toggle
        if (newLikedState) {
          toast.success('Pool liked!');
        } else {
          toast.success('Like removed');
        }
      } else {
        toast.error(data.error || 'Failed to like pool');
      }
    } catch (error) {
      console.error('Error liking pool:', error);
      toast.error('Failed to like pool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [poolId, address, isLoading]);

  // Fetch social stats and check if user has liked
  const fetchStats = useCallback(async () => {
    try {
      const statsResponse = await fetch(`/api/social/pools/${poolId}/stats`);
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setSocialStats(statsData.data);
      }
      
      // Check if user has liked this pool
      // The backend API already returns isLiked in the response, so we'll check on first interaction
      // For now, default to false and let toggleLike update it
      if (address) {
        // We'll check the current like state when user interacts, backend handles duplicates
        setIsLiked(false);
      }
    } catch (error) {
      console.error('Error fetching social stats:', error);
    }
  }, [poolId, address]);

  return {
    socialStats,
    isLiked,
    isLoading,
    trackView,
    toggleLike,
    fetchStats
  };
}

