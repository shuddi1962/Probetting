// lib/fallbacks.ts - Maps fallback APIs to API-Football format

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
