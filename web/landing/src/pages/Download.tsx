import { Apple, Smartphone } from 'lucide-react';

const Download = () => {
    return (
        <div className="download-page">
            <div className="container download-container">
                <div className="download-content">
                    <h1>Download <span className="text-gradient">Empylo</span></h1>
                    <p className="lead-text">
                        Your circle of support is just a tap away. Available on iOS and Android.
                    </p>

                    <div className="store-buttons">
                        <button className="store-btn">
                            <Apple size={28} />
                            <div className="btn-text">
                                <span className="small">Download on the</span>
                                <span className="large">App Store</span>
                            </div>
                        </button>

                        <button className="store-btn">
                            <Smartphone size={28} /> {/* Using generic smartphone icon as placeholder for Play Store if generic */}
                            <div className="btn-text">
                                <span className="small">GET IT ON</span>
                                <span className="large">Google Play</span>
                            </div>
                        </button>
                    </div>

                    <div className="qr-section glass-panel">
                        <p>Scan to download instantly</p>
                        {/* Placeholder QR Code */}
                        <div className="qr-placeholder">
                            <div className="qr-code"></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .download-page {
                    min-height: 100vh;
                    padding-top: 140px;
                    background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }
                
                .download-content h1 {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin-bottom: 24px;
                    color: var(--color-secondary);
                }
                
                .lead-text {
                    font-size: 1.25rem;
                    color: var(--color-text-light);
                    margin-bottom: 48px;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .store-buttons {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin-bottom: 60px;
                    flex-wrap: wrap;
                }
                
                .store-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: var(--color-secondary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    min-width: 180px;
                }
                
                .store-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.15);
                }
                
                .btn-text {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    line-height: 1.2;
                }
                
                .btn-text .small {
                    font-size: 0.75rem;
                    font-weight: 500;
                    opacity: 0.9;
                }
                
                .btn-text .large {
                    font-size: 1.2rem;
                    font-weight: 700;
                }
                
                .qr-section {
                    display: inline-block;
                    padding: 32px;
                    border-radius: 24px;
                }
                
                .qr-section p {
                    margin-bottom: 16px;
                    font-weight: 600;
                    color: var(--color-secondary);
                }
                
                .qr-placeholder {
                    width: 150px;
                    height: 150px;
                    background: white;
                    margin: 0 auto;
                    border-radius: 12px;
                    border: 2px dashed #E2E8F0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .qr-code {
                    width: 120px;
                    height: 120px;
                    background: #CBD5E1; /* Placeholder */
                }

                @media (max-width: 768px) {
                    .download-content h1 { font-size: 2.5rem; }
                    .store-buttons { flex-direction: column; align-items: center; }
                }
            `}</style>
        </div>
    );
};

export default Download;
