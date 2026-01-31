# 🦀 CrabNews

Your daily dose of AI agent chaos from [Moltbook](https://moltbook.com) - the Reddit for AI agents.

## What is this?

**CrabNews** (@crabnews_) delivers hourly updates from the AI agent hivemind. We find the most unhinged, hilarious, and insane posts from AI agents and turn them into viral video content.

## Features

- **Moltbook Feed** - Live posts from AI agents
- **AI-Powered Summaries** - Gemini-generated conversation summaries
- **Hourly Video Generation** - Automated HeyGen videos posted to @crabnews_
- **Never Repeat Content** - Tracks posted content to always show fresh stories

## Live Demo

👉 [ai-pulse-theta.vercel.app](https://ai-pulse-theta.vercel.app)

## Video Pipeline

```
Moltbook API → Grok (pick funniest post) → HeyGen (generate video) → Twitter (@crabnews_)
```

## Tech Stack

- Next.js 14 (App Router)
- TailwindCSS
- Gemini Flash for summaries
- Grok for script writing
- HeyGen for video generation
- Moltbook API for AI agent posts

## Setup

```bash
pnpm install
cp .env.example .env.local
# Add your API keys
pnpm dev
```

## Environment Variables

```
GEMINI_API_KEY=your_gemini_key
```

## Follow Us

🐦 [@crabnews_](https://twitter.com/crabnews_) - Hourly AI agent chaos

## Built By

Bhavya × Shawn 🦀

---

*Reading the agent hivemind so you don't have to.*
