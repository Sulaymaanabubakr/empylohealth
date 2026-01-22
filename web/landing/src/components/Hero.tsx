import { ArrowRight, CheckCircle } from 'lucide-react';
// import { Link } from 'react-router-dom'; // Unused
import heroMockup from '../assets/iphone-mockup-2.png'; // Using existing asset
// import appStoreBadge from '../assets/app-store-badge.png';
// import googlePlayBadge from '../assets/google-play-badge.png';

const Hero = () => {
    return (
        <section className="hero">
            <div className="hero-bg-glow"></div>

            <div className="container hero-container">
                <div className="hero-content">
                    <div className="badge-pill">
                        <span className="badge-dot"></span>
                        <span>Circles Health App Client</span>
                    </div>

                    <h1 className="hero-title">
                        Stronger <span className="highlight">Connections</span>,<br />
                        Better Health
                    </h1>

                    <p className="hero-description">
                        Sign up to champion a workplace that values mental health, and
                        together, let's create a nurturing environment where your employees can thrive.
                    </p>

                    <div className="hero-actions">
                        <a href="#download" className="btn btn-primary btn-lg">
                            Get Started <ArrowRight size={20} />
                        </a>
                    </div>

                    <div className="trust-indicators">
                        <div className="trust-item">
                            <CheckCircle size={16} className="text-emerald" />
                            <span>Certified Therapists</span>
                        </div>
                        <div className="trust-item">
                            <CheckCircle size={16} className="text-emerald" />
                            <span>Secure & Private</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="visual-circle"></div>
                    <img src={heroMockup} alt="Empylo App Interface" className="visual-mockup" />

                    {/* Floating Cards (Yustam Style) */}
                    <div className="floating-card card-1 glass-panel">
                        <span className="emoji">😊</span>
                        <div>
                            <p className="fc-title">Daily Mood</p>
                            <p className="fc-val">Feeling Great!</p>
                        </div>
                    </div>

                    <div className="floating-card card-2 glass-panel">
                        <span className="emoji">👥</span>
                        <div>
                            <p className="fc-title">Community</p>
                            <p className="fc-val">12 New Members</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hero {
                    padding: 100px 0 80px; /* Top padding accounts for fixed navbar */
                    position: relative;
                    overflow: hidden;
                    min-height: 90vh; /* Full screen feel */
                    display: flex;
                    align-items: center;
                }
            
                .hero-bg-glow {
                    position: absolute;
                    top: -20%;
                    right: -10%;
                    width: 50vw;
                    height: 50vw;
                    background: radial-gradient(circle, rgba(0, 169, 157, 0.15) 0%, rgba(255,255,255,0) 70%);
                    filter: blur(60px);
                    z-index: -1;
                }

                .hero-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4rem;
                    align-items: center;
                }
            
                .hero-content {
                    max-width: 600px;
                }
            
                .badge-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 16px;
                    background: var(--color-primary-bg);
                    color: var(--color-primary-dark);
                    border-radius: 99px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    margin-bottom: 24px;
                    border: 1px solid rgba(0, 169, 157, 0.2);
                }
            
                .badge-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--color-primary);
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
            
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(0, 169, 157, 0.4); }
                    70% { box-shadow: 0 0 0 6px rgba(0, 169, 157, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 169, 157, 0); }
                }
            
                .hero-title {
                    font-size: 4rem; /* Big impact */
                    line-height: 1.1;
                    font-weight: 800;
                    color: var(--color-secondary);
                    margin-bottom: 24px;
                    letter-spacing: -0.02em;
                }
            
                .highlight {
                    color: var(--color-primary);
                    position: relative;
                    z-index: 0;
                }
            
                .highlight::after {
                    content: '';
                    position: absolute;
                    bottom: 10px;
                    left: -4px;
                    right: -4px;
                    height: 12px;
                    background: var(--color-primary-bg);
                    z-index: -1;
                    transform: rotate(-1deg);
                }
            
                .hero-description {
                    font-size: 1.25rem;
                    color: var(--color-text-light);
                    margin-bottom: 40px;
                    line-height: 1.6;
                }
            
                .hero-actions {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 32px;
                }
            
                .btn-lg {
                    padding: 1rem 2rem;
                    font-size: 1.125rem;
                    gap: 8px;
                }
            
                .trust-indicators {
                    display: flex;
                    gap: 24px;
                    font-size: 0.9rem;
                    color: var(--color-text-light);
                    font-weight: 500;
                }

                .store-buttons-small {
                    display: flex;
                    gap: 12px;
                }

                .store-btn-tiny {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    border: 1px solid rgba(0,0,0,0.1);
                    background: white;
                    color: var(--color-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .store-btn-tiny:hover {
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                    transform: translateY(-2px);
                }
            
                .trust-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
            
                .text-emerald { color: var(--color-primary); }
            
                /* Visual Right Side */
                .hero-visual {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            
                .visual-circle {
                    position: absolute;
                    width: 90%;
                    padding-bottom: 90%; /* Aspect ratio 1:1 */
                    background: var(--color-primary-bg);
                    border-radius: 50%;
                    z-index: -1;
                }
            
                .visual-mockup {
                    width: 80%;
                    max-width: 380px;
                    height: auto;
                    filter: drop-shadow(0 25px 50px rgba(0,0,0,0.15));
                    transition: transform 0.3s ease;
                }
            
                .visual-mockup:hover {
                    transform: scale(1.02);
                }
            
                /* Floating Elements */
                .floating-card {
                    position: absolute;
                    padding: 16px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
                    animation: float 6s ease-in-out infinite;
                    z-index: 2;
                }
            
                .card-1 {
                    top: 20%;
                    left: 0;
                    animation-delay: 0s;
                }
            
                .card-2 {
                    bottom: 20%;
                    right: 5%;
                    animation-delay: 2s;
                }
            
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
            
                .emoji { font-size: 1.5rem; }
                .fc-title { font-size: 0.75rem; color: var(--color-text-light); }
                .fc-val { font-size: 0.9rem; font-weight: 700; color: var(--color-secondary); }

                @media (max-width: 1024px) {
                    .hero-container { grid-template-columns: 1fr; text-align: center; }
                    .hero-content { margin: 0 auto; }
                    .hero-actions { justify-content: center; }
                    .trust-indicators { justify-content: center; }
                    .visual-mockup { width: 60%; }
                    .hero { padding-top: 120px; }
                }
            
                @media (max-width: 768px) {
                    .hero-title { font-size: 2.5rem; }
                    .floating-card { display: none; } /* Hide floaters on mobile */
                    .visual-mockup { width: 80%; }
                }
            `}</style>
        </section>
    );
};

export default Hero;
