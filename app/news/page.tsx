// app/news/page.tsx
import Shell from '@/components/Shell';
import { getLatestFootballNews, type NewsItem } from '@/lib/scrapers';

export default async function NewsPage() {
  const bbc = await getLatestFootballNews();

  return (
    <Shell>
      <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>📰 Football News</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
          Latest updates from BBC Sport.
        </p>

        <div style={{ display: 'grid', gap: 24 }}>
          {/* BBC News */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--accent-blue)' }}>
              🌍 BBC Sport Top Stories
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {bbc.map((item: NewsItem, i: number) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="glass-card" style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}</div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>{item.title}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{item.summary}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
