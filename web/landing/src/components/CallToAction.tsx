import appStoreBadge from '../assets/app-store-badge.svg';
import googlePlayBadge from '../assets/google-play-badge.svg';
// import { Link } from 'react-router-dom'; // Unused

const CallToAction = () => {
    return (
        <section className="cta-section" id="download">
            <div className="container">
                <div className="cta-card glass-panel">
                    <div className="cta-content">
                        <h2>Ready to join the Circle?</h2>
                        <p>
                            Download the Empylo app today and take the first step towards a healthier, happier mind.
                        </p>
                        <h3 className="cta-subhead">Get Started Now</h3>
                        <div className="cta-buttons store-buttons">
                            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="store-link">
                                <img src={appStoreBadge} alt="Download on the App Store" className="store-badge" />
                            </a>
                            <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="store-link">
                                <img src={googlePlayBadge} alt="Get it on Google Play" className="store-badge" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .cta-section {
                    padding: 0 0 100px;
                    background: white;
                }
                
                .cta-card {
                    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
                    padding: 80px 40px;
                    border-radius: 30px;
                    text-align: center;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
                }
                
                /* Abstract shapes */
                .cta-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -10%;
                    width: 400px;
                    height: 400px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 50%;
                }
                
                .cta-card::after {
                    content: '';
                    position: absolute;
                    bottom: -50%;
                    right: -10%;
                    width: 300px;
                    height: 300px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 50%;
                }
                
                .cta-content {
                    position: relative;
                    z-index: 2;
                    max-width: 600px;
                    margin: 0 auto;
                }
                
                .cta-content h2 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 20px;
                }
                
                .cta-content p {
                    font-size: 1.1rem;
                    opacity: 0.9;
                    margin-bottom: 32px;
                }
                
                .cta-subhead {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 24px;
                    opacity: 0.95;
                }

                .store-buttons {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                    align-items: center;
                }
                
                .store-link {
                    display: inline-block;
                    transition: transform 0.2s, opacity 0.2s;
                }
                
                .store-link:hover {
                    transform: translateY(-3px);
                    opacity: 0.9;
                }
                
                .store-badge {
                    height: 48px; /* Slightly smaller than download page to fit card */
                    width: auto;
                    display: block;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    border-radius: 8px;
                }

                @media (max-width: 768px) {
                    .cta-card { padding: 60px 24px; }
                    .cta-content h2 { font-size: 2rem; }
                    .store-buttons { flex-direction: column; align-items: center; }
                }
            `}</style>
        </section>
    );
};

export default CallToAction;
