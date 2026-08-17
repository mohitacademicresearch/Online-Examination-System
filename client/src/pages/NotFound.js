import { Link } from 'react-router-dom';

const NotFound = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      fontFamily: 'var(--font-body)',
      background: 'var(--paper)',
    }}
  >
    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem' }}>404</h1>
    <p style={{ color: 'var(--slate)' }}>This page doesn't exist.</p>
    <Link to="/" style={{ color: 'var(--gold)', fontWeight: 600 }}>
      Back to home
    </Link>
  </div>
);

export default NotFound;