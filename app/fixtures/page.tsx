// app/fixtures/page.tsx — Fixtures with date picker
'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import Link from 'next/link';
import { mapSofascoreToAPF } from '@/lib/fallbacks';

interface Fixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { id: number; name: string; country: string; logo: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

const LEAGUES: Record<string, string> = {
  '39': 'Premier League', '140': 'La Liga', '78': 'Bundesliga',
  '135': 'Serie A', '61': 'Ligue 1', '2': 'Champions League',
  '3': 'Europa League', '88': 'Eredivisie', '94': 'Primeira Liga',
  '332': 'NPFL', '288': 'PSL', '1141': 'Ghana Premier League', '0': 'All Leagues',
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
}

export default function FixturesPage() {
  const [date, setDate] = useState('2024-04-26');
  const [league, setLeague] = useState('0');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/fixtures?date=${date}`)
      .then(r => r.json())
      .then(d => {
        let apfFixtures: Fixture[] = d.apf || [];
        if (apfFixtures.length === 0) {
          if (d.sof && d.sof.length > 0) apfFixtures = [...apfFixtures, ...d.sof.map(mapSofascoreToAPF)];
        }
        if (league !== '0') {
          apfFixtures = apfFixtures.filter(f => String(f.league.id) === league);
        }
        setFixtures(apfFixtures);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [date, league]);

  const grouped = fixtures.reduce<Record<string, Fixture[]>>((acc, f) => {
    const key = `${f.league.id}_${f.league.name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  return (
    <Shell>
      <div style={{ padding: '28px 32px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>🗓️ Fixtures</h1>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)',
              padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }} />
          <select value={league} onChange={e => setLeague(e.target.value)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)',
              padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            {Object.entries(LEAGUES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center' }}>
            {loading ? 'Loading…' : `${fixtures.length} matches`}
          </div>
        </div>

        {error && <div style={{ color: 'var(--accent-red)', marginBottom: 16, fontSize: 13 }}>⚠ {error}</div>}

        {fixtures.length === 0 && !loading && (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, marginBottom: 8 }}>No fixtures found</div>
            <div style={{ fontSize: 12 }}>API-Football free tier is limited to 100 req/day. Try a different date or league.</div>
          </div>
        )}

        {Object.entries(grouped).map(([key, leagueFixtures]) => {
          const sample = leagueFixtures[0];
          return (
            <div key={key} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sample.league.logo} alt="" width={22} height={22} style={{ objectFit: 'contain' }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{sample.league.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sample.league.country}</span>
                <span className="badge" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--accent-green)', marginLeft: 'auto' }}>
                  {leagueFixtures.length} matches
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                {leagueFixtures.map(fix => {
                  const isLive = ['1H', '2H', 'ET', 'P', 'HT'].includes(fix.fixture.status.short);
                  const isDone = ['FT', 'AET', 'PEN'].includes(fix.fixture.status.short);
                  return (
                    <Link key={fix.fixture.id} href={`/match/${fix.fixture.id}`} style={{ textDecoration: 'none' }}>
                      <div className="glass-card" style={{ padding: 14, cursor: 'pointer' }}>
                        <div style={{ fontSize: 11, color: isLive ? 'var(--accent-green)' : isDone ? 'var(--text-muted)' : 'var(--accent-amber)', fontWeight: 700, marginBottom: 8 }}>
                          {isLive ? `🔴 LIVE ${fix.fixture.status.elapsed}'` : isDone ? '✓ FT' : `⏰ ${formatTime(fix.fixture.date)}`}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={fix.teams.home.logo} alt="" width={18} height={18} style={{ objectFit: 'contain' }} />
                            <span style={{ fontSize: 13, fontWeight: fix.teams.home.winner ? 700 : 400, color: fix.teams.home.winner ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                              {fix.teams.home.name}
                            </span>
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 800, color: isLive ? 'var(--accent-green)' : 'var(--text-primary)', fontFamily: 'Outfit,sans-serif', minWidth: 50, textAlign: 'center' }}>
                            {fix.goals.home ?? '–'} : {fix.goals.away ?? '–'}
                          </span>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 13, fontWeight: fix.teams.away.winner ? 700 : 400, color: fix.teams.away.winner ? 'var(--accent-green)' : 'var(--text-primary)', textAlign: 'right' }}>
                              {fix.teams.away.name}
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={fix.teams.away.logo} alt="" width={18} height={18} style={{ objectFit: 'contain' }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
