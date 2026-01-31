import { NextResponse } from 'next/server';
import { FEATURED_ACCOUNTS, fetchUserProfile, fetchUserTweets, FeaturedUser } from '@/lib/featured-accounts';

// Cache
let cache: { data: FeaturedUser[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ users: cache.data, cached: true });
  }

  try {
    const users: FeaturedUser[] = [];
    
    // Fetch all featured accounts in parallel
    const results = await Promise.all(
      FEATURED_ACCOUNTS.map(async (handle) => {
        const [profile, tweets] = await Promise.all([
          fetchUserProfile(handle),
          fetchUserTweets(handle),
        ]);
        
        if (!profile) return null;
        
        return {
          handle: profile.screen_name || handle,
          name: profile.name || handle,
          description: profile.description || '',
          avatar: profile.avatar_url?.replace('_normal', '_200x200') || '',
          followers: profile.followers || 0,
          verified: profile.verification?.verified || false,
          tweets,
          profileUrl: `https://x.com/${profile.screen_name || handle}`,
        } as FeaturedUser;
      })
    );
    
    for (const user of results) {
      if (user) users.push(user);
    }
    
    cache = { data: users, timestamp: Date.now() };
    
    return NextResponse.json({ 
      users, 
      updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Featured fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch', 
      users: [] 
    }, { status: 500 });
  }
}
