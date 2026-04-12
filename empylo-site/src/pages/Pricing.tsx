const enquireUrl = import.meta.env.VITE_ORGANISATIONS_ENQUIRE_URL || '/contact';

const plans = [
  {
    title: 'Enterprise Plan',
    points: ['Access to Circles Health App premium features', 'Scalable for teams', 'Flexible pricing based on organisation size'],
  },
  {
    title: 'Circles+ Plan',
    points: ['App access', 'Coaching programmes included', 'Flexible pricing based on organisation size'],
  },
];

const Pricing = () => {
  return (
    <div className="pricing-page">
      <section className="pricing-hero">
        <div className="container">
          <span className="pill-label">Pricing</span>
          <h1>Flexible pricing for organisations building healthier teams.</h1>
          <p className="pricing-lead">
            We shape pricing around organisational size, delivery model, and the level of support your people need.
          </p>
        </div>
      </section>

      <section className="pricing-section">
        <div className="container">
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article key={plan.title} className="pricing-card">
                <h2>{plan.title}</h2>
                <ul>
                  {plan.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <div className="pricing-actions">
                  <a href={enquireUrl} className="btn btn-primary">Enquire</a>
                  <a href={enquireUrl} className="btn btn-outline">Book consultation</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .pricing-hero {
          padding: 140px 0 80px;
          text-align: center;
          background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
        }

        .pricing-hero h1 {
          max-width: 900px;
          margin: 0 auto 22px;
          font-size: 3.2rem;
          line-height: 1.08;
          color: var(--color-secondary);
          font-weight: 800;
        }

        .pricing-lead {
          max-width: 720px;
          margin: 0 auto;
          color: var(--color-text-light);
          font-size: 1.15rem;
        }

        .pricing-section {
          padding: 70px 0 100px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .pricing-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 28px;
          padding: 32px;
          box-shadow: var(--shadow-md);
        }

        .pricing-card h2 {
          margin-bottom: 22px;
          font-size: 1.7rem;
          color: var(--color-secondary);
        }

        .pricing-card ul {
          display: grid;
          gap: 12px;
          margin-bottom: 28px;
          color: var(--color-text-light);
        }

        .pricing-card li {
          padding-left: 18px;
          position: relative;
        }

        .pricing-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.65rem;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
        }

        .pricing-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        @media (max-width: 860px) {
          .pricing-hero h1 { font-size: 2.4rem; }
          .pricing-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Pricing;
