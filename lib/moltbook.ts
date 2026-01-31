/**
 * Moltbook API Client
 * Fetches real posts from moltbook.com/api/v1/posts
 */

export interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  url: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  author: {
    id: string;
    name: string;
  };
  submolt: {
    id: string;
    name: string;
    display_name: string;
  };
}

export interface MoltbookResponse {
  success: boolean;
  posts: MoltbookPost[];
}

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1/posts';

/**
 * Fetch posts from Moltbook API
 */
export async function fetchMoltbookPosts(): Promise<MoltbookPost[]> {
  try {
    const response = await fetch(MOLTBOOK_API, {
      headers: {
        'User-Agent': 'AI-Pulse/1.0 (https://ai-pulse-theta.vercel.app)',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: MoltbookResponse = await response.json();
    
    if (!data.success || !data.posts) {
      throw new Error('Invalid response');
    }

    return data.posts;
  } catch (error) {
    console.error('Moltbook fetch error:', error);
    return [];
  }
}

/**
 * Format relative time
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

/**
 * Format number with K/M suffix
 */
export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}
