// lib/api-football.ts — API-Football v3 Client (RapidAPI)
// Key: cb70e3e14d1bd1bd9df314267e5e6eaa
// Base: https://v3.football.api-sports.io

import { getApfHeaders, config } from './config';
import { withCache } from './cache';

const BASE = config.apiFootball.base;
const TTL = config.cache;

async function apfGet<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  const res = await fetch(url.toString(), { headers: getApfHeaders(0) });
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
  }
  return json.response as T;
}

// ─── FIXTURES ─────────────────────────────────────────────────────────────────

export interface APFFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    venue: { id: number | null; name: string | null; city: string | null };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export async function getFixturesByDate(date: string): Promise<APFFixture[]> {
  return withCache(`apf_fixtures_date_${date}`, TTL.fixtures, () =>
    apfGet<APFFixture[]>('/fixtures', { date, timezone: 'Africa/Lagos', season: 2024 })
  );
}

export async function getFixturesByLeague(leagueId: number, season: number): Promise<APFFixture[]> {
  return withCache(`apf_fixtures_league_${leagueId}_${season}`, TTL.fixtures, () =>
    apfGet<APFFixture[]>('/fixtures', { league: leagueId, season, next: 20 })
  );
}

export async function getLiveFixtures(): Promise<APFFixture[]> {
  return withCache(`apf_live_fixtures`, TTL.live, () =>
    apfGet<APFFixture[]>('/fixtures', { live: 'all' })
  );
}

export async function getFixtureById(fixtureId: number): Promise<APFFixture | null> {
  return withCache(`apf_fixture_${fixtureId}`, TTL.live, async () => {
    const res = await apfGet<APFFixture[]>('/fixtures', { id: fixtureId });
    return res[0] || null;
  });
}

export async function getH2H(team1: number, team2: number): Promise<APFFixture[]> {
  return withCache(`apf_h2h_${team1}_${team2}`, TTL.stats, () =>
    apfGet<APFFixture[]>('/fixtures/headtohead', { h2h: `${team1}-${team2}`, last: 20 })
  );
}

// ─── STATISTICS ───────────────────────────────────────────────────────────────

export interface APFMatchStats {
  team: { id: number; name: string; logo: string };
  statistics: Array<{ type: string; value: string | number | null }>;
}

export async function getMatchStats(fixtureId: number): Promise<APFMatchStats[]> {
  return withCache(`apf_stats_${fixtureId}`, TTL.live, () =>
    apfGet<APFMatchStats[]>('/fixtures/statistics', { fixture: fixtureId })
  );
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export interface APFEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
  comments: string | null;
}

export async function getMatchEvents(fixtureId: number): Promise<APFEvent[]> {
  return withCache(`apf_events_${fixtureId}`, TTL.live, () =>
    apfGet<APFEvent[]>('/fixtures/events', { fixture: fixtureId })
  );
}

// ─── LINEUPS ──────────────────────────────────────────────────────────────────

export interface APFLineup {
  team: { id: number; name: string; logo: string; colors: unknown };
  coach: { id: number | null; name: string | null; photo: string | null };
  formation: string | null;
  startXI: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
  substitutes: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
}

export async function getMatchLineups(fixtureId: number): Promise<APFLineup[]> {
  return withCache(`apf_lineups_${fixtureId}`, TTL.fixtures, () =>
    apfGet<APFLineup[]>('/fixtures/lineups', { fixture: fixtureId })
  );
}

// ─── PLAYER MATCH STATS ───────────────────────────────────────────────────────

export interface APFPlayerStats {
  team: { id: number; name: string; logo: string; update: string };
  players: Array<{
    player: { id: number; name: string; photo: string };
    statistics: Array<{
      games: { minutes: number | null; number: number; position: string; rating: string | null; captain: boolean; substitute: boolean };
      offsides: number | null;
      shots: { total: number | null; on: number | null };
      goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
      passes: { total: number | null; key: number | null; accuracy: string | null };
      tackles: { total: number | null; blocks: number | null; interceptions: number | null };
      duels: { total: number | null; won: number | null };
      dribbles: { attempts: number | null; success: number | null; past: number | null };
      fouls: { drawn: number | null; committed: number | null };
      cards: { yellow: number; red: number };
      penalty: { won: number | null; committed: number | null; scored: number | null; missed: number | null; saved: number | null };
    }>;
  }>;
}

export async function getMatchPlayerStats(fixtureId: number): Promise<APFPlayerStats[]> {
  return withCache(`apf_player_stats_${fixtureId}`, TTL.stats, () =>
    apfGet<APFPlayerStats[]>('/fixtures/players', { fixture: fixtureId })
  );
}

// ─── PREDICTIONS ──────────────────────────────────────────────────────────────

export interface APFPrediction {
  winner: { id: number | null; comment: string; name: string | null } | null;
  win_or_draw: boolean | null;
  under_over: string | null;
  goals: { home: string | null; away: string | null };
  advice: string | null;
  percent: { home: string; draw: string; away: string };
  comparison: {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  };
}

