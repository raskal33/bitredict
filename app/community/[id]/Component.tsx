"use client";

import { useState, useEffect } from "react";
import Button from "@/components/button";
import {
  MessageCircle,
  Heart,
  Share2,
  Flag,
  Clock,
  Loader2,
  ArrowLeft,
  MoreHorizontal,
  Zap,
  Send,
  User,
  CornerDownRight,
  MessageSquare
} from "lucide-react";
import communityService, { fetchThreadById, Discussion } from "@/services/communityService";
import Link from "next/link";
import { useAccount } from "wagmi";

export default function Component({ id }: { id: number }) {
  const { address } = useAccount();
  // useStore(useCommunityStore); // Removed if unused

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [thread, setThread] = useState<(Discussion & { author: string; comments: Array<{ id: number; user: string; text: string; createdAt?: string; likes?: number; replyTo?: number; userBadge?: string; reputation?: number }>; }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load thread from API on component mount
  useEffect(() => {
    const loadThread = async () => {
      try {
        setIsLoading(true);
        const discussionData = await fetchThreadById(id);
        if (discussionData) {
          // Mock some comments for fallback
          const mockComments = [
            { id: 101, user: "0x3A2b...9d4E", text: "Quality analysis. I'm seeing similar patterns in the high-frequency telemetry.", createdAt: new Date(Date.now() - 1200000).toISOString(), likes: 12, userBadge: "Veteran", reputation: 820 },
            { id: 102, user: "0x1234...5678", text: "Have you factored in the cross-chain liquidity sync happening next week?", createdAt: new Date(Date.now() - 600000).toISOString(), likes: 5, userBadge: "Oracle", reputation: 1150 },
            { id: 103, user: "0x7890...abcd", text: "Bullish on this strategy.", createdAt: new Date(Date.now() - 300000).toISOString(), likes: 8, replyTo: 101, userBadge: "Neophyte", reputation: 450 }
          ];

          const threadData = {
            ...discussionData,
            author: discussionData.userAddress,
            comments: mockComments
          };
          setThread(threadData);
        } else {
          throw new Error("Thread not found");
        }
      } catch (err) {
        console.error(`Failed to load thread with ID ${id}:`, err);
        setError("Signal trace lost. The requested data packet could not be retrieved.");
      } finally {
        setIsLoading(false);
      }
    };

    loadThread();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-somnia-cyan" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/40 animate-pulse">Synchronizing Neural Signal...</p>
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="flex flex-col items-center justify-center py-20 glass-card border-dashed border-white/10 text-center gap-6">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
          <Zap className="w-10 h-10 text-red-500 rotate-180" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Trace Failed</h3>
          <p className="text-text-muted text-sm max-w-xs">{error || "The discussion node has been purged or is unreachable."}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.history.back()} className="!rounded-xl border-white/10">
          Return to Collective
        </Button>
      </div>
    );
  }

  const handlePostComment = async () => {
    if (!commentText.trim() || !thread) return;
    try {
      const newComment = {
        id: Date.now(),
        user: "You (Identity Node)",
        text: commentText,
        createdAt: new Date().toISOString(),
        likes: 0,
        replyTo: replyingTo || undefined,
        userBadge: "Operator",
        reputation: 150
      };

      setThread({
        ...thread,
        comments: [...thread.comments, newComment]
      });
      setCommentText("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const topLevelComments = thread.comments.filter(comment => !comment.replyTo);
  const replies = thread.comments.filter(comment => !!comment.replyTo);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Back Link */}
      <Link href="/community" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted/40 hover:text-somnia-cyan transition-colors group">
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        Collective Dashboard
      </Link>

      {/* Signal Post Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-somnia-cyan/10 text-somnia-cyan border border-somnia-cyan/20">
              {thread.category}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {communityService.formatTimeAgo(thread.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-white transition-all">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-white transition-all text-red-400">
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-none">
          {thread.title}
        </h1>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-somnia-cyan/20 to-somnia-blue/20 flex items-center justify-center border border-white/5">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{thread.author}</span>
              <span className="text-[9px] font-black uppercase text-somnia-cyan bg-somnia-cyan/10 px-1.5 py-0.5 rounded border border-somnia-cyan/10">{thread.userBadge || 'Operator'}</span>
            </div>
            <div className="text-[10px] text-text-muted font-medium">Neural Reputation: <span className="text-white">{thread.reputation}</span></div>
          </div>
        </div>

        <div className="text-text-secondary text-sm leading-relaxed font-medium italic p-6 glass-card border-white/5 bg-white/[0.01]">
          &quot;{thread.content}&quot;
        </div>
      </div>

      {/* Discussion Feed */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <MessageCircle className="text-somnia-blue w-4 h-4" />
            Neural Sync Log ({thread.comments.length})
          </h3>
          <div className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest">
            Latest Activity: Just Now
          </div>
        </div>

        <div className="space-y-6">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              {/* Comment Block */}
              <div className="glass-card p-5 border-white/5 space-y-4 group hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{comment.user}</span>
                        <span className="text-[8px] font-black uppercase text-text-muted/40 tracking-widest">{comment.userBadge}</span>
                      </div>
                      <div className="text-[9px] text-text-muted/40 font-black uppercase tracking-tighter">Sync: {communityService.formatTimeAgo(comment.createdAt || '')}</div>
                    </div>
                  </div>
                  <button className="text-text-muted group-hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary font-medium leading-relaxed pl-11">
                  {comment.text}
                </p>

                <div className="flex items-center gap-4 pl-11">
                  <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-somnia-magenta transition-colors">
                    <Heart className="w-3.5 h-3.5 fill-current opacity-20 group-hover:opacity-40" />
                    {comment.likes}
                  </button>
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-somnia-blue transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Reply
                  </button>
                </div>
              </div>

              {/* Nested Replies */}
              {replies.filter(r => r.replyTo === comment.id).map(reply => (
                <div key={reply.id} className="pl-11 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-2">
                      <CornerDownRight className="w-4 h-4 text-text-muted/20" />
                    </div>
                    <div className="flex-1 glass-card p-4 border-white/5 bg-white/[0.01] space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-black">
                          {reply.user.charAt(0)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-white">{reply.user}</span>
                          <span className="text-[8px] font-black uppercase text-text-muted/20">{communityService.formatTimeAgo(reply.createdAt || '')}</span>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed italic">
                        &quot;{reply.text}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Reply Area */}
        <div className="pt-10">
          <div className="glass-card p-6 border-somnia-blue/10 bg-somnia-blue/[0.01] space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-somnia-blue/10 border border-somnia-blue/20">
                <MessageSquare className="w-4 h-4 text-somnia-blue" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Broadcast Neural Reply</h4>
              {replyingTo && (
                <div className="ml-auto flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md">
                  <span className="text-[8px] font-black uppercase text-text-muted/40">Replying to Node: {replyingTo}</span>
                  <button onClick={() => setReplyingTo(null)} className="text-text-muted hover:text-white">x</button>
                </div>
              )}
            </div>

            <div className="relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter message for the collective..."
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-text-muted/20 focus:outline-none focus:border-somnia-blue/30 focus:ring-1 focus:ring-somnia-blue/10 min-h-[120px] transition-all"
              />
              <button
                onClick={handlePostComment}
                disabled={!commentText.trim()}
                className="absolute bottom-4 right-4 p-3 rounded-xl bg-somnia-blue text-black hover:bg-somnia-cyan transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-text-muted/40 px-2">
              <span>Authorized Identity: {address?.slice(0, 10)}...</span>
              <span>{commentText.length} / 1000 Bytes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
