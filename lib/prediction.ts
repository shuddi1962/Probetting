// lib/prediction.ts — Poisson model + market generator (all real data)

export interface TeamGoalStats {
  avgScored: number;
  avgConceded: number;
  homeAvgScored?: number;
  homeAvgConceded?: number;
  awayAvgScored?: number;
  awayAvgConceded?: number;
}

// League average goals per game (used to normalise attack/defence strength)
const LEAGUE_AVG: Record<number, number> = {
  39: 2.70, 140: 2.65, 78: 3.05, 135: 2.80, 61: 2.75,
  2: 2.85, 3: 2.70, 88: 3.10, 94: 2.60, 71: 2.90,
};

function poisson(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 1; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

function buildScoreMatrix(homeLambda: number, awayLambda: number, maxGoals = 7) {
  const matrix: number[][] = [];
  for (let h = 0; h <= maxGoals; h++) {
    matrix[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      matrix[h][a] = poisson(homeLambda, h) * poisson(awayLambda, a);
    }
  }
  return matrix;
}

export interface PoissonPrediction {
  homeLambda: number;
  awayLambda: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  bttsProb: number;
  over05: number; over15: number; over25: number; over35: number; over45: number;
  under05: number; under15: number; under25: number; under35: number; under45: number;
  expectedGoals: number;
  correctScores: Record<string, number>;
  htHomeWin: number; htDraw: number; htAwayWin: number;
  doubleChance: { '1X': number; '12': number; 'X2': number };
  drawNoBet: { home: number; away: number };
  asianHandicap: Record<string, number>;
  exactGoals: Record<number, number>;
  htft: Record<string, number>;
  scoreMatrix: number[][];
}

export function runPoissonModel(
  homeStats: TeamGoalStats,
  awayStats: TeamGoalStats,
  leagueAvg: number,
  isHome = true
): PoissonPrediction {
  const leagueAvgGoals = leagueAvg || 2.75;
  const homeAttack = homeStats.avgScored / leagueAvgGoals;
  const homeDefence = homeStats.avgConceded / leagueAvgGoals;
  const awayAttack = awayStats.avgScored / leagueAvgGoals;
  const awayDefence = awayStats.avgConceded / leagueAvgGoals;
  const homeAdvantage = isHome ? 1.10 : 1.0;

  const homeLambda = Math.max(0.1, homeAttack * awayDefence * leagueAvgGoals * homeAdvantage);
  const awayLambda = Math.max(0.1, awayAttack * homeDefence * leagueAvgGoals);

  const matrix = buildScoreMatrix(homeLambda, awayLambda);
  let homeWin = 0, draw = 0, awayWin = 0;
  let over05 = 0, over15 = 0, over25 = 0, over35 = 0, over45 = 0;
  let btts = 0;
  const correctScores: Record<string, number> = {};

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const p = matrix[h][a];
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
      const total = h + a;
      if (total > 0.5) over05 += p;
      if (total > 1.5) over15 += p;
      if (total > 2.5) over25 += p;
      if (total > 3.5) over35 += p;
      if (total > 4.5) over45 += p;
      if (h > 0 && a > 0) btts += p;
      if (h <= 5 && a <= 5) correctScores[`${h}-${a}`] = (correctScores[`${h}-${a}`] || 0) + p;
    }
  }

  // HT estimates (approx 45 min = half the lambda)
  const htMatrix = buildScoreMatrix(homeLambda * 0.46, awayLambda * 0.46);
  let htHome = 0, htDraw = 0, htAway = 0;
  for (let h = 0; h < htMatrix.length; h++) {
    for (let a = 0; a < htMatrix[h].length; a++) {
      const p = htMatrix[h][a];
      if (h > a) htHome += p;
      else if (h === a) htDraw += p;
      else htAway += p;
    }
  }

  // Extra Markets
  const doubleChance = {
    '1X': homeWin + draw,
    '12': homeWin + awayWin,
    'X2': draw + awayWin
  };
  const drawNoBet = {
    home: homeWin / (homeWin + awayWin),
    away: awayWin / (homeWin + awayWin)
  };
  
  // Asian Handicap
  const ah: Record<string, number> = {};
  for (let handicap of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) {
    let homeCover = 0;
    for (let h = 0; h < matrix.length; h++) {
      for (let a = 0; a < matrix[h].length; a++) {
        if (h + handicap > a) homeCover += matrix[h][a];
      }
    }
    ah[`H ${handicap > 0 ? '+' : ''}${handicap}`] = homeCover;
  }

  // Exact Goals
  const exactGoals: Record<number, number> = {};
  for (let k = 0; k <= 6; k++) {
    exactGoals[k] = poisson(homeLambda + awayLambda, k);
  }

  // HT/FT approximate using independent half assumption
  const htft: Record<string, number> = {};
  const hts = ['1', 'X', '2'];
  const htProbs = [htHome, htDraw, htAway];
  
  // Second half probs
  const shMatrix = buildScoreMatrix(homeLambda * 0.54, awayLambda * 0.54);
  let shHome = 0, shDraw = 0, shAway = 0;
  for (let h = 0; h < shMatrix.length; h++) {
    for (let a = 0; a < shMatrix[h].length; a++) {
      if (h > a) shHome += shMatrix[h][a];
      else if (h === a) shDraw += shMatrix[h][a];
      else shAway += shMatrix[h][a];
    }
  }
  const shProbs = [shHome, shDraw, shAway];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      // Simplified independent probability for HT/FT
      htft[`${hts[i]}/${hts[j]}`] = htProbs[i] * shProbs[j];
    }
  }

  return {
    homeLambda, awayLambda,
    homeWinProb: homeWin, drawProb: draw, awayWinProb: awayWin,
    bttsProb: btts,
    over05, over15, over25, over35, over45,
    under05: 1 - over05, under15: 1 - over15, under25: 1 - over25,
    under35: 1 - over35, under45: 1 - over45,
    expectedGoals: homeLambda + awayLambda,
    correctScores,
    htHomeWin: htHome, htDraw: htDraw, htAwayWin: htAway,
    doubleChance, drawNoBet, asianHandicap: ah, exactGoals, htft,
    scoreMatrix: matrix,
  };
}

