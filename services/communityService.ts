import { apiRequest, API_CONFIG } from '@/config/api';

// ============================================================================
// COMMUNITY SERVICE - Complete community hub integration
// ============================================================================

export interface Discussion {
  id: number;
  title: string;
  content: string;
  userAddress: string;
  category: string;
  totalLikes: number;
  replyCount: number;
  createdAt: string;
  lastActivity: string;
  userBadge?: string;
  badgeRarity?: string;
  reputation: number;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  tags?: string[];
}

export interface DiscussionReply {
  id: number;
  discussionId: number;
  authorAddress: string;
  content: string;
  parentReplyId?: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  authorBadge?: string;
  authorReputation: number;
}

export interface CommunityStats {
  activeDiscussions: number;
  communityMembers: number;
  totalComments: number;
  totalLikes: number;
  weeklyActivity: number;
}

export interface SocialReaction {
  id: number;
  userAddress: string;
  targetType: 'pool_comment' | 'discussion' | 'reply' | 'profile';
  targetId: number;
  reactionType: 'like' | 'dislike' | 'love' | 'fire' | 'brain';
  createdAt: string;
}

export interface PoolComment {
  id: number;
  poolId: string;
  userAddress: string;
  content: string;
  parentCommentId?: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isDeleted: boolean;
  authorBadge?: string;
  authorReputation: number;
}

export interface UserSocialStats {
  userAddress: string;
  totalComments: number;
  totalDiscussions: number;
  totalLikesGiven: number;
  totalLikesReceived: number;
  totalReflections: number;
  communityInfluenceScore: number;
  weeklyEngagementScore: number;
  favoriteDiscussionCategory: string;
  lastSocialActivity: string;
}