export async function getFixturePrediction(fixtureId: number): Promise<APFPrediction | null> {
  return withCache(`apf_prediction_${fixtureId}`, TTL.predictions, async () => {
    const res = await apfGet<APFPrediction[]>('/predictions', { fixture: fixtureId });
    return res[0] || null;
  });
}

// ─── INJURIES ─────────────────────────────────────────────────────────────────

export interface APFInjury {
  player: { id: number; name: string; type: string; reason: string; photo: string };
  team: { id: number; name: string; logo: string };
  fixture: { id: number; timezone: string; date: string; timestamp: number };
  league: { id: number; season: number; name: string; country: string; logo: string; flag: string | null };
}

export async function getTeamInjuries(teamId: number, season: number): Promise<APFInjury[]> {
  return withCache(`apf_injuries_${teamId}_${season}`, TTL.stats, () =>
    apfGet<APFInjury[]>('/injuries', { team: teamId, season })
  );
}

// ─── STANDINGS ────────────────────────────────────────────────────────────────

export interface APFStandingEntry {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  home: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  away: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  update: string;
}

export interface APFStandings {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    standings: APFStandingEntry[][];
  };
}

export async function getStandings(leagueId: number, season: number): Promise<APFStandings[]> {
  return withCache(`apf_standings_${leagueId}_${season}`, TTL.standings, () =>
    apfGet<APFStandings[]>('/standings', { league: leagueId, season })
  );
}

// ─── TEAM STATISTICS ──────────────────────────────────────────────────────────

export interface APFTeamStats {
  league: { id: number; name: string; country: string; logo: string; flag: string | null; season: number };
  team: { id: number; name: string; logo: string };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { minute: Record<string, { total: number | null; percentage: string | null }>; average: { home: string; away: string; total: string }; total: { home: number; away: number; total: number } };
    against: { minute: Record<string, { total: number | null; percentage: string | null }>; average: { home: string; away: string; total: string }; total: { home: number; away: number; total: number } };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
  penalty: { scored: { total: number; percentage: string }; missed: { total: number; percentage: string }; total: number };
  lineups: Array<{ formation: string; played: number }>;
  cards: {
    yellow: Record<string, { total: number | null; percentage: string | null }>;
    red: Record<string, { total: number | null; percentage: string | null }>;
  };
}

export async function getTeamStats(teamId: number, leagueId: number, season: number): Promise<APFTeamStats | null> {
  return withCache(`apf_team_stats_${teamId}_${leagueId}_${season}`, TTL.stats, async () => {
    const res = await apfGet<APFTeamStats[]>('/teams/statistics', { team: teamId, league: leagueId, season });
    return Array.isArray(res) ? res[0] : res || null;
  });
}

// ─── TOPSCORERS ───────────────────────────────────────────────────────────────

export interface APFTopscorer {
  player: { id: number; name: string; firstname: string; lastname: string; age: number; birth: { date: string; place: string; country: string }; nationality: string; height: string; weight: string; injured: boolean; photo: string };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string; logo: string; flag: string | null; season: number };
    games: { appearences: number; lineups: number; minutes: number; number: number | null; position: string; rating: string | null; captain: boolean };
    goals: { total: number; conceded: number; assists: number | null; saves: number | null };
    shots: { total: number | null; on: number | null };
    cards: { yellow: number; yellowred: number; red: number };
  }>;
}

export async function getTopscorers(leagueId: number, season: number): Promise<APFTopscorer[]> {
  return withCache(`apf_topscorers_${leagueId}_${season}`, TTL.standings, () =>
    apfGet<APFTopscorer[]>('/players/topscorers', { league: leagueId, season })
  );
}

// ─── ODDS ─────────────────────────────────────────────────────────────────────

export interface APFOdds {
  league: { id: number; name: string; country: string; logo: string; flag: string | null; season: number };
  fixture: { id: number; timezone: string; date: string; timestamp: number };
  update: string;
  bookmakers: Array<{
    id: number;
    name: string;
    bets: Array<{
      id: number;
      name: string;
      values: Array<{ value: string; odd: string }>;
    }>;
  }>;
}

export async function getFixtureOdds(fixtureId: number): Promise<APFOdds[]> {
  return withCache(`apf_odds_${fixtureId}`, TTL.fixtures, () =>
    apfGet<APFOdds[]>('/odds', { fixture: fixtureId })
  );
}

// ─── PLAYERS ──────────────────────────────────────────────────────────────────

export interface APFPlayer {
  player: { id: number; name: string; firstname: string; lastname: string; age: number; birth: { date: string; place: string | null; country: string }; nationality: string; height: string | null; weight: string | null; injured: boolean; photo: string };
  statistics: APFTopscorer['statistics'];
}

export async function getPlayer(playerId: number, season: number): Promise<APFPlayer | null> {
  return withCache(`apf_player_${playerId}_${season}`, TTL.stats, async () => {
    const res = await apfGet<APFPlayer[]>('/players', { id: playerId, season });
    return res[0] || null;
  });
}
