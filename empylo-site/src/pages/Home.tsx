import { ArrowRight } from 'lucide-react';

const circlesSiteUrl = import.meta.env.VITE_CIRCLES_SITE_URL || 'http://localhost:5174';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="pill-label">Empylo</span>
            <h1>Human-centred mental wellbeing for individuals and organisations.</h1>
            <p>
              Empylo brings together product, programmes, and practical support to help people build healthier relationships with work, wellbeing, and one another.
            </p>
            <div className="hero-actions">
              <a href={circlesSiteUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                Explore Circles Health App <ArrowRight size={18} />
              </a>
              <a href="/organisations" className="btn btn-outline">
                For Organisations
              </a>
            </div>
          </div>

          <div className="hero-panel glass-panel">
            <h3>The Empylo ecosystem</h3>
            <p>
              A connected wellbeing ecosystem spanning Circles Health App, organisational programmes, and tailored support pathways for modern teams.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container intro-grid">
          <div className="section-copy">
            <span className="pill-label">Introduction</span>
            <h2>One brand, multiple ways to support mental wellbeing.</h2>
            <p>
              Empylo sits above a set of products and services designed to make emotional wellbeing more practical, relational, and sustainable.
            </p>
          </div>
          <div className="intro-cards">
            <article className="info-card">
              <h3>Circles Health App</h3>
              <p>A guided product experience for reflection, connection, and healthier wellbeing habits.</p>
              <a href={circlesSiteUrl} target="_blank" rel="noopener noreferrer">Visit Circles site</a>
            </article>
            <article className="info-card">
              <h3>For Organisations</h3>
              <p>Programmes and support designed to strengthen resilience, focus, sustainable work, and team wellbeing.</p>
              <a href="/organisations">Explore organisation support</a>
            </article>
          </div>
        </div>
      </section>

      <style>{`
        .hero {
          padding: 150px 0 90px;
          background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 60%, #E0F7F6 100%);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 30px;
          align-items: center;
        }

        .hero-copy h1 {
          max-width: 780px;
          font-size: 4rem;
          line-height: 1.02;
          font-weight: 800;
          color: var(--color-secondary);
          margin-bottom: 22px;
          letter-spacing: -0.03em;
        }

        .hero-copy p {
          max-width: 680px;
          color: var(--color-text-light);
          font-size: 1.15rem;
          line-height: 1.75;
          margin-bottom: 30px;
        }

        .pill-label {
          display: inline-flex;
          margin-bottom: 18px;
          color: var(--color-primary-dark);
          background: var(--color-primary-bg);
          padding: 0.5rem 0.9rem;
          border-radius: 999px;
          font-weight: 700;
        }

        .hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .hero-panel {
          padding: 32px;
          border-radius: 28px;
          background: rgba(255,255,255,0.85);
          box-shadow: var(--shadow-xl);
        }

        .hero-panel h3 {
          font-size: 1.45rem;
          color: var(--color-secondary);
          margin-bottom: 12px;
        }

        .hero-panel p {
          color: var(--color-text-light);
          line-height: 1.7;
        }

        .section {
          padding: 90px 0;
        }

        .intro-grid {
          display: grid;
          gap: 32px;
        }

        .section-copy h2 {
          font-size: 2.4rem;
          margin-bottom: 12px;
          color: var(--color-secondary);
        }

        .section-copy p {
          max-width: 760px;
          color: var(--color-text-light);
          line-height: 1.7;
        }

        .intro-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .info-card {
          background: white;
          border-radius: 28px;
          padding: 28px;
          border: 1px solid #E5E7EB;
          box-shadow: var(--shadow-sm);
        }

        .info-card h3 {
          margin-bottom: 10px;
          color: var(--color-secondary);
          font-size: 1.35rem;
        }

        .info-card p {
          color: var(--color-text-light);
          margin-bottom: 16px;
        }

        .info-card a {
          color: var(--color-primary-dark);
          font-weight: 700;
        }

        @media (max-width: 960px) {
          .hero-grid,
          .intro-cards {
            grid-template-columns: 1fr;
          }

          .hero-copy h1 {
            font-size: 2.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