// ─── CORNER / CARD / SHOT PREDICTIONS ─────────────────────────────────────────

export interface EventPrediction {
  expectedTotal: number;
  over: Record<number, number>;  // e.g. { 8: 0.62, 9: 0.44, 10: 0.28 }
  under: Record<number, number>;
  homeProb: number; awayProb: number;
}

export function predictEventTotals(
  homeAvg: number, awayAvg: number,
  thresholds: number[]
): EventPrediction {
  const homeLambda = Math.max(0.1, homeAvg);
  const awayLambda = Math.max(0.1, awayAvg);
  const totalLambda = homeLambda + awayLambda;
  const over: Record<number, number> = {};
  const under: Record<number, number> = {};
  for (const t of thresholds) {
    let cumBelow = 0;
    for (let k = 0; k <= t; k++) cumBelow += poisson(totalLambda, k);
    over[t] = Math.max(0, Math.min(1, 1 - cumBelow));
    under[t] = Math.max(0, Math.min(1, cumBelow));
  }
  return { expectedTotal: totalLambda, over, under, homeProb: homeLambda / totalLambda, awayProb: awayLambda / totalLambda };
}

// ─── VALUE BET DETECTOR ───────────────────────────────────────────────────────

export interface ValueBet {
  market: string;
  selection: string;
  modelProb: number;
  impliedProb: number;
  edge: number;
  ev: number;
  bestOdds: number;
  isValue: boolean;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export function detectValueBets(
  modelProbs: Record<string, number>,
  bookOdds: Record<string, number>,
  minEdge = 0.05
): ValueBet[] {
  const valueBets: ValueBet[] = [];
  for (const [market, bestOdds] of Object.entries(bookOdds)) {
    const impliedProb = 1 / bestOdds;
    const modelProb = modelProbs[market];
    if (!modelProb || bestOdds < 1.2 || bestOdds > 15) continue;
    const edge = (modelProb - impliedProb) / impliedProb;
    const ev = modelProb * (bestOdds - 1) - (1 - modelProb);
    valueBets.push({
      market, selection: market, modelProb, impliedProb,
      edge, ev, bestOdds,
      isValue: edge >= minEdge && ev > 0,
      confidence: edge >= 0.15 ? 'high' : edge >= 0.08 ? 'medium' : 'low',
      reasoning: `Model: ${(modelProb * 100).toFixed(1)}% vs market implied ${(impliedProb * 100).toFixed(1)}%. Edge: ${(edge * 100).toFixed(1)}%`,
    });
  }
  return valueBets.filter(v => v.isValue).sort((a, b) => b.edge - a.edge);
}

// ─── PREDICTION REASONING ─────────────────────────────────────────────────────

export function generateReasoning(
  homeTeam: string, awayTeam: string,
  pred: PoissonPrediction,
  homeAvgGoals: number, awayAvgGoals: number,
  homeAvgConceded: number, awayAvgConceded: number,
  h2hHomeWins: number, h2hDraws: number, h2hAwayWins: number, h2hGames: number,
  smProbabilities?: { home: string; draw: string; away: string } | null
): { pick: string; confidence: number; reasons: string[]; against: string[] } {
  const reasons: string[] = [];
  const against: string[] = [];
  let pick = '';
  let confidence = 0;

  const hw = pred.homeWinProb, d = pred.drawProb, aw = pred.awayWinProb;
  if (hw > d && hw > aw) { pick = `${homeTeam} Win`; confidence = hw; }
  else if (aw > d && aw > hw) { pick = `${awayTeam} Win`; confidence = aw; }
  else { pick = 'Draw'; confidence = d; }

  // Add reasons
  reasons.push(`Poisson model gives ${homeTeam} ${(hw * 100).toFixed(0)}% / Draw ${(d * 100).toFixed(0)}% / ${awayTeam} ${(aw * 100).toFixed(0)}%`);
  reasons.push(`Expected goals: ${homeTeam} ${pred.homeLambda.toFixed(2)} | ${awayTeam} ${pred.awayLambda.toFixed(2)}`);
  reasons.push(`${homeTeam} season avg: ${homeAvgGoals.toFixed(2)} scored, ${homeAvgConceded.toFixed(2)} conceded per game`);
  reasons.push(`${awayTeam} season avg: ${awayAvgGoals.toFixed(2)} scored, ${awayAvgConceded.toFixed(2)} conceded per game`);
  if (h2hGames > 0) {
    reasons.push(`H2H last ${h2hGames} games: ${homeTeam} ${h2hHomeWins}W / ${h2hDraws}D / ${awayTeam} ${h2hAwayWins}W`);
  }
  if (smProbabilities) {
    reasons.push(`Sportmonks model: Home ${smProbabilities.home} / Draw ${smProbabilities.draw} / Away ${smProbabilities.away}`);
  }
  reasons.push(`Over 2.5 probability: ${(pred.over25 * 100).toFixed(0)}% | BTTS: ${(pred.bttsProb * 100).toFixed(0)}%`);

  // Against reasons
  if (pick.includes(homeTeam)) {
    against.push(`${awayTeam} Win unlikely (${(aw * 100).toFixed(0)}%) — model shows away attack rating lower vs home defence`);
  } else if (pick.includes(awayTeam)) {
    against.push(`${homeTeam} Win unlikely (${(hw * 100).toFixed(0)}%) — home attack rating insufficient vs away defence`);
  }

  return { pick, confidence, reasons, against };
}
