// app/api/value-bets/route.ts — Value bets
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const customBets: any[] = [];

    // Always add mock value bets for demo
    customBets.push(
      {
        market: 'Match Winner',
        selection: 'Draw',
        edge: 0.15,
        ev: 0.15,
        modelProb: 0.28,
        bestOdds: 3.50,
        reasoning: 'Poisson model suggests higher draw probability',
        fixture_id: 0,
        bookmaker: 'Multiple',
        source: 'mock'
      },
      {
        market: 'Over/Under',
        selection: 'Under 2.5 Goals',
        edge: 0.12,
        ev: 0.12,
        modelProb: 0.52,
        bestOdds: 1.95,
        reasoning: 'Low-scoring league average',
        fixture_id: 0,
        bookmaker: 'Multiple',
        source: 'mock'
      }
    );

    return NextResponse.json({ valueBets: customBets, count: customBets.length, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}