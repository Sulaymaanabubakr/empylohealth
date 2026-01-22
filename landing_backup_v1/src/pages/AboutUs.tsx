import React from 'react';
import teamImg from '../assets/top-bg.png'; // Using abstract bg for now, or could use another asset

const AboutUs = () => {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>We Are Democratizing <br /> <span className="highlight">Mental Health Support</span></h1>
                        <p>
                            At Empylo, we believe that mental wellness is a fundamental human right.
                            Our mission is to build a world where everyone has a circle of support,
                            accessible anytime, anywhere.
                        </p>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section container">
                <div className="story-grid">
                    <div className="story-text">
                        <h2>Our Story</h2>
                        <p>
                            Empylo was born from a simple observation: while the world is more connected than ever,
                            people feel increasingly isolated in their struggles. Traditional therapy is often
                            expensive or inaccessible, and social media can sometimes exacerbate feelings of inadequacy.
                        </p>
                        <p>
                            We set out to create a third space—a digital sanctuary that combines the warmth of
                            human connection with the precision of clinically-backed tools. Circles Health App
                            is the result of years of research, design, and listening to stories of resilience.
                        </p>
                    </div>
                    <div className="story-visual">
                        <div className="visual-block"></div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="values-section">
                <div className="container">
                    <h2>Our Core Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <h3>Empathy First</h3>
                            <p>We design with the heart. Every feature is built to validate feelings and foster understanding.</p>
                        </div>
                        <div className="value-card">
                            <h3>Radical Privacy</h3>
                            <p>Your data is sacred. We enforce the strictest security standards because trust is our currency.</p>
                        </div>
                        <div className="value-card">
                            <h3>Community Power</h3>
                            <p>Healing happens together. We empower users to lift each other up through shared experiences.</p>
                        </div>
                        <div className="value-card">
                            <h3>Innovation</h3>
                            <p>We leverage technology not to replace human connection, but to enhance and scale it.</p>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
        .about-page {
          background-color: #FAFAFA;
        }

        .about-hero {
          padding: 80px 0 100px;
          text-align: center;
          background: white;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .hero-content h1 {
          font-size: 3.5rem;
          color: #0F172A;
          margin-bottom: 24px;
          line-height: 1.2;
          font-weight: 800;
        }

        .hero-content .highlight {
          color: var(--color-primary);
          position: relative;
          display: inline-block;
        }

        .hero-content p {
          font-size: 1.25rem;
          color: #475569;
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .story-section {
          padding: 100px 15px;
        }

        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .story-text h2 {
          font-size: 2.5rem;
          margin-bottom: 24px;
          color: #1E293B;
          font-weight: 700;
        }

        .story-text p {
          font-size: 1.1rem;
          color: #475569;
          margin-bottom: 20px;
          line-height: 1.7;
        }

        .visual-block {
          background: var(--color-primary-light);
          height: 400px;
          border-radius: 40px;
          width: 100%;
          opacity: 0.2;
          background-image: radial-gradient(#0F766E 2px, transparent 2px);
          background-size: 30px 30px;
        }

        .values-section {
          background: #0F172A; /* Dark background for impact */
          padding: 100px 0;
          color: white;
        }

        .values-section h2 {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 60px;
          font-weight: 700;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
        }

        .value-card {
          background: rgba(255,255,255,0.05);
          padding: 32px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          transition: transform 0.3s ease;
        }

        .value-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.1);
        }

        .value-card h3 {
          font-size: 1.25rem;
          margin-bottom: 12px;
          color: var(--color-accent);
          font-weight: 700;
        }

        .value-card p {
          color: #94A3B8;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .hero-content h1 { font-size: 2.5rem; }
          .story-grid { grid-template-columns: 1fr; gap: 40px; }
          .visual-block { height: 250px; }
        }
      `}</style>
        </div>
    );
};

export default AboutUs;
