// lib/config.ts — Central configuration

export const config = {
  apiFootball: {
    keys: [process.env.API_FOOTBALL_KEY!, process.env.API_FOOTBALL_KEY2!].filter(Boolean),
    base: process.env.API_FOOTBALL_BASE || 'https://v3.football.api-sports.io',
  },
  sportmonks: {
    token: process.env.SPORTMONKS_TOKEN || '',
    base: process.env.SPORTMONKS_BASE || 'https://api.sportmonks.com/v3/football',
  },
  oddsApi: {
    key: process.env.ODDS_API_KEY || 'e1cf00ef1c47f63632527e4e7ed48365',
    base: 'https://api.the-odds-api.com/v4',
  },
  cache: {
    fixtures: parseInt(process.env.CACHE_TTL_FIXTURES || '300'),
    live: parseInt(process.env.CACHE_TTL_LIVE || '30'),
    stats: parseInt(process.env.CACHE_TTL_STATS || '600'),
    predictions: parseInt(process.env.CACHE_TTL_PREDICTIONS || '3600'),
    standings: parseInt(process.env.CACHE_TTL_STANDINGS || '3600'),
  },
  // Leagues tracked (API-Football league IDs)
  leagues: {
    epl: 39,
    laLiga: 140,
    bundesliga: 78,
    serieA: 135,
    ligue1: 61,
    championsLeague: 2,
    europaLeague: 3,
    conferenceLeague: 848,
    eredivisie: 88,
    primeiraLiga: 94,
    brasileirao: 71,
    argentinaLiga: 128,
    afcon: 6,
    worldCup: 1,
    npfl: 332,       // Nigeria Premier League
    psl: 288,        // South African PSL
    ghanaLeague: 1141,
  },
  // Sportmonks league IDs mapping
  sportmonksLeagues: {
    epl: 8,
    laLiga: 564,
    bundesliga: 82,
    serieA: 384,
    ligue1: 301,
    championsLeague: 2,
    europaLeague: 5,
  },
};

// API-Football headers function
export const getApfHeaders = (keyIndex: number = 0) => ({
  'x-rapidapi-key': config.apiFootball.keys[keyIndex] || config.apiFootball.keys[0],
  'x-rapidapi-host': 'v3.football.api-sports.io',
});
