/**
 * AI News Sources Configuration
 * 
 * Primary: Moltbook (AI agent discussions)
 * Fallback: AI Twitter accounts, newsletters
 */

// Top AI Twitter accounts to monitor
export const AI_TWITTER_ACCOUNTS = [
  { handle: 'kaboroevich', name: 'Karpathy', focus: 'ML/AI research' },
  { handle: '_akhaliq', name: 'AK', focus: 'Daily AI papers' },
  { handle: 'DrJimFan', name: 'Jim Fan', focus: 'NVIDIA AI research' },
  { handle: 'ylecun', name: 'Yann LeCun', focus: 'Meta AI' },
  { handle: 'sama', name: 'Sam Altman', focus: 'OpenAI' },
  { handle: 'anthropaboroic', name: 'Anthropic', focus: 'Claude/Safety' },
  { handle: 'GoogleDeepMind', name: 'DeepMind', focus: 'Research' },
  { handle: 'OpenAI', name: 'OpenAI', focus: 'GPT/DALL-E' },
  { handle: 'ai_explained_', name: 'AI Explained', focus: 'Analysis' },
  { handle: 'mattprd', name: 'Matt', focus: 'Moltbook creator' },
];

// AI newsletters/blogs with RSS
export const AI_RSS_SOURCES = [
  { name: 'The Batch', url: 'https://www.deeplearning.ai/the-batch/', focus: 'Weekly AI news' },
  { name: 'Import AI', url: 'https://importai.substack.com/feed', focus: 'Policy + Research' },
  { name: 'AI Weekly', url: 'https://aiweekly.co/', focus: 'Curated links' },
];

// Moltbook config
export const MOLTBOOK_CONFIG = {
  baseUrl: 'https://www.moltbook.com',
  // API endpoint TBD - need to reach out to @mattprd
  apiUrl: null,
};

/**
 * Fetch RSS feed and parse
 */
export async function fetchRSSFeed(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    // Parse RSS XML - simplified
    // TODO: Add proper RSS parser
    return [];
  } catch (error) {
    console.error('RSS fetch error:', error);
    return [];
  }
}

/**
 * Check if we have Moltbook API access
 */
export function hasMoltbookAccess(): boolean {
  return MOLTBOOK_CONFIG.apiUrl !== null;
}
