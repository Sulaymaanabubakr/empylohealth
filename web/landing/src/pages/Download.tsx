import appStoreBadge from '../assets/app-store-badge.svg';
import googlePlayBadge from '../assets/google-play-badge.svg';

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
                        <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="store-link">
                            <img src={appStoreBadge} alt="Download on the App Store" className="store-badge" />
                        </a>
                        <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="store-link">
                            <img src={googlePlayBadge} alt="Get it on Google Play" className="store-badge" />
                        </a>
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
                    gap: 24px;
                    justify-content: center;
                    margin-bottom: 60px;
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
                    height: 60px;
                    width: auto;
                    display: block;
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
                    .store-buttons { flex-direction: column; gap: 16px; }
                }
            `}</style>
        </div>
    );
};

export default Download;
