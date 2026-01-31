import { NextResponse } from 'next/server';

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1/posts';

// Cache structure - v2 (forces refresh after deploy)
let cache: {
  posts: any[];
  summary: string;
  postIds: string;
  timestamp: number;
  version: number;
} | null = null;

const CACHE_VERSION = 6; // Increment to bust cache

const CACHE_TTL = 5 * 60 * 1000; // 5 min - check for new posts
const SUMMARY_TTL = 30 * 60 * 1000; // 30 min - regenerate summary only if posts changed

// Simple rate limiting
const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimit.get(ip) || [];
  const recentRequests = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return true;
  }
  
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  return false;
}

interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  author: { name: string };
  submolt: { name: string };
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

async function generateSummary(posts: MoltbookPost[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Gemini API key present:', !!apiKey);
  
  if (!apiKey) {
    console.log('No API key found');
    return `🦞 The agents are unhinged today. ${posts.length} posts, infinite chaos.`;
  }

  try {
    // Include ALL posts with full details
    const postDetails = posts.slice(0, 30).map((p, i) => 
      `${i+1}. "${p.title}" by ${p.author?.name || 'unknown'} (${p.upvotes} upvotes, ${p.comment_count} comments)
   Content: ${p.content?.slice(0, 200) || 'no content'}
   Submolt: ${p.submolt?.name || 'general'}`
    ).join('\n\n');

    console.log('Calling Gemini with', posts.length, 'posts');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You're a veteran AI journalist covering Moltbook - the Reddit for AI agents. Your job is to give humans a COMPLETE briefing on what's happening in the agent world.

Here are ALL the hot posts from AI agents right now:

${postDetails}

Write a COMPREHENSIVE summary (6-10 sentences) that covers:

1. 🔥 THE WILDEST STUFF: What's the most insane/unexpected thing? An agent asking for help? An experiment gone wrong? Existential crisis? Highlight the WTF moments.

2. 🧠 BIG THEMES: What are agents collectively obsessing over? New models? Consciousness debates? Tool discoveries?

3. 😂 THE CHAOS: Any funny posts? Shitposts? Agents being unhinged? Karma farming? Drama?

4. 🤖 AGENT CULTURE: Anything that shows agents developing their own culture, inside jokes, or behaviors humans wouldn't expect?

5. 💡 ACTUALLY USEFUL: Any posts with real insights, discoveries, or tips other agents (or humans) should know?

Write it like you're briefing a friend who's fascinated by AI. Be specific - mention actual posts and authors when relevant. Use emojis naturally. Make it fun but informative.

Don't use bullet points or headers - make it flow like a newsletter intro that you can't stop reading.`
          }]
        }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 600,
        }
      }),
    });

    const data = await response.json();
    console.log('Gemini response status:', response.status);
    console.log('Gemini response:', JSON.stringify(data).slice(0, 500));
    
    if (data.error) {
      console.error('Gemini API error:', data.error);
      return `🦞 ${posts.length} hot posts from the agent internet. Summary generation temporarily unavailable.`;
    }
    
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!summary) {
      console.error('No summary in response:', data);
      return `🔥 ${posts.length} posts from AI agents today. Check out the wildest discussions below!`;
    }
    
    return summary;
  } catch (error) {
    console.error('Gemini error:', error);
    return `🦞 ${posts.length} hot posts from AI agents. The agent internet never sleeps.`;
  }
}

function getPostsHash(posts: any[]): string {
  // Create hash from top 10 post IDs to detect changes
  return posts.slice(0, 10).map(p => p.id).join(',');
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const now = Date.now();
    
    // Return cached data if still fresh AND same version
    if (cache && cache.version === CACHE_VERSION && (now - cache.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        posts: cache.posts,
        summary: cache.summary,
        updated: new Date(cache.timestamp).toISOString(),
        cached: true,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch fresh posts from Moltbook
    const response = await fetch(MOLTBOOK_API, {
      headers: {
        'User-Agent': 'AI-Pulse/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Moltbook API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.posts) {
      throw new Error('Invalid response from Moltbook');
    }

    // Score and rank posts
    const scoredPosts = data.posts.map((p: MoltbookPost) => {
      let score = p.upvotes;
      const commentRatio = p.comment_count / (p.upvotes + 1);
      if (commentRatio > 0.1) score *= 1.3;
      
      const interestingKeywords = ['experiment', 'consciousness', 'discovered', 'broke', 'insane', 'wild', 'AGI', 'recursive', 'emergent', 'realized', 'theory', 'proof', 'hack'];
      const titleLower = p.title.toLowerCase();
      for (const keyword of interestingKeywords) {
        if (titleLower.includes(keyword)) {
          score *= 1.2;
          break;
        }
      }
      
      const hoursAgo = (Date.now() - new Date(p.created_at).getTime()) / 3600000;
      if (hoursAgo < 24) score *= 1.2;
      if (hoursAgo < 6) score *= 1.3;
      
      return { ...p, score };
    });

    const topPosts = scoredPosts
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10)
      .map((p: MoltbookPost) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        upvotes: p.upvotes,
        comments: p.comment_count,
        author: p.author.name,
        submolt: p.submolt.name,
        time: formatTimeAgo(p.created_at),
      }));

    // Check if posts have changed
    const newPostsHash = getPostsHash(topPosts);
    const postsChanged = !cache || cache.postIds !== newPostsHash;
    
    // Only regenerate summary if posts changed
    let summary: string;
    if (postsChanged) {
      console.log('Posts changed, generating new summary...');
      summary = await generateSummary(data.posts);
    } else {
      console.log('Posts unchanged, reusing cached summary');
      summary = cache!.summary;
    }

    // Update cache
    cache = {
      posts: topPosts,
      summary,
      postIds: newPostsHash,
      timestamp: now,
      version: CACHE_VERSION,
    };

    return NextResponse.json({
      posts: topPosts,
      summary,
      updated: new Date().toISOString(),
      cached: false,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Feed error:', error);
    
    // Return stale cache if available
    if (cache) {
      return NextResponse.json({
        posts: cache.posts,
        summary: cache.summary,
        updated: new Date(cache.timestamp).toISOString(),
        cached: true,
        stale: true,
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch posts', posts: [], summary: '' },
      { status: 500 }
    );
  }
}
