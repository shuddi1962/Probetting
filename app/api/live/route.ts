// app/api/live/route.ts — Live matches
import { NextResponse } from 'next/server';
import { getLiveFixtures } from '@/lib/api-football';

import { getSofascoreLive, getFlashscoreLive } from '@/lib/scrapers';

export async function GET() {
  const [apf, sof, flash] = await Promise.allSettled([
    getLiveFixtures(),
    getSofascoreLive(),
    getFlashscoreLive(),
  ]);
  
  let liveMatches: any[] = [];
  let source = 'none';

  if (apf.status === 'fulfilled' && apf.value.length > 0) {
    liveMatches = apf.value;
    source = 'api-football';
  } else if (sof.status === 'fulfilled' && sof.value.length > 0) {
    liveMatches = sof.value;
    source = 'sofascore';
  } else if (flash.status === 'fulfilled' && flash.value.length > 0) {
    liveMatches = flash.value;
    source = 'flashscore';
  }

  return NextResponse.json({
    apf: apf.status === 'fulfilled' ? apf.value : [],
    sofascore: sof.status === 'fulfilled' ? sof.value : [],
    flashscore: flash.status === 'fulfilled' ? flash.value : [],
    source,
    timestamp: new Date().toISOString(),
  });
}
