// app/api/live/route.ts — Live matches
import { NextResponse } from 'next/server';
import { getLiveFixtures } from '@/lib/api-football';

import { getSofascoreLive } from '@/lib/scrapers';

export async function GET() {
  const [apf, sof] = await Promise.allSettled([
    getLiveFixtures(),
    getSofascoreLive(),
  ]);
  return NextResponse.json({
    apf: apf.status === 'fulfilled' ? apf.value : [],
    sofascore: sof.status === 'fulfilled' ? sof.value : [],
    timestamp: new Date().toISOString(),
  });
}
