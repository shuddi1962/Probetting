// app/value-bets/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import Link from 'next/link';

export default function ValueBetsPage() {
  const [valueBets, setValueBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/value-bets')
      .then(r => r.json())
      .then(d => {
        setValueBets(d.valueBets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div style={{ padding: '28px 32px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>💰 Value Bets</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
          Algorithmic value detection powered by Poisson modelling & API-Football odds.
        </p>

        {loading ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              border: '3px solid rgba(0, 255, 136, 0.2)',
              borderTopColor: 'var(--accent-green)',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            Scanning bookmakers for value...
          </div>
        ) : valueBets.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>No value bets found today</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
              We scanned the upcoming matches, but none offered a positive expected value (EV) above our 5% edge threshold. Check back later!
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {valueBets.map((vb, i) => {
              const isHighValue = vb.edge > 0.1;
              return (
                <div key={i} className={`glass-card${isHighValue ? ' value-glow' : ''}`} style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      {vb.match_name && (
                        <Link href={`/match/${vb.fixture_id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginBottom: 6, fontWeight: 700 }}>
                            🔗 {vb.match_name}
                          </div>
                        </Link>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{vb.market}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{vb.selection}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'Outfit,sans-serif' }}>{vb.bestOdds.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Best Odds</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: isHighValue ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                        {Math.round(vb.modelProb * 100)}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Model Prob</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent-blue)' }}>
                        +{(vb.edge * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Edge (EV)</div>
                    </div>
                  </div>

                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ height: '100%', width: `${vb.modelProb * 100}%`, background: isHighValue ? 'var(--accent-green)' : 'var(--accent-amber)', transition: 'width 0.6s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      📚 {vb.bookmaker}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      Source: {vb.source === 'poisson' ? 'Poisson AI' : 'Sportmonks'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </Shell>
  );
}
