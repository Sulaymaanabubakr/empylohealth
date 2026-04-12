const enquireUrl = import.meta.env.VITE_ORGANISATIONS_ENQUIRE_URL || '/contact';

const focusAreas = ['Resilience', 'Focus', 'Sustainable work', 'Team wellbeing'];
const programmes = ['Mental Resilience', 'Attention & Focus', 'Individual Coaching'];

const Organisations = () => {
  return (
    <div className="page-shell">
      <section className="org-hero">
        <div className="container">
          <span className="pill-label">For Organisations</span>
          <h1>Wellbeing programmes designed for healthier teams and sustainable performance.</h1>
          <p className="page-lead">
            Empylo supports organisations with practical, human-centred wellbeing experiences that combine technology, learning, and guided support.
          </p>
          <a href={enquireUrl} className="btn btn-primary">
            Book consultation
          </a>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-copy">
            <h2>Who we work with</h2>
            <p>
              We partner with organisations that want to build emotionally sustainable cultures, support individuals more intentionally, and strengthen how teams manage change.
            </p>
          </div>

          <div className="tag-row">
            {focusAreas.map((area) => (
              <span key={area} className="focus-pill">{area}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section alt">
        <div className="container">
          <div className="section-copy centered">
            <h2>Programmes</h2>
            <p>Flexible programmes that can be shaped around your team size, structure, and goals.</p>
          </div>
          <div className="programme-grid">
            {programmes.map((programme) => (
              <div key={programme} className="programme-card">
                <h3>{programme}</h3>
                <p>
                  Delivered with a balance of practical learning, guided reflection, and wellbeing support that fits real organisational environments.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .org-hero {
          padding: 140px 0 90px;
          background: linear-gradient(180deg, #FFFFFF 0%, #FFF6E8 100%);
          text-align: center;
        }

        .org-hero h1 {
          max-width: 900px;
          margin: 0 auto 24px;
          font-size: 3.3rem;
          line-height: 1.08;
          font-weight: 800;
          color: var(--color-secondary);
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

        .page-section.alt {
          background: #F8FAFC;
        }

        .section-stack {
          display: grid;
          gap: 28px;
        }

        .section-copy {
          max-width: 760px;
        }

        .section-copy.centered {
          text-align: center;
          margin: 0 auto 28px;
        }

        .section-copy h2 {
          font-size: 2.2rem;
          color: var(--color-secondary);
          margin-bottom: 14px;
        }

        .section-copy p {
          color: var(--color-text-light);
          line-height: 1.7;
        }

        .tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .focus-pill {
          padding: 0.8rem 1.15rem;
          border-radius: 999px;
          background: var(--color-primary-bg);
          color: var(--color-primary-dark);
          font-weight: 700;
        }

        .programme-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .programme-card {
          background: white;
          border-radius: 24px;
          padding: 28px;
          border: 1px solid #E5E7EB;
          box-shadow: var(--shadow-sm);
        }

        .programme-card h3 {
          font-size: 1.25rem;
          color: var(--color-secondary);
          margin-bottom: 12px;
        }

        .programme-card p {
          color: var(--color-text-light);
          line-height: 1.65;
        }

        @media (max-width: 900px) {
          .org-hero h1 { font-size: 2.5rem; }
          .programme-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Organisations;
