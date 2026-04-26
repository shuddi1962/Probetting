// app/live/page.tsx — Live matches hub
'use client';
import { useState, useEffect, useCallback } from 'react';
import Shell from '@/components/Shell';
import Link from 'next/link';
import { LiveBadge } from '@/components/ui';

interface APFFixture {
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

import { mapSofascoreToAPF } from '@/lib/fallbacks';

export default function LivePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/api/live')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  let apfLive = (data as any).fixtures || [];
  if (apfLive.length === 0) {
    const apf = data?.apf || [];
    const sof = (data?.sofascore || []).map(mapSofascoreToAPF);
    const flash = (data?.flashscore || []).map((f: any) => ({
      fixture: { id: parseInt(f.id), status: { short: f.status.type === 'inprogress' ? '1H' : f.status.type === 'finished' ? 'FT' : 'NS', elapsed: f.status.type === 'inprogress' ? Math.floor((Date.now()/1000 - f.startTimestamp)/60) : null }, date: new Date(f.startTimestamp * 1000).toISOString() },
      league: { id: 0, name: f.league.name, country: f.league.country, logo: '' },
      teams: { home: { id: 0, name: f.homeTeam, logo: '', winner: false }, away: { id: 0, name: f.awayTeam, logo: '', winner: false } },
      goals: { home: f.homeScore ?? null, away: f.awayScore ?? null }
    }));
    apfLive = [...apf, ...sof, ...flash];
  }

  return (
    <Shell>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>🔴 Live Matches</h1>
          <LiveBadge />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Auto-refreshes every 30s</span>
          <button onClick={refresh} style={{ marginLeft: 'auto', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent-green)', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
            🔄 Refresh
          </button>
        </div>

        {loading && (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading live matches…
          </div>
        )}

        {!loading && apfLive.length === 0 && (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>😴</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No live matches right now</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Check back during match times. Data from API-Football + Sportmonks.</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {apfLive.map((fix: APFFixture) => (
            <Link key={fix.fixture.id} href={`/match/${fix.fixture.id}`} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: 20, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fix.league.logo} alt="" width={16} height={16} style={{ objectFit: 'contain' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fix.league.name}</span>
                  </div>
                  <LiveBadge minute={fix.fixture.status.elapsed} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fix.teams.home.logo} alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{fix.teams.home.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fix.teams.away.logo} alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{fix.teams.away.name}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 32, color: 'var(--accent-green)' }}>
                    {fix.goals.home ?? 0}<span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>-</span>{fix.goals.away ?? 0}
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>
                  Click for live stats, in-play odds & prediction →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
