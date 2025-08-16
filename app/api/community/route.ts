import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define proper types
interface Thread {
  id: number;
  title: string;
  author: string;
  category: string;
  createdAt: string;
  comments: Comment[];
}

interface Comment {
  id: number;
  user: string;
  text: string;
  likes: number;
  createdAt: string;
  replyTo: number | null;
}

interface DatabaseStructure {
  threads: Thread[];
  categories: string[];
}

// Path to our JSON file that will act as a simple database
const dbPath = path.join(process.cwd(), "data", "community.json");

// Helper function to ensure the data directory exists
const ensureDataDirExists = () => {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Helper function to read the database
const readDb = (): DatabaseStructure => {
  ensureDataDirExists();
  
  if (!fs.existsSync(dbPath)) {
    // Create default structure if file doesn't exist
    const defaultData: DatabaseStructure = {
      threads: [],
      categories: ["General", "Crypto", "Sports", "Technology", "Finance", "Entertainment", "Health", "Education"]
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  
  const data = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(data) as DatabaseStructure;
};

// Helper function to write to the database
const writeDb = (data: DatabaseStructure) => {
  ensureDataDirExists();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// GET handler - Fetch all threads or a specific thread
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("id");
    const category = searchParams.get("category");
    
    const db = readDb();
    
    if (threadId) {
      // Return a specific thread
      const thread = db.threads.find((t: Thread) => t.id === parseInt(threadId));
      if (!thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }
      return NextResponse.json(thread);
    } else if (category) {
      // Return threads filtered by category
      const filteredThreads = db.threads.filter((t: Thread) => 
        t.category.toLowerCase() === category.toLowerCase()
      );
      return NextResponse.json({ threads: filteredThreads, categories: db.categories });
    } else {
      // Return all threads
      return NextResponse.json(db);
    }
  } catch (error) {
    console.error("Error fetching community data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// POST handler - Create a new thread
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, author, category } = body;
    
    if (!title || !author) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }
    
    const db = readDb();
    
    // Generate a new ID
    const newId = db.threads.length > 0 
      ? Math.max(...db.threads.map((t: Thread) => t.id)) + 1 
      : 1;
    
    // Create new thread
    const newThread: Thread = {
      id: newId,
      title,
      author,
      category: category || "General",
      createdAt: new Date().toISOString(),
      comments: [],
    };
    
    // Add to database
    db.threads.unshift(newThread);
    writeDb(db);
    
    return NextResponse.json(newThread, { status: 201 });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}

// PUT handler - Update a thread or add a comment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, comment, action } = body;
    
    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }
    
    const db = readDb();
    const threadIndex = db.threads.findIndex((t: Thread) => t.id === parseInt(threadId));
    
    if (threadIndex === -1) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    
    // Handle different actions
    if (action === "add_comment" && comment) {
      // Add a comment to the thread
      const newComment: Comment = {
        id: Date.now(),
        user: comment.user || "Anonymous",
        text: comment.text,
        likes: 0,
        createdAt: new Date().toISOString(),
        replyTo: comment.replyTo || null,
      };
      
      db.threads[threadIndex].comments.push(newComment);
      writeDb(db);
      
      return NextResponse.json(newComment);
    } else if (action === "like_comment" && comment?.id) {
      // Like a comment
      const commentIndex = db.threads[threadIndex].comments.findIndex(
        (c: Comment) => c.id === parseInt(comment.id)
      );
      
      if (commentIndex === -1) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
      
      db.threads[threadIndex].comments[commentIndex].likes = 
        (db.threads[threadIndex].comments[commentIndex].likes || 0) + 1;
      
      writeDb(db);
      
      return NextResponse.json(db.threads[threadIndex].comments[commentIndex]);
    } else {
      return NextResponse.json(
        { error: "Invalid action or missing data" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating thread:", error);
    return NextResponse.json({ error: "Failed to update thread" }, { status: 500 });
  }
}

// DELETE handler - Delete a thread or comment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");
    const commentId = searchParams.get("commentId");
    
    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }
    
    const db = readDb();
    
    if (commentId) {
      // Delete a specific comment
      const threadIndex = db.threads.findIndex((t: Thread) => t.id === parseInt(threadId));
      
      if (threadIndex === -1) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }
      
      const commentIndex = db.threads[threadIndex].comments.findIndex(
        (c: Comment) => c.id === parseInt(commentId)
      );
      
      if (commentIndex === -1) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
      
      // Remove the comment
      db.threads[threadIndex].comments.splice(commentIndex, 1);
      writeDb(db);
      
      return NextResponse.json({ message: "Comment deleted successfully" });
    } else {
      // Delete entire thread
      const threadIndex = db.threads.findIndex((t: Thread) => t.id === parseInt(threadId));
      
      if (threadIndex === -1) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }
      
      // Remove the thread
      db.threads.splice(threadIndex, 1);
      writeDb(db);
      
      return NextResponse.json({ message: "Thread deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
} 