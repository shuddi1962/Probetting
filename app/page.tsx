// app/page.tsx — Dashboard
import Shell from '@/components/Shell';
import Link from 'next/link';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
}

interface ValueBet {
  market: string;
  selection: string;
  edge: number;
  ev: number;
  modelProb: number;
  bestOdds: number;
  reasoning: string;
  fixture_id: number;
  bookmaker: string;
  source: string;
}

export default async function Dashboard() {
  // Static demo data
  const fixtures = [];
  const live = [];
  const valueBets = [
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
    }
  ];
  const allNews = [
    { title: 'Welcome to Pro Betting Dashboard', publishedAt: new Date().toISOString() }
  ];

  const todayFixtures = fixtures.slice(0, 12);
  const topValueBets = valueBets.slice(0, 6);

  return (
    <Shell>
      <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            <span className="gradient-text">Football Intelligence</span> Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Real data from API-Football + Odds API + Free scrapers
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Matches Today', value: todayFixtures.length, color: 'var(--accent-green)', icon: '⚽' },
            { label: 'Live Now', value: live.length, color: '#ef4444', icon: '🔴' },
            { label: 'Value Bets', value: topValueBets.length, color: 'var(--accent-amber)', icon: '💰' },
            { label: 'News Items', value: allNews.length, color: 'var(--accent-blue)', icon: '📰' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: 'Outfit,sans-serif' }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          {/* Today's Fixtures */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>Today&apos;s Fixtures</h2>
              <Link href="/fixtures" style={{ fontSize: 12, color: 'var(--accent-green)', textDecoration: 'none' }}>View all →</Link>
            </div>
            {todayFixtures.length === 0 && (
              <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                No fixtures found for today (API quota may be exhausted — try tomorrow or check /health)
              </div>
            )}
            {todayFixtures.map((fix) => {
              const isLive = ['1H', '2H', 'ET', 'P', 'HT'].includes(fix.fixture.status.short);
              return (
                <Link key={fix.fixture.id} href={`/match/${fix.fixture.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass-card" style={{ padding: 14, marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {fix.league.name} · {fix.league.country}
                      </span>
                      {isLive ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-green)', fontSize: 11, fontWeight: 700 }}>
                          <span className="live-dot" /> {fix.fixture.status.elapsed}&apos;
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {fix.fixture.status.short === 'NS' ? formatTime(fix.fixture.date) : fix.fixture.status.short}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fix.teams.home.logo} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fix.teams.home.name}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: isLive ? 'var(--accent-green)' : 'var(--text-secondary)', padding: '2px 10px', fontFamily: 'Outfit,sans-serif' }}>
                        {fix.goals.home ?? '–'} : {fix.goals.away ?? '–'}
                      </span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{fix.teams.away.name}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fix.teams.away.logo} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right column: Value Bets + News */}
          <div>
            {/* Value Bets */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>💰 Value Bets</h2>
                <Link href="/value-bets" style={{ fontSize: 12, color: 'var(--accent-green)', textDecoration: 'none' }}>See all →</Link>
              </div>
              {topValueBets.length === 0 && (
                <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No value bets currently available (Sportmonks subscription may not include this endpoint)
                </div>
              )}
              {topValueBets.map((vb: any, i: number) => (
                <div key={i} className={`glass-card${vb.modelProb > 0.6 ? ' value-glow' : ''}`} style={{ padding: 14, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{vb.market}</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{vb.selection}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent-green)' }}>{vb.bestOdds.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(vb.modelProb * 100)}% prob</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>via {vb.bookmaker || 'Bookmaker'}</div>
                </div>
              ))}
            </div>

            {/* News */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>📰 Latest News</h2>
                <Link href="/news" style={{ fontSize: 12, color: 'var(--accent-green)', textDecoration: 'none' }}>More →</Link>
              </div>
              {allNews.map((n, i) => (
                <div key={i} className="glass-card" style={{ padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--accent-green)', marginBottom: 3, fontWeight: 600 }}>
                    BBC Sport
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {n.title.length > 80 ? n.title.slice(0, 80) + '…' : n.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
