export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', textAlign: 'center' }}>
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="h-display" style={{ marginTop: '1.5rem' }}>Not found</h1>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>That page does not exist.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: '2rem', color: 'var(--neon-blue)' }}>Back to home</a>
      </div>
    </main>
  );
}
