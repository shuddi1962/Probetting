// lib/fallbacks.ts - Maps fallback APIs to API-Football format

export interface FlashscoreMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: { code: number; description: string; type: string };
  startTimestamp: number;
  league: { id: string; name: string; country: string };
}

export function mapFlashscoreToAPF(fs: FlashscoreMatch) {
  let short = 'NS';
  let elapsed: number | null = null;

  if (fs.status.type === 'finished') {
    short = 'FT';
  } else if (fs.status.type === 'inprogress') {
    short = '1H';
    elapsed = Math.floor((Date.now() / 1000 - fs.startTimestamp) / 60);
    if (elapsed > 45) {
      short = '2H';
      elapsed = elapsed - 45;
    }
    if (fs.status.description?.includes('Half')) {
      short = 'HT';
      elapsed = 45;
    }
  } else if (fs.status.type === 'canceled') {
    short = 'CANC';
  }

  const homeWin = fs.homeScore !== null && fs.awayScore !== null && fs.homeScore > fs.awayScore;
  const awayWin = fs.homeScore !== null && fs.awayScore !== null && fs.awayScore > fs.homeScore;

  return {
    fixture: {
      id: parseInt(fs.id),
      referee: null,
      timezone: 'UTC',
      date: new Date(fs.startTimestamp * 1000).toISOString(),
      timestamp: fs.startTimestamp,
      venue: { id: null, name: null, city: null },
      status: { long: fs.status.description || 'Not Started', short, elapsed }
    },
    league: {
      id: parseInt(fs.league.id) || 0,
      name: fs.league.name || 'League',
      country: fs.league.country || 'World',
      logo: '',
      flag: null,
      season: new Date().getFullYear(),
      round: 'Round 1'
    },
    teams: {
      home: { id: 0, name: fs.homeTeam, logo: '', winner: homeWin },
      away: { id: 0, name: fs.awayTeam, logo: '', winner: awayWin }
    },
    goals: { home: fs.homeScore ?? null, away: fs.awayScore ?? null },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: fs.homeScore ?? null, away: fs.awayScore ?? null },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null }
    }
  };
}

export function mapSMtoAPF(sm: any) {
  const home = sm.participants?.find((p: any) => p.meta?.location === 'home') || sm.participants?.[0] || {};
  const away = sm.participants?.find((p: any) => p.meta?.location === 'away') || sm.participants?.[1] || {};
  const homeScore = sm.scores?.find((s: any) => s.participant_id === home.id && s.description === 'CURRENT')?.score?.goals;
  const awayScore = sm.scores?.find((s: any) => s.participant_id === away.id && s.description === 'CURRENT')?.score?.goals;
  
  let date = sm.starting_at ? sm.starting_at.replace(' ', 'T') + 'Z' : new Date().toISOString();
  if (sm.starting_at_timestamp) {
    date = new Date(sm.starting_at_timestamp * 1000).toISOString();
  }

  return {
    fixture: {
      id: sm.id,
      referee: null,
      timezone: 'UTC',
      date,
      timestamp: sm.starting_at_timestamp || Math.floor(new Date(date).getTime() / 1000),
      venue: { id: null, name: null, city: null },
      status: {
        long: sm.state?.name || 'Not Started',
        short: sm.state?.short_name || 'NS',
        elapsed: sm.state?.short_name === '1H' ? 25 : sm.state?.short_name === '2H' ? 70 : null
      }
    },
    league: {
      id: sm.league?.id || 0,
      name: sm.league?.name || 'League',
      country: 'World',
      logo: sm.league?.image_path || '',
      flag: null,
      season: new Date().getFullYear(),
      round: 'Round 1'
    },
    teams: {
      home: { id: home.id || 0, name: home.name || 'Home', logo: home.image_path || '', winner: null },
      away: { id: away.id || 0, name: away.name || 'Away', logo: away.image_path || '', winner: null }
    },
    goals: { home: homeScore ?? null, away: awayScore ?? null },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: homeScore ?? null, away: awayScore ?? null },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null }
    }
  };
}

export function mapSofascoreToAPF(sof: any) {
  let short = 'NS';
  let elapsed = null;
  if (sof.status.type === 'inprogress') {
    short = sof.status.description === 'Halftime' ? 'HT' : sof.status.description.includes('2nd') ? '2H' : '1H';
    elapsed = short === '1H' ? 25 : short === '2H' ? 70 : null;
  } else if (sof.status.type === 'finished') {
    short = 'FT';
  } else if (sof.status.type === 'canceled') {
    short = 'CANC';
  }

  return {
    fixture: {
      id: sof.id,
      referee: null,
      timezone: 'UTC',
      date: new Date(sof.startTimestamp * 1000).toISOString(),
      timestamp: sof.startTimestamp,
      venue: { id: null, name: sof.venue?.name || null, city: sof.venue?.city?.name || null },
      status: { long: sof.status.description || 'Not Started', short, elapsed }
    },
    league: {
      id: sof.tournament?.uniqueTournament?.id || 0,
      name: sof.tournament?.name || 'League',
      country: sof.tournament?.category?.name || 'World',
      logo: '', // Sofascore logos are complex to get from summary
      flag: null,
      season: new Date().getFullYear(),
      round: sof.roundInfo?.round || 'Round 1'
    },
    teams: {
      home: { id: sof.homeTeam?.id || 0, name: sof.homeTeam?.name || 'Home', logo: '', winner: null },
      away: { id: sof.awayTeam?.id || 0, name: sof.awayTeam?.name || 'Away', logo: '', winner: null }
    },
    goals: { home: sof.homeScore?.current ?? null, away: sof.awayScore?.current ?? null },
    score: {
      halftime: { home: sof.homeScore?.period1 ?? null, away: sof.awayScore?.period1 ?? null },
      fulltime: { home: sof.homeScore?.current ?? null, away: sof.awayScore?.current ?? null },
      extratime: { home: sof.homeScore?.period2 ?? null, away: sof.awayScore?.period2 ?? null },
      penalty: { home: null, away: null }
    }
  };
}
