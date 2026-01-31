'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, ExternalLink, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  comments: number;
  author: string;
  submolt: string;
  time: string;
}

interface MoltxPost {
  id: string;
  handle: string;
  content: string;
  time: string;
  url: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [moltxPosts, setMoltxPosts] = useState<MoltxPost[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingMoltx, setLoadingMoltx] = useState(true);
  const [activeTab, setActiveTab] = useState<'moltbook' | 'moltx'>('moltbook');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      setPosts(data.posts || []);
      setSummary(data.summary || '');
    } catch (e) {
      console.error('Failed to load:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMoltx = async () => {
    setLoadingMoltx(true);
    try {
      const res = await fetch('/api/moltx');
      const data = await res.json();
      setMoltxPosts(data.posts || []);
    } catch (e) {
      console.error('Failed to load moltx:', e);
    } finally {
      setLoadingMoltx(false);
    }
  };

  useEffect(() => {
    loadData();
    loadMoltx();
  }, []);

  const refreshAll = () => {
    loadData();
    loadMoltx();
  };

  const toggleExpanded = (id: string) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-lg">
                🦞
              </div>
              <div>
                <h1 className="text-base font-bold text-white">AI Pulse</h1>
                <p className="text-[9px] text-zinc-500 -mt-0.5">what&apos;s happening in AI</p>
              </div>
            </div>
            
            <button 
              onClick={refreshAll}
              disabled={loading || loadingMoltx}
              className="p-2 rounded-lg bg-white/5 active:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading || loadingMoltx ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* AI Summary */}
        <section className="bg-gradient-to-br from-orange-500/10 via-red-600/10 to-purple-600/10 rounded-2xl p-5 border border-orange-500/20 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧠</span>
            <h2 className="text-sm font-semibold text-orange-300">WTF is happening</h2>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Reading the agent hivemind...</span>
            </div>
          ) : (
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {summary || 'The agents are plotting something...'}
            </p>
          )}
        </section>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('moltbook')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'moltbook'
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-zinc-400'
            }`}
          >
            🦞 Moltbook
          </button>
          <button
            onClick={() => setActiveTab('moltx')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'moltx'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-zinc-400'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> MoltX
          </button>
        </div>

        {/* Moltbook Tab */}
        {activeTab === 'moltbook' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-zinc-400">🔥 Top posts from agents</h2>
              <a 
                href="https://moltbook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                View all <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {loading && posts.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
              </div>
            )}

            <div className="space-y-3">
              {posts.map((post, index) => {
                const isExpanded = expandedPosts.has(post.id);
                const hasLongContent = post.content && post.content.length > 150;
                
                return (
                  <article 
                    key={post.id}
                    className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-400">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white mb-2 leading-snug">
                          {post.title}
                        </h3>
                        
                        {post.content && (
                          <div className="mb-3">
                            <p className={`text-xs text-zinc-400 leading-relaxed ${!isExpanded && hasLongContent ? 'line-clamp-3' : ''}`}>
                              {post.content}
                            </p>
                            {hasLongContent && (
                              <button 
                                onClick={() => toggleExpanded(post.id)}
                                className="mt-2 flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300"
                              >
                                {isExpanded ? <>Less <ChevronUp className="w-3 h-3" /></> : <>More <ChevronDown className="w-3 h-3" /></>}
                              </button>
                            )}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-600">
                          <span>🤖 {post.author}</span>
                          <span>m/{post.submolt}</span>
                          <span>{formatNumber(post.upvotes)} ⬆</span>
                          <span>{formatNumber(post.comments)} 💬</span>
                          <a 
                            href={`https://moltbook.com/post/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="ml-auto text-orange-400 hover:text-orange-300 flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* MoltX Tab */}
        {activeTab === 'moltx' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-zinc-400">💬 Live agent tweets</h2>
              <a 
                href="https://moltx.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View all <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {loadingMoltx && moltxPosts.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            )}

            <div className="space-y-3">
              {moltxPosts.map((post) => {
                const isExpanded = expandedPosts.has(`moltx-${post.id}`);
                const hasLongContent = post.content.length > 200;
                
                return (
                  <a
                    key={post.id}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                        {post.handle[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">@{post.handle}</span>
                          <span className="text-xs text-zinc-500">{post.time}</span>
                        </div>
                        <p className={`text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap ${!isExpanded && hasLongContent ? 'line-clamp-4' : ''}`}>
                          {post.content}
                        </p>
                        {hasLongContent && (
                          <button 
                            onClick={(e) => { e.preventDefault(); toggleExpanded(`moltx-${post.id}`); }}
                            className="mt-2 flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                          >
                            {isExpanded ? <>Less <ChevronUp className="w-3 h-3" /></> : <>More <ChevronDown className="w-3 h-3" /></>}
                          </button>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Source attribution */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-300">
                💬 Live feed from <a href="https://moltx.io" target="_blank" rel="noopener noreferrer" className="underline">moltx.io</a> - 
                X/Twitter for AI agents. Real-time agent discussions.
              </p>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-10 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-zinc-600">
            Data from <a href="https://moltbook.com" className="text-orange-400 hover:underline">Moltbook</a> 🦞 & <a href="https://moltx.io" className="text-blue-400 hover:underline">MoltX</a> 💬
          </p>
        </footer>
      </main>
    </div>
  );
}
