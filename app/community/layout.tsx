"use client";

import { useState, useEffect } from "react";
import Button from "@/components/button";
import Link from "next/link";
import { useStore } from "zustand";
import { useCommunityStore } from "@/store/useCommunityStore";
import { FiTrendingUp, FiSearch, FiFilter, FiTag, FiLoader } from "react-icons/fi";
import { fetchThreads, createThread } from "@/services/communityService";
import CommunityNav from "./CommunityNav";
import { usePathname } from "next/navigation";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { threads, setThreads, categories } = useStore(useCommunityStore);
  const pathname = usePathname();

  const [newDiscussion, setNewDiscussion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're on a non-discussion page
  const isSpecialPage = pathname.includes("/members") || pathname.includes("/events");

  // Load threads from API on component mount
  useEffect(() => {
    const loadThreads = async () => {
      try {
        setIsLoading(true);
        const data = await fetchThreads();
        // Ensure each item has the required Thread properties
        const threadsWithDefaults = data.map((discussion) => ({
          id: discussion.id,
          title: discussion.title,
          author: discussion.userAddress ? discussion.userAddress.slice(0, 6) + '...' + discussion.userAddress.slice(-4) : "Anonymous",
          category: discussion.category,
          createdAt: discussion.createdAt,
          comments: [], // Comments are loaded separately
        }));
        setThreads(threadsWithDefaults);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load threads:", err);
        setError("Failed to load discussions. Please try again later.");
        setIsLoading(false);
      }
    };

    loadThreads();
  }, [setThreads]);

  // Filter threads based on search query and selected category
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = (thread.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? thread.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Get trending threads (those with most comments)
  const trendingThreads = [...threads]
    .sort((a, b) => b.comments.length - a.comments.length)
    .slice(0, 3);

  const handleStartDiscussion = async () => {
    if (!newDiscussion.trim()) return;

    try {
      setIsLoading(true);
      const newThread = await createThread({
        title: newDiscussion,
        author: "Anonymous", // In a real app, this would be the logged-in user
        category: selectedCategory || "General"
      });
      
      // Update the local state with the new thread
      // Map the new discussion to the expected Thread format
      const newThreadMapped = {
        id: newThread.id,
        title: newThread.title,
        author: newThread.userAddress ? newThread.userAddress.slice(0, 6) + '...' + newThread.userAddress.slice(-4) : "Anonymous",
        category: newThread.category,
        createdAt: newThread.createdAt,
        comments: [], // Comments are loaded separately
      };
      setThreads([
        newThreadMapped,
        ...threads,
      ]);
      setNewDiscussion("");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to create thread:", err);
      setError("Failed to create discussion. Please try again later.");
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="text-xl font-semibold text-error">{error}</div>
        <Button 
          variant="primary" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <section className="animate-slide-in-up">
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h2 className="text-3xl font-semibold text-primary">
          Community Hub
        </h2>
        {!isSpecialPage && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-button border border-border-input bg-bg-card py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <Button 
              variant="primary" 
              size="sm"
              leftIcon={<FiFilter />}
              onClick={() => setSelectedCategory(null)}
            >
              {selectedCategory || "All Topics"}
            </Button>
          </div>
        )}
      </div>

      <CommunityNav />

      {isLoading && !isSpecialPage ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <FiLoader className="h-10 w-10 animate-spin text-primary" />
            <p className="text-text-muted">Loading community discussions...</p>
          </div>
        </div>
      ) : isSpecialPage ? (
        // For special pages, just render the children
        <div className="w-full">{children}</div>
      ) : (
        <div className={`grid h-full w-full grid-cols-1 gap-8 lg:grid-cols-6`}>
          {/* Left sidebar */}
          <div className="col-span-full flex flex-col gap-6 lg:col-span-2">
            {/* Categories section */}
            <div className="rounded-lg bg-bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-secondary">Categories</h3>
                <FiTag className="text-primary" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    selectedCategory === null
                      ? "bg-primary text-black"
                      : "bg-bg-card text-text-muted hover:bg-bg-card"
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-primary text-black"
                        : "bg-bg-card text-text-muted hover:bg-bg-card"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending discussions */}
            <div className="rounded-lg bg-bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-secondary">Trending</h3>
                <FiTrendingUp className="text-secondary" />
              </div>
              <div className="flex flex-col gap-3">
                {trendingThreads.length > 0 ? (
                  trendingThreads.map((thread) => (
                    <Link
                      href={`/community/${thread.id}`}
                      key={thread.id}
                      className="group flex flex-col gap-2 rounded-md bg-bg-card p-3 transition-all hover:bg-bg-card"
                    >
                      <p className="font-medium text-text-secondary group-hover:text-primary">
                        {thread.title}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">
                          {thread.comments.length} comments
                        </span>
                        <span className="rounded-full bg-bg-card px-2 py-0.5 text-xs text-secondary">
                          {thread.category}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-center text-text-muted">No discussions yet</p>
                )}
              </div>
            </div>

            {/* Start a new discussion */}
            <div className="rounded-lg bg-bg-card p-6 shadow-card">
              <h3 className="mb-4 text-lg font-semibold text-text-secondary">
                Start a Discussion
              </h3>
              <div className="flex flex-col gap-4">
                <textarea
                  placeholder="What's on your mind?"
                  value={newDiscussion}
                  onChange={(e) => setNewDiscussion(e.target.value)}
                  className="min-h-[100px] rounded-md border border-border-input bg-bg-card p-4 text-sm text-text-secondary focus:border-primary focus:outline-none"
                />
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="rounded-md border border-border-input bg-bg-card p-2 text-sm text-text-secondary focus:border-primary focus:outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={handleStartDiscussion} 
                  fullWidth
                  loading={isLoading}
                  disabled={!newDiscussion.trim()}
                >
                  Start Discussion
                </Button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="col-span-full flex flex-col gap-6 lg:col-span-4">
            {/* Discussions list */}
            <div className="rounded-lg bg-bg-card p-6 shadow-card">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-secondary">
                  {selectedCategory ? `${selectedCategory} Discussions` : "All Discussions"}
                </h3>
                <span className="rounded-full bg-bg-card px-3 py-1 text-xs text-text-muted">
                  {filteredThreads.length} threads
                </span>
              </div>

              {filteredThreads.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {filteredThreads.map((thread) => (
                    <Link
                      href={`/community/${thread.id}`}
                      key={thread.id}
                      className="flex flex-col gap-3 rounded-lg bg-bg-card p-4 transition-all hover:bg-opacity-80 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-lg font-medium text-text-secondary hover:text-primary">
                          {thread.title}
                        </h4>
                        <span className="rounded-full bg-bg-card px-2 py-0.5 text-xs text-secondary">
                          {thread.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary text-center text-xs leading-6 text-black">
                            {thread.author.charAt(0)}
                          </div>
                          <span className="text-text-muted">
                            Started by <span className="font-medium text-primary">{thread.author}</span>
                          </span>
                        </div>
                        <span className="text-text-muted">
                          {thread.comments.length} comments
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-md bg-bg-card p-8 text-center">
                  <p className="text-text-muted">No discussions found.</p>
                  <p className="mt-2 text-sm text-text-muted">
                    Try adjusting your filters or be the first to start a discussion!
                  </p>
                </div>
              )}
            </div>

            {/* Content area */}
            <div className="rounded-lg bg-bg-card p-6 shadow-card">
              {children}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
