import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

interface UserProfile {
  address: string;
  reputation: number;
  totalPoolsCreated: number;
  totalVolume: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface FollowUser {
  address: string;
  reputation: number;
  totalPoolsCreated: number;
  totalVolume: number;
  followedAt: string;
}

interface UseUserFollowReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchFollowers: () => Promise<void>;
  fetchFollowing: () => Promise<void>;
  followers: FollowUser[];
  following: FollowUser[];
}

export function useUserFollow(targetAddress: string): UseUserFollowReturn {
  const { address: currentUserAddress } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!targetAddress) return;
    
    try {
      const params = new URLSearchParams();
      if (currentUserAddress) {
        params.append('currentUserAddress', currentUserAddress);
      }
      
      const response = await fetch(`/api/social/users/${targetAddress}/profile?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProfile({
          address: data.data.address,
          reputation: data.data.reputation || 0,
          totalPoolsCreated: data.data.total_pools_created || 0,
          totalVolume: parseFloat(data.data.total_volume || 0),
          followerCount: data.data.followerCount || 0,
          followingCount: data.data.followingCount || 0,
          isFollowing: data.data.isFollowing || false
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [targetAddress, currentUserAddress]);

  const fetchFollowers = useCallback(async () => {
    if (!targetAddress) return;
    
    try {
      const response = await fetch(`/api/social/users/${targetAddress}/followers`);
      const data = await response.json();
      
      if (data.success) {
        setFollowers(data.data.map((f: any) => ({
          address: f.address,
          reputation: f.reputation || 0,
          totalPoolsCreated: f.total_pools_created || 0,
          totalVolume: parseFloat(f.total_volume || 0),
          followedAt: f.followed_at
        })));
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  }, [targetAddress]);

  const fetchFollowing = useCallback(async () => {
    if (!targetAddress) return;
    
    try {
      const response = await fetch(`/api/social/users/${targetAddress}/following`);
      const data = await response.json();
      
      if (data.success) {
        setFollowing(data.data.map((f: any) => ({
          address: f.address,
          reputation: f.reputation || 0,
          totalPoolsCreated: f.total_pools_created || 0,
          totalVolume: parseFloat(f.total_volume || 0),
          followedAt: f.followed_at
        })));
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  }, [targetAddress]);

  const follow = useCallback(async () => {
    if (!currentUserAddress) {
      toast.error('Please connect your wallet to follow users');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/users/${targetAddress}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: currentUserAddress })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Now following this user');
        await fetchProfile();
      } else {
        toast.error(data.error || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [targetAddress, currentUserAddress, fetchProfile]);

  const unfollow = useCallback(async () => {
    if (!currentUserAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/users/${targetAddress}/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: currentUserAddress })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Unfollowed this user');
        await fetchProfile();
      } else {
        toast.error(data.error || 'Failed to unfollow user');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [targetAddress, currentUserAddress, fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    follow,
    unfollow,
    fetchProfile,
    fetchFollowers,
    fetchFollowing,
    followers,
    following
  };
}

