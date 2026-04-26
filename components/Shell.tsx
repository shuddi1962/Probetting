'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/fixtures', label: 'Fixtures', icon: '🗓️' },
  { href: '/live', label: 'Live Now', icon: '🔴' },
  { href: '/value-bets', label: 'Value Bets', icon: '💰' },
  { href: '/standings', label: 'Standings', icon: '🏆' },
  { href: '/news', label: 'News', icon: '📰' },
  { href: '/health', label: 'Sources', icon: '⚡' },
];

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '20px 12px', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50,
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 20, fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '-0.5px' }}>
            ⚽ ProBetting
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Analytics & Intelligence</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ href, label, icon }) => (
            <Link key={href} href={href} className={`sidebar-link${path === href ? ' active' : ''}`}>
              <span>{icon}</span>
              <span>{label}</span>
              {href === '/live' && (
                <span className="live-dot" style={{ marginLeft: 'auto' }} />
              )}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Data: API-Football · Sportmonks<br />
            Scraper: Sofascore · FBref · Understat<br />
            <span style={{ color: 'var(--accent-green)' }}>● Live</span>
          </div>
        </div>
      </aside>
      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  );
}
