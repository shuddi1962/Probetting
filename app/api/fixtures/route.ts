// app/api/fixtures/route.ts — Fixtures by date
import { NextRequest, NextResponse } from 'next/server';
import { getFixturesByDate as apfFixtures } from '@/lib/api-football';

import { getSofascoreEventsByDate, getFlashscoreEventsByDate } from '@/lib/scrapers';
import { mapFlashscoreToAPF, mapSofascoreToAPF } from '@/lib/fallbacks';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
  try {
    const [apf, sof, flash] = await Promise.allSettled([
      apfFixtures(date),
      getSofascoreEventsByDate(date),
      getFlashscoreEventsByDate(date)
    ]);

    let source = 'none';
    let fixtures: any[] = [];

    if (apf.status === 'fulfilled' && apf.value.length > 0) {
      fixtures = apf.value;
      source = 'api-football';
    } else if (sof.status === 'fulfilled' && sof.value.length > 0) {
      fixtures = sof.value.map(mapSofascoreToAPF);
      source = 'sofascore';
    } else if (flash.status === 'fulfilled' && flash.value.length > 0) {
      fixtures = flash.value.map(mapFlashscoreToAPF);
      source = 'flashscore';
    }

    return NextResponse.json({
      date,
      apf: apf.status === 'fulfilled' ? apf.value : [],
      sof: sof.status === 'fulfilled' ? sof.value : [],
      flash: flash.status === 'fulfilled' ? flash.value : [],
      apfError: apf.status === 'rejected' ? String(apf.reason) : null,
      sofError: sof.status === 'rejected' ? String(sof.reason) : null,
      flashError: flash.status === 'rejected' ? String(flash.reason) : null,
      source,
      fixtures, // normalized fixtures for easy frontend use
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
