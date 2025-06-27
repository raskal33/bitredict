export type Comment = {
  id: number;
  user: string;
  text: string;
  likes?: number;
  createdAt?: string;
  replyTo?: number | null;
};

export type Thread = {
  id: number;
  title: string;
  author: string;
  category: string;
  createdAt: string;
  comments: Comment[];
};

export type CommunityState = {
  threads: Thread[];
  categories: string[];
};

export type ThreadFormData = {
  title: string;
  author: string;
  category?: string;
};

export type CommentFormData = {
  user: string;
  text: string;
  replyTo?: number | null;
}; 