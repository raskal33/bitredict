"use client";

import { useState } from "react";
import { 
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

interface PostMatchReflectionProps {
  onSubmit: (reflection: string) => Promise<void>;
}

export default function PostMatchReflection({ onSubmit }: PostMatchReflectionProps) {
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reflection.trim()) return;
    
    try {
      setSubmitting(true);
      await onSubmit(reflection);
      setReflection("");
    } catch (error) {
      console.error('Error submitting reflection:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
        Share Your Reflection
      </h3>
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="What did you learn from this outcome?"
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
        rows={4}
        disabled={submitting}
      />
      <button
        type="submit"
        disabled={!reflection.trim() || submitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg disabled:opacity-50"
      >
        <PaperAirplaneIcon className="w-5 h-5" />
        {submitting ? 'Submitting...' : 'Submit Reflection'}
      </button>
    </form>
  );
}