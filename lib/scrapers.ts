// lib/scrapers.ts — Free web scrapers (Sofascore public API, FBref, Understat, etc.)
// These run server-side only and supplement the paid APIs

import { withCache } from './cache';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function politeGet(url: string, headers?: Record<string, string>): Promise<Response> {
  return fetch(url, {
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'application/json, text/html, */*',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Referer': 'https://www.google.com/',
      ...headers,
    },
    next: { revalidate: 0 },
  });
}

// ─── SOFASCORE PUBLIC API ─────────────────────────────────────────────────────
// Sofascore exposes a public JSON API — no official key needed

const SOFASCORE_BASE = 'https://api.sofascore.com/api/v1';
const SOFASCORE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

export interface SofascoreMatchSummary {
  tournament: { name: string; slug: string; category: { name: string } };
  homeTeam: { name: string; id: number; slug: string };
  awayTeam: { name: string; id: number; slug: string };
  homeScore: { current: number | null; period1: number | null; period2: number | null };
  awayScore: { current: number | null; period1: number | null; period2: number | null };
  status: { code: number; description: string; type: string };
  startTimestamp: number;
  id: number;
  slug: string;
}

export interface SofascoreStats {
  statistics: Array<{
    period: string;
    groups: Array<{
      groupName: string;
      statisticsItems: Array<{
        name: string;
        home: string;
        away: string;
        compareCode: number;
        statisticsType: string;
        valueType: string;
        homeValue: number;
        awayValue: number;
      }>;
    }>;
  }>;
}

export async function getSofascoreEventsByDate(date: string): Promise<SofascoreMatchSummary[]> {
  return withCache(`sof_events_${date}`, 300, async () => {
    try {
      const res = await politeGet(
        `${SOFASCORE_BASE}/sport/football/scheduled-events/${date}/inverse`,
        SOFASCORE_HEADERS
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.events || []) as SofascoreMatchSummary[];
    } catch {
      return [];
    }
  });
}

export async function getSofascoreLive(): Promise<SofascoreMatchSummary[]> {
  return withCache('sof_live', 30, async () => {
    try {
      const res = await politeGet(
        `${SOFASCORE_BASE}/sport/football/events/live`,
        SOFASCORE_HEADERS
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.events || []) as SofascoreMatchSummary[];
    } catch {
      return [];
    }
  });
}

export async function getSofascoreEvent(eventId: number): Promise<SofascoreMatchSummary | null> {
  return withCache(`sof_event_${eventId}`, 60, async () => {
    try {
      const res = await politeGet(`${SOFASCORE_BASE}/event/${eventId}`, SOFASCORE_HEADERS);
      if (!res.ok) return null;
      const json = await res.json();
      return (json.event || null) as SofascoreMatchSummary;
    } catch {
      return null;
    }
  });
}

export async function getSofascoreMatchStats(eventId: number): Promise<SofascoreStats | null> {
  return withCache(`sof_stats_${eventId}`, 60, async () => {
    try {
      const res = await politeGet(
        `${SOFASCORE_BASE}/event/${eventId}/statistics`,
        SOFASCORE_HEADERS
      );
      if (!res.ok) return null;
      return (await res.json()) as SofascoreStats;
    } catch {
      return null;
    }
  });
}

export interface SofascoreIncident {
  time: number;
  timeSeconds: number;
  addedTime: number | null;
  type: string;
  homeTeamGoal: boolean | null;
  awayTeamGoal: boolean | null;
  player: { name: string; id: number; slug: string } | null;
  assist1: { name: string; id: number } | null;
  playerIn: { name: string; id: number } | null;
  playerOut: { name: string; id: number } | null;
  incidentType: string;
  description: string | null;
  isLive: boolean | null;
  homeScore: number | null;
  awayScore: number | null;
}

export async function getSofascoreIncidents(eventId: number): Promise<SofascoreIncident[]> {
  return withCache(`sof_incidents_${eventId}`, 30, async () => {
    try {
      const res = await politeGet(
        `${SOFASCORE_BASE}/event/${eventId}/incidents`,
        SOFASCORE_HEADERS
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.incidents || []) as SofascoreIncident[];
    } catch {
      return [];
    }
  });
}

