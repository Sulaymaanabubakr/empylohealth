import { Heart, Compass, Smile } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="about-page">
            {/* Hero */}
            <section className="about-hero">
                <div className="container">
                    <h1>Democratizing <br /> <span className="text-gradient">Mental Health Support</span></h1>
                    <p className="hero-lead">
                        Our mission is to build a world where everyone has a circle of care that’s accessible anytime, anywhere.
                    </p>
                </div>
            </section>

            {/* Story */}
            <section className="story-section">
                <div className="container story-content">
                    <div className="story-text">
                        <h2>Our Story</h2>
                        <p>
                            Circles Health App was born from a simple observation: while the world is more connected than ever,
                            many people feel increasingly disconnected and alone in their struggles.
                        </p>
                        <p>
                            We are creating a third space - a digital sanctuary that brings together genuine connection and
                            holistic wellbeing. Designed to address the growing intersection between loneliness and worsening
                            mental health, Circles Health App helps people find balance, belonging, and support in their everyday lives.
                        </p>
                        <p>
                            Founded by a digital clinician with over a decade of experience in mental health care and health technology,
                            we build solutions to support mental wellbeing.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="values-section">
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '48px', color: 'var(--color-secondary)' }}>Our Guiding Principles</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <Heart className="value-icon" size={32} />
                            <h3>Passion</h3>
                            <p>We care deeply about human connection and the shared journey toward wellbeing.</p>
                        </div>
                        <div className="value-card">
                            <Compass className="value-icon" size={32} />
                            <h3>Purpose</h3>
                            <p>Every feature is designed with intention - to inspire growth, reflection, and meaningful support.</p>
                        </div>
                        <div className="value-card">
                            <Smile className="value-icon" size={32} />
                            <h3>Play</h3>
                            <p>We value curiosity, lightness, and creativity as vital parts of wellbeing and connection.</p>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                .about-hero {
                    padding: 100px 0 80px;
                    text-align: center;
                    background: #F8FAFC;
                }
                
                .about-hero h1 {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin-bottom: 24px;
                    color: var(--color-secondary);
                    line-height: 1.1;
                }
                
                .hero-lead {
                    font-size: 1.25rem;
                    color: var(--color-text-light);
                    max-width: 700px;
                    margin: 0 auto;
                }
                
                .values-section {
                    padding: 80px 0;
                    background: white;
                }
                
                .values-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 32px;
                }
                
                .value-card {
                    padding: 32px;
                    background: #F8FAFC;
                    border-radius: 20px;
                    transition: transform 0.3s;
                }
                
                .value-card:hover {
                    transform: translateY(-5px);
                    background: #F0FDF4;
                }
                
                .value-icon {
                    color: var(--color-primary);
                    margin-bottom: 20px;
                }
                
                .value-card h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                }
                
                .story-section {
                    padding: 100px 0;
                    background: var(--color-primary-bg);
                    color: var(--color-secondary);
                    text-align: center;
                }
                
                .story-text {
                    max-width: 700px;
                    margin: 0 auto;
                }
                
                .story-text h2 {
                    font-size: 2.5rem;
                    margin-bottom: 32px;
                }
                
                .story-text p {
                    font-size: 1.1rem;
                    line-height: 1.8;
                    margin-bottom: 24px;
                    color: var(--color-text-light);
                }
                
                @media (max-width: 768px) {
                    .about-hero h1 { font-size: 2.5rem; }
                    .value-card { text-align: center; }
                    .value-icon { margin-left: auto; margin-right: auto; display: block; }
                }
            `}</style>
        </div>
    );
};

export default AboutUs;
