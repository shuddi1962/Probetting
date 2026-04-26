// app/api/health/route.ts — Source health check
import { NextResponse } from 'next/server';
import { config, getApfHeaders } from '@/lib/config';

export async function GET() {
  const checks = await Promise.allSettled([
    fetch(`${config.apiFootball.base}/status`, { headers: getApfHeaders() }),
    fetch('https://api.sofascore.com/api/v1/sport/football/events/live', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    fetch('https://feeds.bbci.co.uk/sport/football/rss.xml'),
  ]);

  const [apf, sof, bbc] = checks;
  return NextResponse.json({
    'api-football': { ok: apf.status === 'fulfilled' && apf.value.ok, status: apf.status === 'fulfilled' ? apf.value.status : 'error' },
    'sofascore': { ok: sof.status === 'fulfilled' && sof.value.ok, status: sof.status === 'fulfilled' ? sof.value.status : 'error' },
    'bbc-sport': { ok: bbc.status === 'fulfilled' && bbc.value.ok, status: bbc.status === 'fulfilled' ? bbc.value.status : 'error' },
    checked_at: new Date().toISOString(),
  });
}
