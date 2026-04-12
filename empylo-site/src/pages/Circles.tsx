const circlesSiteUrl = import.meta.env.VITE_CIRCLES_SITE_URL || 'http://localhost:5174';

const benefits = [
  'Understanding emotions',
  'Building awareness',
  'Staying connected',
  'Building habits',
];

const Circles = () => {
  return (
    <div className="page-shell">
      <section className="page-hero circles-hero">
        <div className="container">
          <span className="pill-label">Circles Health App</span>
          <h1>Connection-first support for everyday mental wellbeing.</h1>
          <p className="page-lead">
            Circles Health App helps people reflect, connect, and build healthier patterns through guided tools and supportive circles.
          </p>
          <a href={circlesSiteUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            Explore Circles Health App
          </a>
        </div>
      </section>

      <section className="page-section">
        <div className="container split-grid">
          <div>
            <h2>What Circles Health App helps people do</h2>
            <p>
              Circles brings together emotional reflection, supportive conversations, and habit-building into one calm, accessible product experience.
            </p>
          </div>

          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <div key={benefit} className="benefit-card">
                <h3>{benefit}</h3>
                <p>Built into a product that encourages steady, human-centred progress rather than overwhelm.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .circles-hero {
          padding: 140px 0 90px;
          background: linear-gradient(180deg, #F8FAFC 0%, #E0F7F6 100%);
          text-align: center;
        }

        .circles-hero h1 {
          font-size: 3.4rem;
          line-height: 1.08;
          font-weight: 800;
          color: var(--color-secondary);
          margin-bottom: 24px;
        }

        .page-lead {
          max-width: 760px;
          margin: 0 auto 32px;
          color: var(--color-text-light);
          font-size: 1.15rem;
        }

        .page-section {
          padding: 90px 0;
        }

        .split-grid {
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          gap: 40px;
          align-items: start;
        }

        .split-grid h2 {
          font-size: 2.2rem;
          margin-bottom: 16px;
          color: var(--color-secondary);
        }

        .split-grid p {
          color: var(--color-text-light);
          line-height: 1.7;
        }

        .benefit-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .benefit-card {
          background: white;
          border: 1px solid #DDE7EE;
          border-radius: 24px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        .benefit-card h3 {
          margin-bottom: 10px;
          color: var(--color-secondary);
        }

        @media (max-width: 860px) {
          .circles-hero h1 { font-size: 2.5rem; }
          .split-grid,
          .benefit-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Circles;
