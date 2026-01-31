// Featured accounts to track
// Add handles here (without @)
export const FEATURED_ACCOUNTS = [
  'AlexFinn',
  'karpathy',      // Andrej Karpathy - AI legend
  'sama',          // Sam Altman - OpenAI CEO
  'swyx',          // swyx - AI engineer/builder
  'AnthropicAI',   // Anthropic
  'OpenAI',        // OpenAI
  'ylecun',        // Yann LeCun - Meta AI
  'emaboroddy',    // AI builders
  'mattshumer_',   // Matt Shumer - HyperWrite
  'TheAIGRID',     // AI news/updates
];

// FXTwitter API for public profile data
export async function fetchUserProfile(handle: string) {
  try {
    const res = await fetch(`https://api.fxtwitter.com/${handle}`, {
      headers: { 'User-Agent': 'AI-Pulse/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

// Try to get recent tweets via web scraping (backup method)
export async function fetchUserTweets(handle: string): Promise<Tweet[]> {
  // Try nitter.privacydev.net RSS (one of the more reliable instances)
  const nitterInstances = [
    'nitter.poast.org',
    'nitter.privacydev.net', 
    'nitter.net',
  ];
  
  for (const instance of nitterInstances) {
    try {
      const res = await fetch(`https://${instance}/${handle}/rss`, {
        headers: { 'User-Agent': 'AI-Pulse/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      
      if (res.ok) {
        const xml = await res.text();
        if (xml.includes('<item>')) {
          return parseNitterRSS(xml, handle);
        }
      }
    } catch {
      continue;
    }
  }
  
  return [];
}

interface Tweet {
  id: string;
  content: string;
  url: string;
  date: string;
}

function parseNitterRSS(xml: string, handle: string): Tweet[] {
  const tweets: Tweet[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null && tweets.length < 10) {
    const item = match[1];
    
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
    const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    
    if (titleMatch && linkMatch) {
      const content = titleMatch[1].trim();
      const nitterUrl = linkMatch[1].trim();
      // Convert nitter URL to X URL
      const tweetId = nitterUrl.split('/').pop()?.replace('#m', '') || '';
      
      tweets.push({
        id: tweetId,
        content: content.length > 280 ? content.slice(0, 277) + '...' : content,
        url: `https://x.com/${handle}/status/${tweetId}`,
        date: dateMatch ? dateMatch[1].trim() : '',
      });
    }
  }
  
  return tweets;
}

export interface FeaturedUser {
  handle: string;
  name: string;
  description: string;
  avatar: string;
  followers: number;
  verified: boolean;
  tweets: Tweet[];
  profileUrl: string;
}
