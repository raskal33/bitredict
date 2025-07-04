"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Comment } from "@/lib/types";

interface PoolCommentsProps {
  poolId: string;
  comments: Comment[];
  onAddComment: (poolId: string, comment: string, sentiment: 'bullish' | 'bearish' | 'neutral') => Promise<void>;
}

export default function PoolComments({ poolId, comments, onAddComment }: PoolCommentsProps) {
  const { address } = useAccount();
  const [newComment, setNewComment] = useState("");
  const [sentiment, setSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim() || !address) return;
    
    setSubmitting(true);
    try {
      await onAddComment(poolId, newComment, sentiment);
      setNewComment("");
      setSentiment('neutral');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (comment: Comment) => {
    return (
      <div key={comment.id}>
        <p>{comment.author.username}: {comment.content}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Comments ({comments.length})</h3>
      {address && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment"
            className="w-full p-2 border rounded"
            disabled={submitting}
          />
          <select value={sentiment} onChange={e => setSentiment(e.target.value as 'bullish' | 'bearish' | 'neutral')} disabled={submitting}>
            <option value="neutral">Neutral</option>
            <option value="bullish">Bullish</option>
            <option value="bearish">Bearish</option>
          </select>
          <button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      )}
      <div className="space-y-2">
        {comments.map(renderComment)}
      </div>
    </div>
  );
} 