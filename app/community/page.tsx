"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import AnimatedTitle from "@/components/AnimatedTitle";
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  HeartIcon,
  PlusIcon,
  ArrowPathIcon,
  UserIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import {
  UsersIcon as UsersSolid,
  ChatBubbleLeftRightIcon as ChatSolid
} from "@heroicons/react/24/solid";

interface Discussion {
  id: number;
  title: string;
  content: string;
  user_address: string;
  category: string;
  total_likes: number;
  reply_count: number;
  created_at: string;
  last_activity: string;
  user_badge?: string;
  badge_rarity?: string;
  reputation: number;
}

interface CommunityStats {
  activeDiscussions: number;
  communityMembers: number;
  totalComments: number;
  totalLikes: number;
  weeklyActivity: number;
}

export default function CommunityPage() {
  const { address } = useAccount();
  const [activeSection, setActiveSection] = useState<"discussions" | "guidelines" | "create">("discussions");
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    activeDiscussions: 0,
    communityMembers: 0,
    totalComments: 0,
    totalLikes: 0,
    weeklyActivity: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  // New discussion form
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[]
  });

  const categories = ['all', 'general', 'predictions', 'strategy', 'crypto', 'sports', 'feedback'];

  const fetchDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      const communityService = (await import('@/services/communityService')).default;
      const discussionsData = await communityService.getDiscussions(selectedCategory, sortBy, 20);
    
      const typedDiscussions: Discussion[] = discussionsData.map((discussion) => ({
        id: discussion.id,
        title: discussion.title,
        content: discussion.content,
        user_address: discussion.userAddress,
        category: discussion.category,
        total_likes: discussion.totalLikes,
        reply_count: discussion.replyCount,
        created_at: discussion.createdAt,
        last_activity: discussion.lastActivity,
        user_badge: discussion.userBadge,
        badge_rarity: discussion.badgeRarity,
        reputation: discussion.reputation
      }));
      setDiscussions(typedDiscussions);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy]);

  const fetchCommunityStats = useCallback(async () => {
    try {
      const communityService = (await import('@/services/communityService')).default;
      const statsData = await communityService.getCommunityStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching community stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchDiscussions();
    fetchCommunityStats();
  }, [fetchDiscussions, fetchCommunityStats]);

  const createDiscussion = async () => {
    if (!address || !newDiscussion.title.trim() || !newDiscussion.content.trim()) return;

    try {
      const communityService = (await import('@/services/communityService')).default;
      await communityService.createDiscussion(
        address,
        newDiscussion.title.trim(),
        newDiscussion.content.trim(),
        newDiscussion.category,
        newDiscussion.tags
      );
      
      setNewDiscussion({ title: '', content: '', category: 'general', tags: [] });
      setActiveSection('discussions');
      fetchDiscussions();
      fetchCommunityStats();
    } catch (error) {
      console.error('Error creating discussion:', error);
    }
  };

  const handleLike = async (discussionId: number) => {
    if (!address) return;

    try {
      const communityService = (await import('@/services/communityService')).default;
      const success = await communityService.addReaction(address, 'discussion', discussionId, 'like');
      
      if (success) {
        fetchDiscussions(); // Refresh to show updated likes
      }
    } catch (error) {
      console.error('Error liking discussion:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-orange-400';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      case 'uncommon': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

const statsData = [
  {
    title: "Active Discussions",
      value: stats.activeDiscussions.toString(),
    subtitle: "Live conversations",
    icon: ChatBubbleLeftRightIcon,
    gradient: "from-primary to-blue-500",
    iconColor: "text-primary",
    glowColor: "glow-cyan"
  },
  {
    title: "Community Members",
      value: stats.communityMembers.toString(),
    subtitle: "Growing strong",
    icon: UsersIcon,
    gradient: "from-secondary to-purple-500", 
    iconColor: "text-secondary",
    glowColor: "glow-magenta"
  },
  {
    title: "Total Comments",
      value: stats.totalComments.toString(),
    subtitle: "Engaging content",
      icon: ChatBubbleLeftRightIcon,
    gradient: "from-green-400 to-blue-500",
    iconColor: "text-green-400", 
    glowColor: "glow-violet"
  },
];

const guidelinesData = [
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Stay On Topic",
    description: "Contribute meaningfully to discussions and stay relevant",
    color: "text-blue-400"
  },
  {
      icon: ChatBubbleLeftRightIcon,
    title: "No Spam",
    description: "Avoid spam, advertising, or excessive self-promotion",
    color: "text-yellow-400"
  },
  {
      icon: ChatBubbleLeftRightIcon,
    title: "Respect Privacy",
    description: "Maintain privacy and confidentiality at all times",
    color: "text-green-400"
  }
];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-[20%] left-[15%] w-6 h-6 bg-primary/20 rounded-full blur-sm"
            animate={{ y: [-10, 10, -10], x: [-5, 5, -5], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-[60%] right-[20%] w-4 h-4 bg-secondary/30 rounded-full blur-sm"
            animate={{ y: [10, -10, 10], x: [5, -5, 5], scale: [1, 1.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute bottom-[30%] left-[70%] w-5 h-5 bg-accent/25 rounded-full blur-sm"
            animate={{ y: [-8, 8, -8], x: [-3, 3, -3], scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>

        <div className="relative z-10 mb-8">
          <AnimatedTitle 
            size="lg"
            leftIcon={UsersSolid}
            rightIcon={ChatSolid}
          >
            Community Hub
          </AnimatedTitle>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-text-secondary max-w-2xl mx-auto text-center"
          >
            Join discussions, share insights, and connect with fellow members of the BitRedict community.
          </motion.p>
        </div>
      </motion.div>

      {/* Real-time Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {statsData.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`glass-card text-center bg-gradient-to-br ${stat.gradient}/10 border-2 border-transparent hover:border-white/10 hover:${stat.glowColor} transition-all duration-300`}
            >
              <IconComponent className={`h-12 w-12 mx-auto mb-4 ${stat.iconColor}`} />
              <h3 className="text-2xl font-bold text-text-primary mb-1">{stat.value}</h3>
              <p className="text-lg font-semibold text-text-secondary mb-1">{stat.title}</p>
              <p className="text-sm text-text-muted">{stat.subtitle}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center gap-4 flex-wrap"
      >
        <button
          onClick={() => setActiveSection("discussions")}
          className={`px-6 py-3 rounded-button font-medium transition-all duration-200 ${
            activeSection === "discussions"
              ? "bg-gradient-primary text-black shadow-button"
              : "glass-card text-text-secondary hover:text-text-primary"
          }`}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5 inline mr-2" />
          Discussions
        </button>
        {address && (
          <button
            onClick={() => setActiveSection("create")}
            className={`px-6 py-3 rounded-button font-medium transition-all duration-200 ${
              activeSection === "create"
                ? "bg-gradient-primary text-black shadow-button"
                : "glass-card text-text-secondary hover:text-text-primary"
            }`}
          >
            <PlusIcon className="w-5 h-5 inline mr-2" />
            Create Discussion
          </button>
        )}
        <button
          onClick={() => setActiveSection("guidelines")}
          className={`px-6 py-3 rounded-button font-medium transition-all duration-200 ${
            activeSection === "guidelines"
              ? "bg-gradient-primary text-black shadow-button"
              : "glass-card text-text-secondary hover:text-text-primary"
          }`}
        >
          <ShieldCheckIcon className="w-5 h-5 inline mr-2" />
          Guidelines
        </button>
      </motion.div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {activeSection === "discussions" && (
          <motion.div
            key="discussions"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <span className="text-sm text-text-muted">Category:</span>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      selectedCategory === category
                        ? 'bg-primary text-black'
                        : 'glass-card text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('recent')}
                  className={`px-3 py-1 rounded-button text-sm ${
                    sortBy === 'recent' ? 'bg-primary text-black' : 'glass-card text-text-muted'
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-3 py-1 rounded-button text-sm ${
                    sortBy === 'popular' ? 'bg-primary text-black' : 'glass-card text-text-muted'
                  }`}
                >
                  Popular
                </button>
                <button
                  onClick={fetchDiscussions}
                  className="p-2 glass-card hover:bg-primary/10 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Discussions List */}
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass-card animate-pulse">
                      <div className="h-24 bg-bg-card rounded"></div>
                    </div>
                  ))}
                </div>
              ) : discussions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card text-center py-12"
                >
                  <ChatBubbleLeftRightIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    No Discussions Yet
                  </h3>
                  <p className="text-text-muted mb-4">
                    Be the first to start a conversation in this category
                  </p>
                  {address && (
                    <button
                      onClick={() => setActiveSection('create')}
                      className="px-6 py-2 bg-gradient-primary text-black rounded-button"
                    >
                      Start Discussion
                    </button>
                  )}
                </motion.div>
              ) : (
                discussions.map((discussion) => (
                  <motion.div
                    key={discussion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className="glass-card hover:border-primary/30 transition-all duration-300 cursor-pointer"
                    onClick={() => window.location.href = `/community/${discussion.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-black" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-text-primary line-clamp-1">
                            {discussion.title}
                          </h3>
                          <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
                            {discussion.category}
                          </span>
                        </div>
                        
                        <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                          {discussion.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-text-muted">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">
                                {discussion.user_address.slice(0, 6)}...{discussion.user_address.slice(-4)}
                              </span>
                              {discussion.user_badge && (
                                <span className={`text-xs px-2 py-1 rounded-full bg-bg-card ${getBadgeColor(discussion.badge_rarity || 'common')}`}>
                                  {discussion.user_badge}
                                </span>
                              )}
                              <span className="text-xs">Rep: {discussion.reputation}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {formatTimeAgo(discussion.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(discussion.id);
                              }}
                              className="flex items-center gap-1 text-text-muted hover:text-red-400 transition-colors"
                            >
                              <HeartIcon className="w-4 h-4" />
                              <span className="text-sm">{discussion.total_likes}</span>
                            </button>
                            <div className="flex items-center gap-1 text-text-muted">
                              <ChatBubbleLeftRightIcon className="w-4 h-4" />
                              <span className="text-sm">{discussion.reply_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeSection === "create" && address && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="glass-card"
          >
            <h3 className="text-2xl font-bold gradient-text mb-6">Start a New Discussion</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Discussion Title
                </label>
                <input
                  type="text"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What would you like to discuss?"
                  className="w-full p-3 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                  maxLength={100}
                />
                <div className="text-xs text-text-muted mt-1">
                  {newDiscussion.title.length}/100 characters
                </div>
            </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Category
                </label>
                <select
                  value={newDiscussion.category}
                  onChange={(e) => setNewDiscussion(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-3 bg-bg-card border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                >
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Content
                </label>
                <textarea
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your thoughts, ask questions, or start a conversation..."
                  className="w-full p-3 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-primary"
                  rows={6}
                  maxLength={1000}
                />
                <div className="text-xs text-text-muted mt-1">
                  {newDiscussion.content.length}/1000 characters
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={createDiscussion}
                  disabled={!newDiscussion.title.trim() || !newDiscussion.content.trim()}
                  className="px-6 py-3 bg-gradient-primary text-black rounded-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Discussion
                </button>
                <button
                  onClick={() => setActiveSection('discussions')}
                  className="px-6 py-3 glass-card text-text-secondary hover:text-text-primary rounded-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === "guidelines" && (
          <motion.div
            key="guidelines"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="glass-card"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold gradient-text mb-4">Community Guidelines</h3>
              <p className="text-text-secondary">
                Help us maintain a positive and engaging environment for everyone.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guidelinesData.map((guideline, index) => {
                const IconComponent = guideline.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start gap-4 p-4 bg-bg-card/50 rounded-lg border border-border"
                  >
                    <IconComponent className={`h-8 w-8 ${guideline.color} flex-shrink-0 mt-1`} />
                    <div>
                      <h4 className="text-lg font-semibold text-text-primary mb-2">
                        {guideline.title}
                      </h4>
                      <p className="text-text-secondary text-sm">
                        {guideline.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/30">
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Earn Recognition
              </h4>
              <p className="text-text-secondary text-sm">
                Active community members earn badges and BITR rewards! Contribute thoughtfully to discussions, 
                help newcomers, and engage positively to unlock special achievements.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
