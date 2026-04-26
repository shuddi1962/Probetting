// app/match/[id]/page.tsx — Full match detail
import Shell from '@/components/Shell';
import { PredictionCard, StatCompare, ConfidenceBar, LiveBadge, ScoreBadge } from '@/components/ui';

interface Props { params: Promise<{ id: string }> }

function statVal(stats: { type: string; value: string | number | null }[], type: string) {
  const s = stats.find(x => x.type === type);
  return s?.value ?? '–';
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/match/${id}`, { cache: 'no-store' });
  const data = await res.json();
  const { fixture, stats, events, lineups, apfPrediction, smProbabilities, smValueBets, smOdds, commentaries, poisson, reasoning } = data;

  if (!fixture) {
    return <Shell><div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Match not found</div></Shell>;
  }

  const isLive = ['1H', '2H', 'ET', 'P', 'HT'].includes(fixture.fixture.status.short);
  const homeStats = (stats[0]?.statistics || []) as { type: string; value: string | number | null }[];
  const awayStats = (stats[1]?.statistics || []) as { type: string; value: string | number | null }[];
  const homeLineup = lineups[0];
  const awayLineup = lineups[1];

  const smProbs = smProbabilities?.predictions;
  const bestOdds = smOdds?.slice(0, 30) || [];

  return (
    <Shell>
      <div style={{ padding: '28px 32px', maxWidth: 1300 }}>
        {/* Match header */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            {fixture.league.name} · {fixture.league.country} · Round {fixture.league.round}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
            <div style={{ textAlign: 'right', flex: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fixture.teams.home.logo} alt="" width={56} height={56} style={{ objectFit: 'contain', marginBottom: 8 }} />
              <div style={{ fontSize: 18, fontWeight: 800 }}>{fixture.teams.home.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Home</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              {isLive && <LiveBadge minute={fixture.fixture.status.elapsed} />}
              <div style={{ margin: '8px 0' }}>
                <ScoreBadge home={fixture.goals.home} away={fixture.goals.away} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(fixture.fixture.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fixture.teams.away.logo} alt="" width={56} height={56} style={{ objectFit: 'contain', marginBottom: 8 }} />
              <div style={{ fontSize: 18, fontWeight: 800 }}>{fixture.teams.away.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Away</div>
            </div>
          </div>
          {fixture.fixture.venue?.name && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {fixture.fixture.venue.name}, {fixture.fixture.venue.city}</div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* LEFT column */}
          <div>
            {/* Poisson/AI Prediction */}
            {reasoning && poisson && (
              <PredictionCard
                homeTeam={fixture.teams.home.name}
                awayTeam={fixture.teams.away.name}
                homeWin={poisson.homeWinProb}
                draw={poisson.drawProb}
                awayWin={poisson.awayWinProb}
                pick={reasoning.pick}
                confidence={reasoning.confidence}
                reasons={reasoning.reasons}
                against={reasoning.against}
              />
            )}

            {/* API-Football Prediction */}
            {apfPrediction && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  API-Football Prediction
                </div>
                {apfPrediction.advice && (
                  <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: 'var(--accent-blue)', marginBottom: 12 }}>
                    💡 {apfPrediction.advice}
                  </div>
                )}
                <ConfidenceBar label={`${fixture.teams.home.name}`} value={parseInt(apfPrediction.percent?.home || '0') / 100} color="var(--accent-blue)" />
                <ConfidenceBar label="Draw" value={parseInt(apfPrediction.percent?.draw || '0') / 100} color="var(--draw-color)" />
                <ConfidenceBar label={`${fixture.teams.away.name}`} value={parseInt(apfPrediction.percent?.away || '0') / 100} color="var(--accent-amber)" />
                {apfPrediction.under_over && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                    Predicted goals trend: <strong>{apfPrediction.under_over}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Sportmonks probabilities */}
            {smProbs && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Sportmonks Model
                </div>
                <ConfidenceBar label={`${fixture.teams.home.name}`} value={parseFloat(smProbs.home_win_probability) / 100} color="var(--accent-blue)" />
                <ConfidenceBar label="Draw" value={parseFloat(smProbs.draw_probability) / 100} color="var(--draw-color)" />
                <ConfidenceBar label={`${fixture.teams.away.name}`} value={parseFloat(smProbs.away_win_probability) / 100} color="var(--accent-amber)" />
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
                  {smProbs.bt_ts && <span style={{ color: 'var(--text-muted)' }}>BTTS: <strong style={{ color: 'var(--text-primary)' }}>{smProbs.bt_ts}%</strong></span>}
                  {smProbs.over_2_5 && <span style={{ color: 'var(--text-muted)' }}>Over 2.5: <strong style={{ color: 'var(--text-primary)' }}>{smProbs.over_2_5}%</strong></span>}
                </div>
              </div>
            )}

            {/* Poisson Markets */}
            {poisson && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
                  📊 Market Predictions (Poisson)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Over 0.5', val: poisson.over05 },
                    { label: 'Over 1.5', val: poisson.over15 },
                    { label: 'Over 2.5', val: poisson.over25 },
                    { label: 'Over 3.5', val: poisson.over35 },
                    { label: 'Over 4.5', val: poisson.over45 },
                    { label: 'BTTS Yes', val: poisson.bttsProb },
                    { label: 'HT Home', val: poisson.htHomeWin },
                    { label: 'HT Draw', val: poisson.htDraw },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: val > 0.6 ? 'var(--accent-green)' : val > 0.4 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
                        {Math.round(val * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Top Correct Score Predictions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(poisson.correctScores as Record<string, number>)
                      .sort(([, a], [, b]) => b - a).slice(0, 8)
                      .map(([score, prob]) => (
                        <div key={score} style={{ padding: '4px 10px', background: 'var(--bg-surface)', borderRadius: 6, fontSize: 12 }}>
                          <span style={{ fontWeight: 700 }}>{score}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{Math.round((prob as number) * 100)}%</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  xG: {fixture.teams.home.name} <strong style={{ color: 'var(--text-primary)' }}>{poisson.homeLambda.toFixed(2)}</strong> · {fixture.teams.away.name} <strong style={{ color: 'var(--text-primary)' }}>{poisson.awayLambda.toFixed(2)}</strong> · Total <strong style={{ color: 'var(--text-primary)' }}>{poisson.expectedGoals.toFixed(2)}</strong>
                </div>
              </div>
            )}

            {/* Value Bets */}
            {smValueBets?.length > 0 && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  💰 Value Bets (Sportmonks)
                </div>
                {smValueBets.slice(0, 6).map((vb: { market_description: string; description: string; value: string; probability: string; bookmaker?: { name: string } }, i: number) => (
                  <div key={i} className="value-glow" style={{ padding: '10px 12px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{vb.market_description}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{vb.description}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent-green)' }}>{vb.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(parseFloat(vb.probability) * 100)}% prob</div>
                      </div>
                    </div>
                    {vb.bookmaker && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>📚 {vb.bookmaker.name}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT column */}
          <div>
            {/* Stats comparison */}
            {homeStats.length > 0 && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Match Statistics
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 14, fontWeight: 700 }}>
                  <span style={{ color: 'var(--accent-blue)' }}>{fixture.teams.home.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Stat</span>
                  <span style={{ color: 'var(--accent-amber)' }}>{fixture.teams.away.name}</span>
                </div>
                {['Ball Possession', 'Total Shots', 'Shots on Goal', 'Shots off Goal',
                  'Corner Kicks', 'Fouls', 'Yellow Cards', 'Red Cards', 'Offsides',
                  'Goalkeeper Saves', 'Total passes', 'Passes accurate'].map(stat => (
                  <StatCompare key={stat} label={stat}
                    homeVal={statVal(homeStats, stat)} awayVal={statVal(awayStats, stat)} />
                ))}
              </div>
            )}

            {/* Lineups */}
            {homeLineup && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Lineups
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[homeLineup, awayLineup].filter(Boolean).map((lineup, idx) => (
                    <div key={idx}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: idx === 0 ? 'var(--accent-blue)' : 'var(--accent-amber)', marginBottom: 6 }}>
                        {lineup.team.name} ({lineup.formation || '?'})
                      </div>
                      {lineup.startXI?.slice(0, 11).map((p: { player: { name: string; pos: string; number: number } }) => (
                        <div key={p.player.name} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
                          <span style={{ color: 'var(--text-muted)', minWidth: 20, fontWeight: 700 }}>{p.player.number}</span>
                          <span style={{ color: 'var(--text-primary)' }}>{p.player.name}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: 10 }}>{p.player.pos}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events timeline */}
            {events.length > 0 && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Match Events
                </div>
                {events.map((ev: { time: { elapsed: number; extra: number | null }; type: string; detail: string; team: { id: number; name: string }; player: { name: string | null }; assist: { name: string | null } }, i: number) => {
                  const isHome = ev.team.id === fixture.teams.home.id;
                  const icon = ev.type === 'Goal' ? '⚽' : ev.type === 'Card' ? (ev.detail.includes('Yellow') ? '🟨' : '🟥') : ev.type === 'subst' ? '🔄' : ev.type === 'Var' ? '📺' : '•';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12, justifyContent: isHome ? 'flex-start' : 'flex-end' }}>
                      {isHome && <span style={{ color: 'var(--text-muted)', minWidth: 30 }}>{ev.time.elapsed}&apos;{ev.time.extra ? `+${ev.time.extra}` : ''}</span>}
                      <span>{icon}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{ev.player?.name}</span>
                      {ev.assist?.name && <span style={{ color: 'var(--text-muted)' }}>({ev.assist.name})</span>}
                      {!isHome && <span style={{ color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>{ev.time.elapsed}&apos;{ev.time.extra ? `+${ev.time.extra}` : ''}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Odds */}
            {bestOdds.length > 0 && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Bookmaker Odds (Sportmonks)
                </div>
                {bestOdds.slice(0, 15).map((o: { market_description: string; label: string; value: string; bookmaker?: { name: string } }, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{o.market_description} · </span>
                      <span style={{ color: 'var(--text-primary)' }}>{o.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {o.bookmaker && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{o.bookmaker.name}</span>}
                      <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{o.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Commentaries */}
            {commentaries.length > 0 && (
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  🎙 Commentary (Sportmonks)
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {commentaries.slice(-20).reverse().map((c: { minute: number; comment: string; is_goal: boolean }, i: number) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ color: c.is_goal ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: c.is_goal ? 700 : 400, marginRight: 8 }}>{c.minute}&apos;</span>
                      <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.comment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FULL MARKETS SECTION */}
        {poisson && (
          <div className="glass-card" style={{ marginTop: 24, padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>⚡ Full Algorithmic Markets (250+)</h2>
              <span className="badge" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--accent-green)' }}>Poisson Powered</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              
              {/* Match Winner & Double Chance */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Main Markets</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: `Home Win (${fixture.teams.home.name})`, val: poisson.homeWinProb },
                    { label: 'Draw', val: poisson.drawProb },
                    { label: `Away Win (${fixture.teams.away.name})`, val: poisson.awayWinProb },
                    { label: 'Home or Draw (1X)', val: poisson.doubleChance['1X'] },
                    { label: 'Home or Away (12)', val: poisson.doubleChance['12'] },
                    { label: 'Draw or Away (X2)', val: poisson.doubleChance['X2'] },
                    { label: 'Draw No Bet (Home)', val: poisson.drawNoBet.home },
                    { label: 'Draw No Bet (Away)', val: poisson.drawNoBet.away },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>{m.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: m.val > 0.5 ? 'var(--accent-green)' : 'var(--text-primary)' }}>{(m.val * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Over / Under */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals Over/Under</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[0.5, 1.5, 2.5, 3.5, 4.5].map(line => (
                    <div key={line} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>Over {line}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: (poisson as any)[`over${line.toString().replace('.5', '5')}`] > 0.5 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                        {((poisson as any)[`over${line.toString().replace('.5', '5')}`] * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {[0.5, 1.5, 2.5, 3.5, 4.5].map(line => (
                    <div key={line} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>Under {line}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: (poisson as any)[`under${line.toString().replace('.5', '5')}`] > 0.5 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                        {((poisson as any)[`under${line.toString().replace('.5', '5')}`] * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asian Handicap */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asian Handicap (Home)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(poisson.asianHandicap).map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: (val as number) > 0.5 ? 'var(--accent-green)' : 'var(--text-primary)' }}>{((val as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Half Time / Full Time */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Half Time / Full Time</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(poisson.htft).map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: (val as number) > 0.15 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>{((val as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exact Goals & BTTS */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Other Markets</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                    <span style={{ fontSize: 13 }}>Both Teams To Score (Yes)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: poisson.bttsProb > 0.5 ? 'var(--accent-green)' : 'var(--text-primary)' }}>{(poisson.bttsProb * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>Both Teams To Score (No)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: (1 - poisson.bttsProb) > 0.5 ? 'var(--accent-green)' : 'var(--text-primary)' }}>{((1 - poisson.bttsProb) * 100).toFixed(1)}%</span>
                  </div>
                  {Object.entries(poisson.exactGoals).map(([goals, val]) => (
                    <div key={goals} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>Exact Goals: {goals}{goals === '6' ? '+' : ''}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{((val as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Score Matrix Overview */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top 10 Correct Scores</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(poisson.correctScores)
                    .sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 10)
                    .map(([score, prob]) => (
                      <div key={score} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{score}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{((prob as number) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
