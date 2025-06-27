import { Thread, Comment } from "@/types/community";

const API_URL = "/api/community";

// Fetch all threads
export async function fetchThreads() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch threads");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching threads:", error);
    throw error;
  }
}

// Fetch threads by category
export async function fetchThreadsByCategory(category: string) {
  try {
    const response = await fetch(`${API_URL}?category=${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch threads by category");
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching threads for category ${category}:`, error);
    throw error;
  }
}

// Fetch a single thread by ID
export async function fetchThreadById(id: number) {
  try {
    const response = await fetch(`${API_URL}?id=${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch thread with ID ${id}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching thread with ID ${id}:`, error);
    throw error;
  }
}

// Create a new thread
export async function createThread(threadData: {
  title: string;
  author: string;
  category?: string;
}) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(threadData),
    });
    
    if (!response.ok) {
      throw new Error("Failed to create thread");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating thread:", error);
    throw error;
  }
}

// Add a comment to a thread
export async function addComment(threadId: number, commentData: {
  user: string;
  text: string;
  replyTo?: number | null;
}) {
  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        threadId,
        comment: commentData,
        action: "add_comment",
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to add comment");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

// Like a comment
export async function likeComment(threadId: number, commentId: number) {
  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        threadId,
        comment: { id: commentId },
        action: "like_comment",
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to like comment");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error liking comment:", error);
    throw error;
  }
}

// Delete a thread
export async function deleteThread(threadId: number) {
  try {
    const response = await fetch(`${API_URL}?threadId=${threadId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error("Failed to delete thread");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting thread:", error);
    throw error;
  }
}

// Delete a comment
export async function deleteComment(threadId: number, commentId: number) {
  try {
    const response = await fetch(`${API_URL}?threadId=${threadId}&commentId=${commentId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error("Failed to delete comment");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
} 