export interface SofascoreLineups {
  home: {
    players: Array<{ player: { name: string; id: number; position: string; jerseyNumber: string }; position: string; substitute: boolean }>;
    formation: string;
    playerColor: { primary: string; number: string; outline: string };
  };
  away: {
    players: Array<{ player: { name: string; id: number; position: string; jerseyNumber: string }; position: string; substitute: boolean }>;
    formation: string;
    playerColor: { primary: string; number: string; outline: string };
  };
  confirmed: boolean;
}

export async function getSofascoreLineups(eventId: number): Promise<SofascoreLineups | null> {
  return withCache(`sof_lineups_${eventId}`, 300, async () => {
    try {
      const res = await politeGet(
        `${SOFASCORE_BASE}/event/${eventId}/lineups`,
        SOFASCORE_HEADERS
      );
      if (!res.ok) return null;
      return (await res.json()) as SofascoreLineups;
    } catch {
      return null;
    }
  });
}

// ─── UNDERSTAT (xG Data) ──────────────────────────────────────────────────────

export interface UnderstatTeamData {
  teamName: string;
  xG: number;
  xGA: number;
  npxG: number;
  npxGA: number;
  ppda: { att: number; def: number };
  ppda_allowed: { att: number; def: number };
  deep: number;
  deep_allowed: number;
  scored: number;
  missed: number;
  xpts: number;
  wins: number;
  draws: number;
  loses: number;
  pts: number;
  npxGD: number;
}

export async function getUnderstatLeagueData(league: string, season: string): Promise<UnderstatTeamData[]> {
  const leagueMap: Record<string, string> = {
    epl: 'EPL', laLiga: 'La_liga', bundesliga: 'Bundesliga',
    serieA: 'Serie_A', ligue1: 'Ligue_1',
  };
  const leagueSlug = leagueMap[league] || league;
  return withCache(`understat_${league}_${season}`, 3600, async () => {
    try {
      const res = await politeGet(`https://understat.com/league/${leagueSlug}/${season}`);
      if (!res.ok) return [];
      const html = await res.text();
      // Extract JSON from script tag
      const match = html.match(/teamsData\s*=\s*JSON\.parse\('(.+?)'\)/);
      if (!match) return [];
      const raw = JSON.parse(match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
      return Object.values(raw) as UnderstatTeamData[];
    } catch {
      return [];
    }
  });
}

// ─── BBC SPORT NEWS SCRAPER ───────────────────────────────────────────────────

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string | null;
}

export async function getLatestFootballNews(): Promise<NewsItem[]> {
  return withCache('bbc_news', 1800, async () => {
    try {
      // Use BBC Sport RSS feed — public, no scraping needed
      const res = await politeGet('https://feeds.bbci.co.uk/sport/football/rss.xml');
      if (!res.ok) return [];
      const xml = await res.text();
      const items: NewsItem[] = [];
      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const m of itemMatches) {
        const item = m[1];
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || item.match(/<description>(.*?)<\/description>/)?.[1] || '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || null;
        if (title) {
          items.push({ title, summary: desc, url: link, source: 'BBC Sport', publishedAt: pubDate });
        }
        if (items.length >= 20) break;
      }
      return items;
    } catch {
      return [];
    }
  });
}

// ─── TRANSFERMARKT (Injury data via unofficial scrape) ────────────────────────

export interface InjuryItem {
  playerName: string;
  position: string;
  injuryType: string;
  since: string;
  until: string;
}

// Note: Transfermarkt requires a user-agent that mimics a real browser
// For production, use Playwright. Here we use httpx with rotation.
export async function getTeamInjuriesFromTransfermarkt(teamSlug: string, teamId: string): Promise<InjuryItem[]> {
  return withCache(`tm_injuries_${teamId}`, 3600, async () => {
    try {
      const url = `https://www.transfermarkt.com/${teamSlug}/aktuellverletzungen/verein/${teamId}`;
      const res = await politeGet(url, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      });
      if (!res.ok) return [];
      const html = await res.text();
      const injuries: InjuryItem[] = [];
      // Parse injury table rows
      const rows = html.matchAll(/<tr class="odd|even">([\s\S]*?)<\/tr>/g);
      for (const row of rows) {
        const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c =>
          c[1].replace(/<[^>]+>/g, '').trim()
        );
        if (cells.length >= 4) {
          injuries.push({
            playerName: cells[0] || '',
            position: cells[1] || '',
            injuryType: cells[2] || '',
            since: cells[3] || '',
            until: cells[4] || 'Unknown',
          });
        }
      }
      return injuries;
    } catch {
      return [];
    }
  });
}
