// lib/odds-api.ts — The Odds API v4 Client
import { config } from './config';
import { withCache } from './cache';

const BASE = config.oddsApi.base;
const KEY = config.oddsApi.key;

export interface OddsMatch {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
}

// Fetch upcoming soccer matches with odds (best effort cross-league)
export async function getUpcomingSoccerOdds(): Promise<OddsMatch[]> {
  return withCache('odds_api_upcoming', 300, async () => {
    // We use upcoming to get immediate next games cross-sports, then filter to soccer
    const url = `${BASE}/sports/upcoming/odds/?apiKey=${KEY}&regions=uk,eu&markets=h2h`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Odds API error: ${res.status}`);
    const data: OddsMatch[] = await res.json();
    return data.filter(m => m.sport_key.startsWith('soccer_'));
  });
}

// Fetch odds for a specific league (e.g. soccer_epl)
export async function getLeagueOdds(sportKey: string): Promise<OddsMatch[]> {
  return withCache(`odds_api_${sportKey}`, 300, async () => {
    const url = `${BASE}/sports/${sportKey}/odds/?apiKey=${KEY}&regions=uk,eu&markets=h2h`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Odds API error: ${res.status}`);
    return res.json();
  });
}

// Match an API-Football or Sportmonks fixture name to an Odds API match
export function findOddsMatch(homeTeam: string, awayTeam: string, oddsMatches: OddsMatch[]): OddsMatch | null {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const h1 = normalize(homeTeam);
  const a1 = normalize(awayTeam);

  for (const m of oddsMatches) {
    const h2 = normalize(m.home_team);
    const a2 = normalize(m.away_team);
    
    // Exact or substring match (e.g. "Man Utd" vs "Manchester United")
    if ((h2.includes(h1) || h1.includes(h2)) && (a2.includes(a1) || a1.includes(a2))) {
      return m;
    }
  }
  return null;
}
