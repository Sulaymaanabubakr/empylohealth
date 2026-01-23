import { Smile, Users, BookOpen } from 'lucide-react';
import appScreen1 from '../assets/app-screen-1.png'; // Make sure this exists
// import appScreen2 from '../assets/iphone-mockup-1.png'; // Unused

const AppShowcase = () => {
    return (
        <section className="showcase-section">
            <div className="container">
                <div className="showcase-content">
                    <div className="text-side">
                        <h2>Simple, Intuitive, <span className="highlight-text">Empowering</span></h2>
                        <p>
                            Built with empathy and simplicity at its heart, Empylo offers a calming, intuitive experience centered on what truly matters - connection and wellbeing.
                        </p>

                        <div className="showcase-cards">
                            <div className="showcase-card">
                                <div className="icon-box">
                                    <Smile size={24} />
                                </div>
                                <div className="text-box">
                                    <strong>Smart Check-ins</strong>
                                    <p>Track your mood in seconds with our intuitive slider.</p>
                                </div>
                            </div>

                            <div className="showcase-card">
                                <div className="icon-box">
                                    <Users size={24} />
                                </div>
                                <div className="text-box">
                                    <strong>Instant Connection</strong>
                                    <p>Join a Huddle instantly when you need to talk.</p>
                                </div>
                            </div>

                            <div className="showcase-card">
                                <div className="icon-box">
                                    <BookOpen size={24} />
                                </div>
                                <div className="text-box">
                                    <strong>Resource Library</strong>
                                    <p>Thousands of articles and exercises at your fingertips.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="image-side">
                        <div className="phone-mockup glow-effect">
                            <img src={appScreen1} alt="Empylo App Screen" />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .showcase-section {
                    padding: 100px 0;
                    background: var(--color-primary-bg);
                    overflow: hidden;
                }
                
                .showcase-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    align-items: center;
                }
                
                .text-side h2 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--color-secondary);
                    margin-bottom: 24px;
                    line-height: 1.2;
                }
                
                .highlight-text {
                    color: var(--color-primary);
                }
                
                .text-side p {
                    font-size: 1.1rem;
                    color: var(--color-text-light);
                    margin-bottom: 40px;
                    line-height: 1.6;
                }
                
                .showcase-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .showcase-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 20px;
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(10px);
                    padding: 20px;
                    border-radius: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }

                .showcase-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
                    background: white;
                }

                .icon-box {
                    background: white;
                    color: var(--color-primary);
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 4px 10px rgba(0, 169, 157, 0.15);
                }
                
                .text-box strong {
                    display: block;
                    margin-bottom: 6px;
                    color: var(--color-secondary);
                    font-size: 1.1rem;
                    font-weight: 700;
                }
                
                .text-box p {
                    font-size: 0.95rem;
                    margin-bottom: 0;
                    line-height: 1.5;
                    color: var(--color-text-light);
                }
                
                .image-side {
                    display: flex;
                    justify-content: center;
                    position: relative;
                }
                
                .phone-mockup {
                    width: 300px;
                    border-radius: 40px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.2);
                    border: 8px solid white;
                    overflow: hidden;
                    background: white;
                    transform: rotate(-3deg);
                    transition: transform 0.5s ease;
                }
                
                .phone-mockup:hover {
                    transform: rotate(0deg) scale(1.02);
                }
                
                .glow-effect::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 120%;
                    height: 120%;
                    background: radial-gradient(circle, rgba(52, 211, 153, 0.4) 0%, transparent 70%);
                    z-index: -1;
                }

                @media (max-width: 768px) {
                    .showcase-content {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }
                    .showcase-card {
                        flex-direction: column;
                        text-align: center;
                        align-items: center;
                    }
                    .showcase-cards {
                        max-width: 100%;
                    }
                    .text-side h2 { font-size: 2rem; }
                    .image-side { margin-top: 40px; }
                }
            `}</style>
        </section>
    );
};

export default AppShowcase;
