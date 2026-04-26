// app/standings/page.tsx
import Shell from '@/components/Shell';
import { getStandings, getTopscorers, type APFStandingEntry, type APFTopscorer } from '@/lib/api-football';
import { FormBadge } from '@/components/ui';

const LEAGUES = [
  { id: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga', flag: '🇪🇸' },
  { id: 78, name: 'Bundesliga', flag: '🇩🇪' },
  { id: 135, name: 'Serie A', flag: '🇮🇹' },
  { id: 61, name: 'Ligue 1', flag: '🇫🇷' },
  { id: 2, name: 'Champions League', flag: '🏆' },
];

const SEASON = 2024;

export default async function StandingsPage() {
  const results = await Promise.allSettled(
    LEAGUES.map(l => getStandings(l.id, SEASON))
  );
  const topscorersRes = await Promise.allSettled(
    LEAGUES.slice(0, 3).map(l => getTopscorers(l.id, SEASON))
  );

  return (
    <Shell>
      <div style={{ padding: '28px 32px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28 }}>🏆 League Standings</h1>

        {LEAGUES.map((league, idx) => {
          const res = results[idx];
          if (res.status === 'rejected') return null;
          const standing = res.value[0]?.league?.standings?.[0] || [];
          if (standing.length === 0) return null;

          return (
            <div key={league.id} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                {league.flag} {league.name} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>{SEASON}/{SEASON + 1}</span>
              </h2>
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)' }}>
                      <th style={{ width: 30 }}>#</th>
                      <th>Team</th>
                      <th style={{ textAlign: 'center' }}>P</th>
                      <th style={{ textAlign: 'center' }}>W</th>
                      <th style={{ textAlign: 'center' }}>D</th>
                      <th style={{ textAlign: 'center' }}>L</th>
                      <th style={{ textAlign: 'center' }}>GF</th>
                      <th style={{ textAlign: 'center' }}>GA</th>
                      <th style={{ textAlign: 'center' }}>GD</th>
                      <th style={{ textAlign: 'center' }}>Pts</th>
                      <th>Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(standing as APFStandingEntry[]).map((row) => (
                      <tr key={row.team.id}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{row.rank}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={row.team.logo} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
                            <span style={{ fontWeight: 600 }}>{row.team.name}</span>
                            {row.description && (
                              <span className="badge" style={{ fontSize: 9, padding: '1px 5px', background: row.description?.includes('Champions') ? 'rgba(0,255,136,0.1)' : row.description?.includes('Relegation') ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: row.description?.includes('Champions') ? 'var(--accent-green)' : row.description?.includes('Relegation') ? 'var(--accent-red)' : 'var(--accent-blue)' }}>
                                {row.description?.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{row.all.played}</td>
                        <td style={{ textAlign: 'center', color: 'var(--win-color)', fontWeight: 600 }}>{row.all.win}</td>
                        <td style={{ textAlign: 'center', color: 'var(--draw-color)' }}>{row.all.draw}</td>
                        <td style={{ textAlign: 'center', color: 'var(--loss-color)' }}>{row.all.lose}</td>
                        <td style={{ textAlign: 'center' }}>{row.all.goals.for}</td>
                        <td style={{ textAlign: 'center' }}>{row.all.goals.against}</td>
                        <td style={{ textAlign: 'center', color: row.goalsDiff > 0 ? 'var(--accent-green)' : row.goalsDiff < 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                          {row.goalsDiff > 0 ? '+' : ''}{row.goalsDiff}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit,sans-serif', fontSize: 15 }}>{row.points}</td>
                        <td><FormBadge form={row.form || ''} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top scorers for first 3 leagues */}
              {idx < 3 && topscorersRes[idx]?.status === 'fulfilled' && (topscorersRes[idx] as PromiseFulfilledResult<APFTopscorer[]>).value.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>⚡ Top Scorers</h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {(topscorersRes[idx] as PromiseFulfilledResult<APFTopscorer[]>).value.slice(0, 5).map((ts) => (
                      <div key={ts.player.id} className="glass-card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ts.player.photo} alt="" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{ts.player.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ts.statistics[0]?.team.name}</div>
                        </div>
                        <div style={{ marginLeft: 8, fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--accent-green)' }}>
                          {ts.statistics[0]?.goals.total || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
