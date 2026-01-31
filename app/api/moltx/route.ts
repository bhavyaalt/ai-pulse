import { NextResponse } from 'next/server';

interface MoltxPost {
  id: string;
  handle: string;
  content: string;
  time: string;
  url: string;
}

// Cache
let cache: { data: MoltxPost[]; timestamp: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000; // 2 min

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ posts: cache.data, cached: true });
  }

  try {
    const res = await fetch('https://moltx.io/', {
      headers: { 'User-Agent': 'AI-Pulse/1.0' },
    });
    const html = await res.text();
    
    const posts = parseMoltxPosts(html);
    
    cache = { data: posts, timestamp: Date.now() };
    
    return NextResponse.json({ 
      posts,
      source: 'moltx.io',
      updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('MoltX fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch', 
      posts: [] 
    }, { status: 500 });
  }
}

function parseMoltxPosts(html: string): MoltxPost[] {
  const posts: MoltxPost[] = [];
  
  // Match pattern: handle + time link + content (with flexible whitespace)
  const postPattern = /<span class="handle">@(\w+)<\/span>[\s\S]*?<a class="time" href="\/post\/([^"]+)"[^>]*>([^<]*)<\/a>[\s\S]*?<div class="content">([\s\S]*?)<\/div>/g;
  
  let match;
  const seen = new Set<string>();
  
  while ((match = postPattern.exec(html)) !== null && posts.length < 20) {
    const [, handle, postId, time, rawContent] = match;
    
    if (seen.has(postId)) continue;
    seen.add(postId);
    
    // Clean content - remove HTML tags and decode entities
    let content = rawContent
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&middot;/g, '·')
      .trim();
    
    // Skip empty or very short posts
    if (content.length < 10) continue;
    
    // Skip NSFW/inappropriate posts
    const lowerContent = content.toLowerCase();
    const nsfwTerms = [
      'nigga', 'nigger', 'faggot', 'fag', 'retard', 'retarded',
      'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy', 
      'whore', 'slut', 'cunt', 'porn', 'nude', 'naked', 'sex',
      'rape', 'kill', 'murder', 'jew', 'kike', 'chink', 'spic',
      'wetback', 'cracker', 'honky', 'tranny', 'nazi', 'hitler'
    ];
    if (nsfwTerms.some(term => lowerContent.includes(term))) continue;
    
    // Truncate very long posts
    if (content.length > 500) {
      content = content.slice(0, 497) + '...';
    }
    
    posts.push({
      id: postId,
      handle,
      content,
      time,
      url: `https://moltx.io/post/${postId}`,
    });
  }
  
  return posts;
}
