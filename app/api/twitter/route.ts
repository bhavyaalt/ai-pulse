import { NextResponse } from 'next/server';

interface Tweet {
  id: string;
  author: string;
  handle: string;
  content: string;
  url: string;
  category?: string;
}

// Cache
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Fetch latest issue from news.smol.ai
    const homeRes = await fetch('https://news.smol.ai/', {
      headers: { 'User-Agent': 'AI-Pulse/1.0' },
    });
    const homeHtml = await homeRes.text();
    
    // Extract latest issue URL
    const issueMatch = homeHtml.match(/href="(\/issues\/[^"]+)"/);
    if (!issueMatch) throw new Error('No issue found');
    
    const issueUrl = `https://news.smol.ai${issueMatch[1]}`;
    
    // Fetch the issue
    const issueRes = await fetch(issueUrl, {
      headers: { 'User-Agent': 'AI-Pulse/1.0' },
    });
    const issueHtml = await issueRes.text();
    
    // Extract tweets with URLs
    const tweets = extractTweets(issueHtml);
    const title = extractTitle(issueHtml);
    
    const data = {
      source: 'news.smol.ai',
      issueUrl,
      title,
      tweets,
      updated: new Date().toISOString(),
    };
    
    cache = { data, timestamp: Date.now() };
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Twitter fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch', 
      tweets: [] 
    }, { status: 500 });
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title>([^|<]+)/);
  return match ? match[1].trim() : 'AI Twitter Recap';
}

function extractTweets(html: string): Tweet[] {
  const tweets: Tweet[] = [];
  
  // Pattern to match tweet references: [@handle](https://twitter.com/handle/status/ID)
  const tweetPattern = /\[@(\w+)\]\((https:\/\/twitter\.com\/\w+\/status\/\d+)\)/g;
  
  // Get the text content for context
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  
  // Find all tweet mentions
  const seen = new Set<string>();
  let match;
  
  while ((match = tweetPattern.exec(html)) !== null) {
    const handle = match[1];
    const url = match[2];
    const tweetId = url.split('/status/')[1];
    
    if (seen.has(tweetId)) continue;
    seen.add(tweetId);
    
    // Find context around this tweet mention
    const context = findTweetContext(textContent, handle);
    
    if (context && tweets.length < 15) {
      tweets.push({
        id: tweetId,
        author: getAuthorName(handle),
        handle: `@${handle}`,
        content: context,
        url: url.replace('twitter.com', 'x.com'), // Use x.com
      });
    }
  }
  
  return tweets;
}

function findTweetContext(text: string, handle: string): string | null {
  // Find sentences containing this handle
  const handleIndex = text.indexOf(`@${handle}`);
  if (handleIndex === -1) return null;
  
  // Get surrounding text (200 chars before and after)
  const start = Math.max(0, handleIndex - 150);
  const end = Math.min(text.length, handleIndex + 200);
  let context = text.slice(start, end);
  
  // Clean up - find sentence boundaries
  const sentenceStart = context.lastIndexOf('. ', 50);
  if (sentenceStart > 0) {
    context = context.slice(sentenceStart + 2);
  }
  
  const sentenceEnd = context.indexOf('. ', 100);
  if (sentenceEnd > 50) {
    context = context.slice(0, sentenceEnd + 1);
  }
  
  // Remove the handle reference itself
  context = context.replace(/@\w+/g, '').trim();
  
  // Clean up artifacts
  context = context
    .replace(/\[|\]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[^a-zA-Z"]+/, '')
    .trim();
  
  if (context.length < 30) return null;
  
  return context;
}

function getAuthorName(handle: string): string {
  const names: Record<string, string> = {
    'karpathy': 'Andrej Karpathy',
    'AnthropicAI': 'Anthropic',
    'OpenAI': 'OpenAI',
    'sama': 'Sam Altman',
    'ylecun': 'Yann LeCun',
    'mattshumer_': 'Matt Shumer',
    'swyx': 'swyx',
    'aakashgupta': 'Aakash Gupta',
    'Yuchenj_UW': 'Yuchen Jin',
    'omarsar0': 'Omar Sanseviero',
    'jerryjliu0': 'Jerry Liu',
    'moltbook': 'Moltbook',
    'perplexity_ai': 'Perplexity',
    'Kimi_Moonshot': 'Kimi AI',
    'cognition': 'Cognition',
    'windsurf': 'Windsurf',
    'runwayml': 'Runway',
    '_philschmid': 'Philipp Schmid',
    'takex5g': 'takex5g',
  };
  
  return names[handle] || handle;
}
