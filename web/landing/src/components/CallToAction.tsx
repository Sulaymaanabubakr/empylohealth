import { Apple, Smartphone } from 'lucide-react';
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
                            <button className="store-btn-white">
                                <Apple size={24} />
                                <div className="btn-text">
                                    <span className="small">Download on the</span>
                                    <span className="large">App Store</span>
                                </div>
                            </button>

                            <button className="store-btn-white">
                                <Smartphone size={24} />
                                <div className="btn-text">
                                    <span className="small">GET IT ON</span>
                                    <span className="large">Google Play</span>
                                </div>
                            </button>
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
                
                .btn-white {
                    background: white;
                    color: var(--color-primary-dark);
                    font-weight: 700;
                    padding: 1rem 2.5rem;
                }
                
                .btn-white:hover {
                    background: #F0FDF4;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
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
                }
                
                .store-btn-white {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: black;
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 160px;
                    text-align: left;
                }
                
                .store-btn-white:hover {
                    background: #1a1a1a;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    border-color: rgba(255,255,255,0.4);
                }

                .btn-text {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.1;
                    color: white;
                }
                
                .btn-text .small { font-size: 0.6rem; font-weight: 500; text-transform: none; opacity: 1; }
                .btn-text .large { font-size: 1.1rem; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                
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