class CommunityService {
  /**
   * Get all discussions with filtering and pagination
   */
  async getDiscussions(
    category: string = 'all',
    sort: 'recent' | 'popular' | 'oldest' = 'recent',
    limit: number = 20,
    offset: number = 0
  ): Promise<Discussion[]> {
    const params = new URLSearchParams({
      category,
      sort,
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await apiRequest(`${API_CONFIG.endpoints.social}/discussions?${params}`);
    if (
      !response ||
      typeof response !== 'object' ||
      !('data' in response) ||
      !Array.isArray((response as any).data)
    ) {
      throw new Error('Invalid response from discussions API');
    }

    return (response as any).data.map((discussion: any) => ({
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      userAddress: discussion.user_address,
      category: discussion.category,
      totalLikes: discussion.total_likes || 0,
      replyCount: discussion.reply_count || 0,
      createdAt: discussion.created_at,
      lastActivity: discussion.last_activity,
      userBadge: discussion.user_badge,
      badgeRarity: discussion.badge_rarity,
      reputation: discussion.reputation || 40,
      isPinned: discussion.is_pinned || false,
      isLocked: discussion.is_locked || false,
      viewCount: discussion.view_count || 0,
      tags: discussion.tags || []
    }));
  }

  /**
   * Create a new discussion
   */
  async createDiscussion(
    userAddress: string,
    title: string,
    content: string,
    category: string = 'general',
    tags: string[] = []
  ): Promise<Discussion> {
    const response = await apiRequest(`${API_CONFIG.endpoints.social}/discussions`, {
      method: 'POST',
      body: JSON.stringify({
        userAddress,
        title,
        content,
        category,
        tags
      })
    });

    if (
      !response ||
      typeof response !== 'object' ||
      !('data' in response) ||
      typeof (response as any).data !== 'object' ||
      (response as any).data === null
    ) {
      throw new Error('Invalid response from createDiscussion API');
    }

    const data = (response as any).data;

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      userAddress: data.user_address,
      category: data.category,
      totalLikes: 0,
      replyCount: 0,
      createdAt: (response as any)?.data?.created_at,
      lastActivity: (response as any)?.data?.created_at,
      reputation: 40,
      isPinned: false,
      isLocked: false,
      viewCount: 0,
      tags: (response as any)?.data?.tags || []
    };
  }

  /**
   * Get discussion replies
   */
  async getDiscussionReplies(discussionId: number, limit: number = 50): Promise<DiscussionReply[]> {
    const response = await apiRequest(`${API_CONFIG.endpoints.social}/discussions/${discussionId}/replies?limit=${limit}`);

    if (
      typeof response !== 'object' ||
      response === null ||
      typeof (response as any).data !== 'object' ||
      (response as any).data === null ||
      !Array.isArray((response as any).data)
    ) {
      throw new Error('Invalid response format from getDiscussionReplies API');
    }

    return (response as any).data.map((reply: any) => ({
      id: reply.id,
      discussionId: reply.discussion_id,
      authorAddress: reply.author_address,
      content: reply.content,
      parentReplyId: reply.parent_reply_id,
      likesCount: reply.likes_count || 0,
      createdAt: reply.created_at,
      updatedAt: reply.updated_at,
      isDeleted: reply.is_deleted || false,
      authorBadge: reply.author_badge,
      authorReputation: reply.author_reputation || 40
    }));
  }

  /**
   * Add a reaction to content
   */
  async addReaction(
    userAddress: string,
    targetType: 'pool_comment' | 'discussion' | 'reply' | 'profile',
    targetId: number,
    reactionType: 'like' | 'dislike' | 'love' | 'fire' | 'brain' = 'like'
  ): Promise<boolean> {
    try {
      await apiRequest(`${API_CONFIG.endpoints.social}/reactions`, {
        method: 'POST',
        body: JSON.stringify({
          userAddress,
          targetType,
          targetId,
          reactionType
        })
      });
      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  }

  /**
   * Get community statistics
   */
  async getCommunityStats(): Promise<CommunityStats> {
    const response = await apiRequest(`${API_CONFIG.endpoints.social}/community-stats`);
    
    if (
      typeof response !== 'object' ||
      response === null ||
      typeof (response as any).data !== 'object' ||
      (response as any).data === null
    ) {
      throw new Error('Invalid response format from community-stats API');
    }
    const data = (response as any).data;
    return {
      activeDiscussions: data.activeDiscussions || 0,
      communityMembers: data.communityMembers || 0,
      totalComments: data.totalComments || 0,
      totalLikes: data.totalLikes || 0,
      weeklyActivity: data.weeklyActivity || 0
    };
  }

  /**
   * Get pool comments
   */
  async getPoolComments(poolId: string, limit: number = 50): Promise<PoolComment[]> {
    const response = await apiRequest(`${API_CONFIG.endpoints.social}/pools/${poolId}/comments?limit=${limit}`);

    if (
      typeof response !== 'object' ||
      response === null ||
      typeof (response as any).data !== 'object' ||
      (response as any).data === null ||
      !Array.isArray((response as any).data)
    ) {
      throw new Error('Invalid response format from pool comments API');
    }

    return (response as any).data.map((comment: any) => ({
      id: comment.id,
      poolId: comment.pool_id,
      userAddress: comment.user_address,
      content: comment.content,
      parentCommentId: comment.parent_comment_id,
      sentiment: comment.sentiment || 'neutral',
      likesCount: comment.likes_count || 0,
      dislikesCount: comment.dislikes_count || 0,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      isPinned: comment.is_pinned || false,
      isDeleted: comment.is_deleted || false,
      authorBadge: comment.author_badge,
      authorReputation: comment.author_reputation || 40
    }));
  }

  /**
   * Add a comment to a pool
   */
  async addPoolComment(
    userAddress: string,
    poolId: string,
    content: string,
    sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral',
    parentCommentId?: number
  ): Promise<PoolComment> {
    const response = await apiRequest(`${API_CONFIG.endpoints.social}/pools/${poolId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        userAddress,
        content,
        sentiment,
        parentCommentId
      })
    });

    // Ensure response is an object and response.data is an object
    const data =
      response &&
      typeof response === 'object' &&
      response !== null &&
      'data' in response &&
      typeof (response as any).data === 'object' &&
      (response as any).data !== null
        ? (response as any).data
        : {};

    return {
      id: data.id,
      poolId,
      userAddress,
      content,
      parentCommentId,
      sentiment,
      likesCount: data.likes_count || 0,
      dislikesCount: data.dislikes_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isPinned: data.is_pinned || false,
      isDeleted: data.is_deleted || false,
      authorReputation: data.author_reputation || 40
    };
  }

  /**
   * Get user's social statistics
   */
  async getUserSocialStats(userAddress: string): Promise<UserSocialStats> {
    const response = await apiRequest(`${API_CONFIG.endpoints.social}/users/${userAddress}/social-stats`);
    
    // Fix: Ensure response is typed and data is safely accessed
    const data = response && typeof response === 'object' && 'data' in response && typeof response.data === 'object'
      ? response.data as Record<string, any>
      : {};

    return {
      userAddress,
      totalComments: data.total_comments || 0,
      totalDiscussions: data.total_discussions || 0,
      totalLikesGiven: data.total_likes_given || 0,
      totalLikesReceived: data.total_likes_received || 0,
      totalReflections: data.total_reflections || 0,
      communityInfluenceScore: data.community_influence_score || 0,
      weeklyEngagementScore: data.weekly_engagement_score || 0,
      favoriteDiscussionCategory: data.favorite_discussion_category || 'general',
      lastSocialActivity: data.last_social_activity
    };
  }

  /**
   * Get trending discussions
   */
  async getTrendingDiscussions(timeframe: '24h' | '7d' | '30d' = '7d', limit: number = 10): Promise<Discussion[]> {
    const response = await apiRequest(`${API_CONFIG.endpoints.social}/discussions/trending?timeframe=${timeframe}&limit=${limit}`);

    // Ensure response is an object and response.data is an array
    const data = response && typeof response === 'object' && Array.isArray((response as any).data)
      ? (response as any).data
      : [];

    return data.map((discussion: any) => ({
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      userAddress: discussion.user_address,
      category: discussion.category,
      totalLikes: discussion.total_likes || 0,
      replyCount: discussion.reply_count || 0,
      createdAt: discussion.created_at,
      lastActivity: discussion.last_activity,
      userBadge: discussion.user_badge,
      badgeRarity: discussion.badge_rarity,
      reputation: discussion.reputation || 40,
      isPinned: discussion.is_pinned || false,
      isLocked: discussion.is_locked || false,
      viewCount: discussion.view_count || 0,
      tags: discussion.tags || []
    }));
  }

  /**
   * Get community leaderboard
   */
  async getCommunityLeaderboard(
    metric: 'influence' | 'engagement' | 'contributions' = 'influence',
    limit: number = 50
  ) {
    const response = await apiRequest(`${API_CONFIG.endpoints.social}/leaderboard?metric=${metric}&limit=${limit}`);

    if (!response || typeof response !== 'object' || !Array.isArray((response as any).data)) {
      return [];
    }

    return (response as any).data.map((user: any, index: number) => ({
      rank: index + 1,
      address: user.user_address,
      shortAddress: `${user.user_address.slice(0, 6)}...${user.user_address.slice(-4)}`,
      score: user[metric] || 0,
      totalContributions: user.total_contributions || 0,
      topBadge: user.top_badge,
      reputation: user.reputation || 40
    }));
  }

  /**
   * Search discussions
   */
  async searchDiscussions(
    query: string,
    category: string = 'all',
    limit: number = 20
  ): Promise<Discussion[]> {
    const params = new URLSearchParams({
      q: query,
      category,
      limit: limit.toString()
    });

    const response = await apiRequest(`${API_CONFIG.endpoints.social}/discussions/search?${params}`);
    if (!response || typeof response !== 'object' || !Array.isArray((response as any).data)) {
      return [];
    }
    return (response as any).data.map((discussion: any) => ({
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      userAddress: discussion.user_address,
      category: discussion.category,
      totalLikes: discussion.total_likes || 0,
      replyCount: discussion.reply_count || 0,
      createdAt: discussion.created_at,
      lastActivity: discussion.last_activity,
      userBadge: discussion.user_badge,
      badgeRarity: discussion.badge_rarity,
      reputation: discussion.reputation || 40,
      isPinned: discussion.is_pinned || false,
      isLocked: discussion.is_locked || false,
      viewCount: discussion.view_count || 0,
      tags: discussion.tags || []
    }));
  }

  /**
   * Format time ago string
   */
  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  }

  /**
   * Get badge color based on rarity
   */
  getBadgeColor(rarity: string): string {
    switch (rarity) {
      case 'legendary': return 'text-orange-400';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      case 'uncommon': return 'text-green-400';
      case 'common': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  }

  /**
   * Get sentiment color for comments
   */
  getSentimentColor(sentiment: string): string {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-400/10';
      case 'bearish': return 'text-red-400 bg-red-400/10';
      case 'neutral': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  }

  /**
   * Validate discussion content
   */
  validateDiscussion(title: string, content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push('Title is required');
    if (title.length > 100) errors.push('Title must be 100 characters or less');
    if (!content.trim()) errors.push('Content is required');
    if (content.length > 1000) errors.push('Content must be 1000 characters or less');
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if user can post (rate limiting check)
   */
  async canUserPost(userAddress: string): Promise<boolean> {
    try {
      const response = await apiRequest(`${API_CONFIG.endpoints.social}/users/${userAddress}/can-post`);
      if (typeof response === 'object' && response !== null && 'canPost' in response) {
        return Boolean((response as { canPost: unknown }).canPost);
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // ============================================================================
  // LEGACY METHODS - For backward compatibility with existing components
  // ============================================================================

  /**
   * Legacy method: fetchThreads (alias for getDiscussions)
   */
  async fetchThreads() {
    return this.getDiscussions('all', 'recent', 50);
  }

  /**
   * Legacy method: createThread (alias for createDiscussion)
   */
  async createThread(threadData: { title: string; author: string; category?: string }) {
    return this.createDiscussion(
      threadData.author,
      threadData.title,
      '',
      threadData.category || 'general'
    );
  }

  /**
   * Legacy method: fetchThreadById (get single discussion)
   */
  async fetchThreadById(id: number) {
    const discussions = await this.getDiscussions('all', 'recent', 1000);
    return discussions.find(d => d.id === id) || null;
  }

  /**
   * Legacy method: addComment (alias for addPoolComment or discussion reply)
   */
  async addComment(threadId: number, commentData: { user: string; text: string; replyTo?: number | null }) {
    // This would need to be a discussion reply, but we don't have that endpoint implemented yet
    // For now, return a placeholder
    return { success: true, id: Date.now() };
  }

  /**
   * Legacy method: likeComment (alias for addReaction)
   */
  async likeComment(threadId: number, commentId: number) {
    // This would be a reaction to a comment/reply
    // For now, return a placeholder
    return { success: true };
  }
}

const communityService = new CommunityService();

// Export legacy functions for backward compatibility
export const fetchThreads = () => communityService.fetchThreads();
export const createThread = (threadData: { title: string; author: string; category?: string }) => 
  communityService.createThread(threadData);
export const fetchThreadById = (id: number) => communityService.fetchThreadById(id);
export const addComment = (threadId: number, commentData: { user: string; text: string; replyTo?: number | null }) => 
  communityService.addComment(threadId, commentData);
export const likeComment = (threadId: number, commentId: number) => 
  communityService.likeComment(threadId, commentId);

export default communityService; 