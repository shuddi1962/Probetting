// app/health/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';

interface HealthStatus {
  'api-football': { ok: boolean; status: number | string };
  'sportmonks': { ok: boolean; status: number | string };
  'sofascore': { ok: boolean; status: number | string };
  'bbc-sport': { ok: boolean; status: number | string };
  checked_at: string;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => {
        setHealth(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div style={{ padding: '28px 32px', maxWidth: 800 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>⚡ Source Health</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
          Real-time status of all data pipelines and external APIs.
        </p>

        {loading ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Checking connections…
          </div>
        ) : health ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {Object.entries(health).filter(([k]) => k !== 'checked_at').map(([source, data]) => {
              const { ok, status } = data as { ok: boolean; status: string | number };
              return (
                <div key={source} className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: ok ? 'var(--accent-green)' : 'var(--accent-red)', boxShadow: ok ? '0 0 10px var(--accent-green)' : 'none' }} />
                    <span style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>{source.replace('-', ' ')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: ok ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {ok ? 'Operational' : 'Failing'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>HTTP {status}</div>
                  </div>
                </div>
              );
            })}
            
            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Last checked: {new Date(health.checked_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--accent-red)' }}>
            Failed to load health check. The backend might be down.
          </div>
        )}
      </div>
    </Shell>
  );
}
