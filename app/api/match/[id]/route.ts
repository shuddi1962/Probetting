// app/api/match/[id]/route.ts — Full match detail + prediction
import { NextRequest, NextResponse } from 'next/server';
import { getFixtureById, getMatchStats, getMatchEvents, getMatchLineups, getFixturePrediction, getMatchPlayerStats, getH2H, getTeamStats, getFixtureOdds } from '@/lib/api-football';

import { getUpcomingSoccerOdds, findOddsMatch } from '@/lib/odds-api';
import { getSofascoreMatchStats, getSofascoreIncidents, getSofascoreLineups, getSofascoreEvent } from '@/lib/scrapers';
import { mapSMtoAPF, mapSofascoreToAPF } from '@/lib/fallbacks';
import { runPoissonModel, predictEventTotals, generateReasoning } from '@/lib/prediction';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixtureId = parseInt(id);

  const [
    fixture, stats, events, lineups, prediction,
    playerStats, odds, sofStats, sofIncidents, sofLineups,
  ] = await Promise.allSettled([
    getFixtureById(fixtureId),
    getMatchStats(fixtureId),
    getMatchEvents(fixtureId),
    getMatchLineups(fixtureId),
    getFixturePrediction(fixtureId),
    getMatchPlayerStats(fixtureId),
    getFixtureOdds(fixtureId),
    getSofascoreMatchStats(fixtureId),
    getSofascoreIncidents(fixtureId),
    getSofascoreLineups(fixtureId),
  ]);

  let fix = fixture.status === 'fulfilled' ? fixture.value : null;
  if (!fix) {
    try {
      const sof = await getSofascoreEvent(fixtureId);
      if (sof) fix = mapSofascoreToAPF(sof);
    } catch {}
  }


  // Build Poisson prediction if we have team stats
  let poissonResult = null;
  let reasoning = null;

  if (fix) {
    try {
      const [homeStatsRes, awayStatsRes, h2hRes] = await Promise.allSettled([
        getTeamStats(fix.teams.home.id, fix.league.id, fix.league.season),
        getTeamStats(fix.teams.away.id, fix.league.id, fix.league.season),
        getH2H(fix.teams.home.id, fix.teams.away.id),
      ]);

      const homeTeamStats = homeStatsRes.status === 'fulfilled' ? homeStatsRes.value : null;
      const awayTeamStats = awayStatsRes.status === 'fulfilled' ? awayStatsRes.value : null;
      const h2hData = h2hRes.status === 'fulfilled' ? h2hRes.value : [];

      const homeAvgScored = homeTeamStats ? parseFloat(homeTeamStats.goals?.for?.average?.total || '1.3') || 1.3 : 1.4;
      const homeAvgConceded = homeTeamStats ? parseFloat(homeTeamStats.goals?.against?.average?.total || '1.2') || 1.2 : 1.1;
      const awayAvgScored = awayTeamStats ? parseFloat(awayTeamStats.goals?.for?.average?.total || '1.1') || 1.1 : 1.2;
      const awayAvgConceded = awayTeamStats ? parseFloat(awayTeamStats.goals?.against?.average?.total || '1.4') || 1.4 : 1.3;

      const LEAGUE_AVGS: Record<number, number> = { 39: 2.70, 140: 2.65, 78: 3.05, 135: 2.80, 61: 2.75, 2: 2.85 };
      const leagueAvg = LEAGUE_AVGS[fix.league.id] || 2.75;

      poissonResult = runPoissonModel(
        { avgScored: homeAvgScored, avgConceded: homeAvgConceded },
        { avgScored: awayAvgScored, avgConceded: awayAvgConceded },
        leagueAvg
      );

      // H2H breakdown
      let h2hHome = 0, h2hDraw = 0, h2hAway = 0;
      for (const g of h2hData) {
        if (g.teams.home.winner === true) h2hHome++;
        else if (g.teams.away.winner === true) h2hAway++;
        else if (g.teams.home.winner === false && g.teams.away.winner === false) h2hDraw++;
      }

      reasoning = generateReasoning(
        fix.teams.home.name, fix.teams.away.name,
        poissonResult,
        homeAvgScored, awayAvgScored,
        homeAvgConceded, awayAvgConceded,
        h2hHome, h2hDraw, h2hAway, h2hData.length,
        null
      );
    } catch { /* prediction is optional */ }
  }

  const finalOdds = odds.status === 'fulfilled' ? odds.value : [];

  return NextResponse.json({
    fixture: fix,
    stats: stats.status === 'fulfilled' ? stats.value : [],
    events: events.status === 'fulfilled' ? events.value : [],
    lineups: lineups.status === 'fulfilled' ? lineups.value : [],
    apfPrediction: prediction.status === 'fulfilled' ? prediction.value : null,
    playerStats: playerStats.status === 'fulfilled' ? playerStats.value : [],
    apfOdds: finalOdds,
    sofascore: {
      stats: sofStats.status === 'fulfilled' ? sofStats.value : null,
      incidents: sofIncidents.status === 'fulfilled' ? sofIncidents.value : [],
      lineups: sofLineups.status === 'fulfilled' ? sofLineups.value : null,
    },
    poisson: poissonResult,
    reasoning,
  });
}
