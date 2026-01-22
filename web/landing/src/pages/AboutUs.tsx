import { Heart, Globe, Lightbulb, Users } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="about-page">
            {/* Hero */}
            <section className="about-hero">
                <div className="container">
                    <h1>We Are Democratizing <br /> <span className="text-gradient">Mental Health Support</span></h1>
                    <p className="hero-lead">
                        Empylo is on a mission to build a world where everyone has a circle of support,
                        accessible anytime, anywhere.
                    </p>
                </div>
            </section>

            {/* Values */}
            <section className="values-section">
                <div className="container">
                    <div className="values-grid">
                        <div className="value-card">
                            <Heart className="value-icon" size={32} />
                            <h3>Empathy First</h3>
                            <p>We design with the heart. Every feature is built to validate feelings and foster understanding.</p>
                        </div>
                        <div className="value-card">
                            <Users className="value-icon" size={32} />
                            <h3>Community Power</h3>
                            <p>Healing happens together. We empower users to lift each other up through shared experiences.</p>
                        </div>
                        <div className="value-card">
                            <Globe className="value-icon" size={32} />
                            <h3>Accessible to All</h3>
                            <p>Mental health support shouldn't be a luxury. We are breaking down barriers to entry.</p>
                        </div>
                        <div className="value-card">
                            <Lightbulb className="value-icon" size={32} />
                            <h3>Innovation</h3>
                            <p>Leveraging technology not to replace human connection, but to enhance and scale it.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Story */}
            <section className="story-section">
                <div className="container story-content">
                    <div className="story-text">
                        <h2>Our Story</h2>
                        <p>
                            Empylo was born from a simple observation: while the world is more connected than ever,
                            people feel increasingly isolated in their struggles.
                        </p>
                        <p>
                            We set out to create a third space - a digital sanctuary that combines the warmth of
                            human connection with the precision of clinically-backed tools.
                        </p>
                    </div>
                </div>
            </section>

            <style>{`
                .about-hero {
                    padding: 180px 0 100px;
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
                    background: var(--color-secondary);
                    color: white;
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
                    color: #CBD5E1;
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
