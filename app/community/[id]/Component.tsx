"use client";

import { useState, useEffect } from "react";
import Button from "@/components/button";
import { useCommunityStore } from "@/store/useCommunityStore";
import { useStore } from "zustand";
import { FiMessageCircle, FiThumbsUp, FiShare2, FiFlag, FiClock, FiLoader } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { fetchThreadById, addComment, likeComment, Discussion } from "@/services/communityService";

export default function Component({ id }: { id: number }) {
  const { threads, setThreads } = useStore(useCommunityStore);

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [thread, setThread] = useState<(Discussion & { author: string; comments: Array<{ id: number; user: string; text: string; createdAt?: string; likes?: number; replyTo?: number }>; }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load thread from API on component mount
  useEffect(() => {
    const loadThread = async () => {
      try {
        setIsLoading(true);
        const discussionData = await fetchThreadById(id);
        if (discussionData) {
          // Convert Discussion to Thread-like structure for compatibility
          const threadData: Discussion & { author: string; comments: Array<{ id: number; user: string; text: string; createdAt?: string; likes?: number; replyTo?: number }>; } = {
            ...discussionData,
            author: discussionData.userAddress,
            comments: [] // TODO: Load actual replies when reply system is implemented
          };
          setThread(threadData);
        }
        setIsLoading(false);
      } catch (err) {
        console.error(`Failed to load thread with ID ${id}:`, err);
        setError("Failed to load discussion. Please try again later.");
        setIsLoading(false);
      }
    };

    loadThread();
  }, [id]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-xl font-semibold text-error">{error}</div>
        <p className="text-text-muted">This discussion may have been removed or doesn&apos;t exist.</p>
        <Button variant="primary" size="sm" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (isLoading || !thread) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-text-muted">Loading discussion...</p>
        </div>
      </div>
    );
  }

    const handlePostComment = async () => {
    if (!commentText.trim() || !thread) return;
    
    try {
      setIsLoading(true);
      
      const commentData = {
        user: "Anonymous", // In a real app, this would be the logged-in user
        text: commentText,
        replyTo: replyingTo
      };
      
      await addComment(thread.id, commentData);
      
      // Refresh the thread data
      const updatedDiscussion = await fetchThreadById(id);
      if (updatedDiscussion) {
        const updatedThread = {
          ...updatedDiscussion,
          author: updatedDiscussion.userAddress,
          comments: [] as Array<{ id: number; user: string; text: string; createdAt?: string; likes?: number; replyTo?: number }>
        };
        setThread(updatedThread);
        
        // Update the local store as well
        setThreads(
          threads.map(t => t.id === id ? updatedThread : t)
        );
      }
      
      setCommentText("");
      setReplyingTo(null);
      setIsLoading(false);
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!thread) return;
    
    try {
      await likeComment(thread.id, commentId);
      
      // Refresh the thread data
      const updatedDiscussion = await fetchThreadById(id);
      if (updatedDiscussion) {
        const updatedThread = {
          ...updatedDiscussion,
          author: updatedDiscussion.userAddress,
          comments: [] as Array<{ id: number; user: string; text: string; createdAt?: string; likes?: number; replyTo?: number }>
        };
        setThread(updatedThread);
        
        // Update the local store as well
        setThreads(
          threads.map(t => t.id === id ? updatedThread : t)
        );
      }
    } catch (err) {
      console.error("Error liking comment:", err);
      setError("Failed to like comment. Please try again.");
    }
  };

  // Group comments by parent/reply relationship
  const topLevelComments = thread?.comments?.filter(comment => !comment.replyTo) || [];
  const replies = thread?.comments?.filter(comment => comment.replyTo) || [];

  // Function to get replies for a specific comment
  const getRepliesFor = (commentId: number) => {
    return replies.filter(reply => reply.replyTo === commentId);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-xl font-semibold">Discussion not found</div>
        <p className="text-text-muted">This discussion may have been removed or doesn&apos;t exist.</p>
        <Button variant="primary" size="sm" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Thread header */}
      <div className="border-b border-dark-3 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-primary">{thread.title}</h2>
          <span className="rounded-full bg-primary bg-opacity-20 px-3 py-1 text-xs font-medium text-primary">
            {thread.category}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white">
              {(thread.author || 'A').charAt(0).toUpperCase()}
            </div>
      <div>
              <p className="font-medium text-text-secondary">{thread.author}</p>
              <p className="text-xs text-text-muted">
                <FiClock className="mr-1 inline-block" />
                {thread.createdAt ? formatDate(thread.createdAt) : "Posted recently"}
              </p>
            </div>
      </div>

          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              leftIcon={<FiShare2 />}
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              leftIcon={<FiFlag />}
            >
              Report
            </Button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-text-secondary">
            <FiMessageCircle className="mr-2 inline-block" />
            Comments ({thread.comments?.length || 0})
          </h3>
          <div className="text-sm text-text-muted">
            {(thread.comments?.length || 0) === 0 ? "Be the first to comment!" : "Join the conversation"}
          </div>
        </div>

        {/* Comment list */}
        <div className="flex flex-col gap-6">
          {topLevelComments.length === 0 ? (
            <div className="rounded-lg bg-bg-card bg-opacity-30 p-8 text-center">
              <p className="text-text-muted">No comments yet</p>
              <p className="mt-2 text-sm text-text-muted">Start the conversation!</p>
            </div>
          ) : (
            topLevelComments.map((comment) => (
              <div key={comment.id} className="flex flex-col gap-4">
                {/* Main comment */}
                <div className="rounded-lg bg-bg-card bg-opacity-30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">
                        {(comment.user || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-secondary">{comment.user}</p>
                        <p className="text-xs text-text-muted">
                          {comment.createdAt ? formatDate(comment.createdAt) : "recently"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="mb-4 text-text-secondary">{comment.text}</p>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLikeComment(comment.id)}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-primary"
                      disabled={isLoading}
                    >
                      <FiThumbsUp /> {comment.likes || 0} Likes
                    </button>
                    <button 
                      onClick={() => setReplyingTo(comment.id)}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-primary"
                      disabled={isLoading}
                    >
                      <FiMessageCircle /> Reply
                    </button>
                  </div>
                </div>
                
                {/* Replies */}
                {getRepliesFor(comment.id).length > 0 && (
                  <div className="ml-8 flex flex-col gap-3 border-l-2 border-dark-3 pl-4">
                    {getRepliesFor(comment.id).map((reply) => (
                      <div key={reply.id} className="rounded-lg bg-bg-card bg-opacity-30 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
                            {(reply.user || 'R').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-secondary">{reply.user}</p>
                            <p className="text-xs text-text-muted">
                              {reply.createdAt ? formatDate(reply.createdAt) : "recently"}
                            </p>
                          </div>
                        </div>
                        <p className="mb-2 text-sm text-text-secondary">{reply.text}</p>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleLikeComment(reply.id)}
                            className="flex items-center gap-1 text-xs text-text-muted hover:text-primary"
                            disabled={isLoading}
                          >
                            <FiThumbsUp /> {reply.likes || 0} Likes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Reply form */}
                {replyingTo === comment.id && (
                  <div className="ml-8 flex flex-col gap-3 border-l-2 border-dark-3 pl-4">
                    <div className="rounded-lg bg-bg-card bg-opacity-30 p-3">
                      <p className="mb-2 text-xs text-text-muted">
                        Replying to <span className="font-medium text-primary">{comment.user}</span>
                      </p>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write your reply..."
                        className="mb-3 w-full rounded-md border border-border-input bg-bg-card p-3 text-sm text-text-secondary focus:border-primary focus:outline-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setReplyingTo(null)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={handlePostComment}
                          loading={isLoading}
                          disabled={!commentText.trim() || isLoading}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Comment form */}
        {replyingTo === null && (
          <div className="mt-4 flex flex-col gap-4 rounded-lg bg-bg-card bg-opacity-30 p-4">
            <h4 className="text-sm font-medium text-text-secondary">Add a comment</h4>
        <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full rounded-md border border-border-input bg-bg-card p-4 text-sm text-text-secondary focus:border-primary focus:outline-none"
              rows={4}
            />
            <div className="flex justify-end">
              <Button 
                variant="primary" 
                onClick={handlePostComment}
                loading={isLoading}
                disabled={!commentText.trim() || isLoading}
              >
          Post Comment
        </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
