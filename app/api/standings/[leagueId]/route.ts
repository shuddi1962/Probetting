// app/api/standings/[leagueId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStandings, getTopscorers } from '@/lib/api-football';

const CURRENT_SEASON = 2024;

export async function GET(req: NextRequest, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const [standings, topscorers] = await Promise.allSettled([
    getStandings(parseInt(leagueId), CURRENT_SEASON),
    getTopscorers(parseInt(leagueId), CURRENT_SEASON),
  ]);
  return NextResponse.json({
    standings: standings.status === 'fulfilled' ? standings.value : [],
    topscorers: topscorers.status === 'fulfilled' ? topscorers.value : [],
  });
}
