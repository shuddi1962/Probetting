'use client';

interface FormBadgeProps { form: string }

export function FormBadge({ form }: FormBadgeProps) {
  const chars = (form || '').slice(-5).split('');
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {chars.map((c, i) => (
        <span key={i} className={`form-${c}`} style={{
          width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, fontWeight: 700,
        }}>{c}</span>
      ))}
    </div>
  );
}

interface ConfidenceBarProps { label: string; value: number; color?: string }

export function ConfidenceBar({ label, value, color = 'var(--accent-green)' }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div className="stat-bar">
        <div className="stat-bar-fill confidence-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

interface StatCompareProps {
  homeVal: string | number; awayVal: string | number; label: string;
}

export function StatCompare({ homeVal, awayVal, label }: StatCompareProps) {
  const h = parseFloat(String(homeVal)) || 0;
  const a = parseFloat(String(awayVal)) || 0;
  const total = h + a || 1;
  const homePct = (h / total) * 100;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
        <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{homeVal}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>{awayVal}</span>
      </div>
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--border)' }}>
        <div style={{ width: `${homePct}%`, background: 'var(--accent-blue)', transition: 'width 0.6s ease' }} />
        <div style={{ flex: 1, background: 'var(--accent-amber)' }} />
      </div>
    </div>
  );
}

interface LiveBadgeProps { minute?: number | null }
export function LiveBadge({ minute }: LiveBadgeProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(0,255,136,0.1)', color: 'var(--accent-green)',
      border: '1px solid rgba(0,255,136,0.3)', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span className="live-dot" style={{ width: 6, height: 6 }} />
      {minute ? `${minute}'` : 'LIVE'}
    </span>
  );
}

interface ScoreBadgeProps { home: number | null; away: number | null }
export function ScoreBadge({ home, away }: ScoreBadgeProps) {
  return (
    <span style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      padding: '4px 12px', borderRadius: 6, fontFamily: 'Outfit,sans-serif',
      fontWeight: 800, fontSize: 18, letterSpacing: 2,
    }}>
      {home ?? '–'} : {away ?? '–'}
    </span>
  );
}

interface ValueBetCardProps {
  market: string; selection: string; edge: number; ev: number;
  modelProb: number; bestOdds: number; reasoning: string;
}
export function ValueBetCardUI({ market, selection, edge, ev, modelProb, bestOdds, reasoning }: ValueBetCardProps) {
  const edgePct = Math.round(edge * 100);
  const isHigh = edgePct >= 15;
  return (
    <div className={`glass-card${isHigh ? ' value-glow' : ''}`} style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{market}</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{selection}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Edge</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: edgePct >= 10 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>+{edgePct}%</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 10 }}>
        <div><span style={{ color: 'var(--text-muted)' }}>Odds: </span><span style={{ fontWeight: 700 }}>{bestOdds.toFixed(2)}</span></div>
        <div><span style={{ color: 'var(--text-muted)' }}>Model: </span><span style={{ fontWeight: 700 }}>{Math.round(modelProb * 100)}%</span></div>
        <div><span style={{ color: 'var(--text-muted)' }}>EV: </span><span style={{ fontWeight: 700, color: ev > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{ev > 0 ? '+' : ''}{ev.toFixed(3)}</span></div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
        background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 6 }}>
        {reasoning}
      </div>
    </div>
  );
}

interface PredictionCardProps {
  homeTeam: string; awayTeam: string;
  homeWin: number; draw: number; awayWin: number;
  pick: string; confidence: number; reasons: string[]; against: string[];
}
export function PredictionCard({ homeTeam, awayTeam, homeWin, draw, awayWin, pick, confidence, reasons, against }: PredictionCardProps) {
  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        🎯 AI Prediction
      </div>
      <div style={{ marginBottom: 16 }}>
        <ConfidenceBar label={`${homeTeam} Win`} value={homeWin} color="var(--accent-blue)" />
        <ConfidenceBar label="Draw" value={draw} color="var(--draw-color)" />
        <ConfidenceBar label={`${awayTeam} Win`} value={awayWin} color="var(--accent-amber)" />
      </div>
      <div style={{
        background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
        padding: '10px 14px', borderRadius: 8, marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Recommended Pick</div>
        <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--accent-green)' }}>
          {pick} <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>({Math.round(confidence * 100)}% confidence)</span>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Why this pick:</div>
        {reasons.slice(0, 4).map((r, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '3px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.5 }}>
            • {r}
          </div>
        ))}
      </div>
      {against.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent-red)', marginBottom: 6, fontWeight: 600 }}>Why NOT the others:</div>
          {against.map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '3px 0', lineHeight: 1.5 }}>✗ {a}</div>
          ))}
        </div>
      )}
    </div>
  );
}
