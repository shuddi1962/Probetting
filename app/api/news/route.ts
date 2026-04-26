// app/api/news/route.ts
import { NextResponse } from 'next/server';
import { getLatestFootballNews } from '@/lib/scrapers';

export async function GET() {
  const bbcNews = await getLatestFootballNews();
  return NextResponse.json({
    bbc: bbcNews,
  });
}
