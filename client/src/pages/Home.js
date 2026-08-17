import { Link } from 'react-router-dom';
import './Home.css';

const features = [
  {
    label: 'Tab & Window Watch',
    text: 'Detects tab switches, minimizing, and lost focus the moment they happen — logged with a timestamp, not a guess.',
  },
  {
    label: 'Locked Fullscreen',
    text: 'Exams run in enforced fullscreen. Exiting early is recorded as a violation, instantly.',
  },
  {
    label: 'Copy-Paste Guard',
    text: 'Clipboard shortcuts and right-click are disabled during the exam window, with every attempt logged.',
  },
  {
    label: 'No Camera, No Guesswork',
    text: 'Everything runs on native browser APIs. No webcam, no facial recognition, no third-party AI.',
  },
];

const Home = () => {
  return (
    <div className="home">
      <nav className="home-nav">
        <div className="brand">
          <span className="brand-mark">◈</span> ExamGuard
        </div>
        <div className="nav-links">
          <Link to="/student-login">Student Login</Link>
          <Link to="/register" className="nav-cta">
            Register
          </Link>
          <Link to="/admin-login" className="nav-admin">
            Admin
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Browser-based exam integrity</p>
          <h1>
            Examinations, <em>verified</em> — without a watching eye.
          </h1>
          <p className="hero-sub">
            A lightweight, privacy-conscious way to keep online exams honest — using only what the
            browser already gives us. No webcams. No AI proctoring. No paid software.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">
              Register as Student
            </Link>
            <Link to="/student-login" className="btn btn-ghost">
              Student Login
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="browser-card">
            <div className="browser-chrome">
              <span className="dot dot-red" />
              <span className="dot dot-amber" />
              <span className="dot dot-green" />
              <span className="browser-url">exam.local/attempt/482</span>
            </div>
            <div className="browser-body">
              <div className="line line-w1" />
              <div className="line line-w2" />
              <div className="line line-w3" />
              <div className="scanline" />
            </div>
            <div className="browser-badge">
              <span className="pulse-dot" /> Monitoring active
            </div>
          </div>
          <div className="blob blob-a" />
          <div className="blob blob-b" />
        </div>
      </header>

      <section className="features">
        <p className="section-eyebrow">How it holds the line</p>
        <div className="feature-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.label}>
              <h3>{f.label}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <span>Dissertation Prototype — Browser-Based Anti-Cheating for Online Exams</span>
      </footer>
    </div>
  );
};

export default Home;