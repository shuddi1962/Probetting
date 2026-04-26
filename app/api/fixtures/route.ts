// app/api/fixtures/route.ts — Fixtures by date
import { NextRequest, NextResponse } from 'next/server';
import { getFixturesByDate as apfFixtures } from '@/lib/api-football';

import { getSofascoreEventsByDate } from '@/lib/scrapers';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
  try {
    const [apf, sof] = await Promise.allSettled([apfFixtures(date), getSofascoreEventsByDate(date)]);
    return NextResponse.json({
      date,
      apf: apf.status === 'fulfilled' ? apf.value : [],
      sof: sof.status === 'fulfilled' ? sof.value : [],
      apfError: apf.status === 'rejected' ? String(apf.reason) : null,
      sofError: sof.status === 'rejected' ? String(sof.reason) : null,
      source: apf.status === 'fulfilled' && apf.value.length > 0 ? 'api-football' : 'sofascore',
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
