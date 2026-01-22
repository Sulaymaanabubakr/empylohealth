import { MessageCircle, Users, BarChart3, ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: Users,
            title: "Supportive Communities",
            desc: "Join Circles that resonate with your journey. Share experiences in a safe, moderated space."
        },
        {
            icon: BarChart3,
            title: "Mood Tracking",
            desc: "Visualize your emotional trends with daily check-ins. Gain insights into your mental well-being."
        },
        {
            icon: MessageCircle,
            title: "Private Chat & Huddles",
            desc: "Connect 1-on-1 or join group huddles for real-time support from peers and professionals."
        },
        {
            icon: ShieldCheck,
            title: "Secure & Anonymous",
            desc: "Your privacy is our priority. Anonymous profiles and end-to-end encryption keep you safe."
        },
        {
            icon: HeartPulse,
            title: "Professional Care",
            desc: "Access a network of certified therapists and counselors when you need extra support."
        },
        {
            icon: Sparkles,
            title: "Daily Affirmations",
            desc: "Start your day with positivity. Curated affirmations and resources to uplift your spirit."
        }
    ];

    return (
        <section className="features-section">
            <div className="container">
                <div className="section-header">
                    <span className="pill-label">Our Features</span>
                    <h2>Everything for your <span className="text-gradient">Mental Wellness</span></h2>
                    <p className="section-subheader">
                        A holistic ecosystem designed to support you at every step of your journey.
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature, idx) => (
                        <div key={idx} className="feature-card glass-panel">
                            <div className="icon-wrapper">
                                <feature.icon size={24} />
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .features-section {
                    padding: 100px 0;
                    background: white;
                }
                
                .section-header {
                    text-align: center;
                    max-width: 700px;
                    margin: 0 auto 60px;
                }
                
                .pill-label {
                    color: var(--color-primary);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-size: 0.8rem;
                    margin-bottom: 12px;
                    display: block;
                }
                
                .section-header h2 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--color-secondary);
                    margin-bottom: 16px;
                }
                
                .section-header p {
                    color: var(--color-text-light);
                    font-size: 1.1rem;
                }
                
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 32px;
                }
                
                .feature-card {
                    padding: 32px;
                    border-radius: 20px;
                    background: var(--color-bg);
                    transition: all 0.3s ease;
                    border: 1px solid transparent;
                }
                
                .feature-card:hover {
                    box-shadow: var(--shadow-xl);
                    transform: translateY(-8px); /* Lift effect */
                    background: white;
                    border-color: rgba(16, 185, 129, 0.2);
                }
                
                .icon-wrapper {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    background: var(--color-primary-bg);
                    color: var(--color-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                }
                
                .feature-card h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: var(--color-secondary);
                }
                
                .feature-card p {
                    color: var(--color-text-light);
                    line-height: 1.6;
                }
            `}</style>
        </section>
    );
};

export default Features;
