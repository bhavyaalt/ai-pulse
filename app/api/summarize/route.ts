import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { articles } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate TLDR summary
    const prompt = `You are an AI news curator. Given these AI news headlines and summaries, create a brief, engaging TLDR (2-3 sentences) that captures the most important developments. Be concise but informative. Use a slightly casual, tech-savvy tone.

Articles:
${articles.map((a: { title: string; summary: string }) => `- ${a.title}: ${a.summary}`).join('\n')}

Generate a TLDR that someone would want to read to quickly understand what's happening in AI today:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tldr = response.text();

    return NextResponse.json({ tldr });
  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
