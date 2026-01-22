const Terms = () => {
    return (
        <div className="legal-page">
            <div className="container">
                <h1>Terms of Service</h1>
                <p className="last-updated">Last Updated: January 2026</p>

                <div className="legal-content">
                    <p>Welcome to Empylo. By using our app, you agree to these terms.</p>

                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using our services, you agree to be bound by these Terms.
                        If you disagree with any part of the terms, you may not access the service.
                    </p>

                    <h2>2. User Content</h2>
                    <p>
                        Our service allows you to post links, store, share and otherwise make available certain
                        information, text, graphics, videos, or other material ("User Content"). You are responsible
                        for the User Content that you post to the Service.
                    </p>

                </div>
            </div>
            <style>{`
                .legal-page { padding: 100px 0 80px; }
                .legal-page h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 8px; }
                .last-updated { color: #64748B; margin-bottom: 40px; }
                .legal-content { max-width: 800px; }
                .legal-content h2 { margin-top: 32px; margin-bottom: 16px; font-size: 1.5rem; font-weight: 700; color: #1E293B; }
                .legal-content p { line-height: 1.7; color: #475569; margin-bottom: 16px; }

                @media (max-width: 768px) {
                    .legal-page h1 { text-align: center; font-size: 2rem; }
                    .last-updated { text-align: center; }
                    .legal-content { text-align: center; }
                    .legal-content h2 { text-align: center; }
                }
        `}</style>
        </div>
    );
};
export default Terms;
