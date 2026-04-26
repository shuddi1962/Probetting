// app/loading.tsx
import Shell from '@/components/Shell';

export default function Loading() {
  return (
    <Shell>
      <div style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(0, 255, 136, 0.2)',
          borderTopColor: 'var(--accent-green)',
          animation: 'spin 1s linear infinite',
          marginBottom: 16
        }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Loading latest football data...
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </Shell>
  );
}
