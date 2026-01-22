const PrivacyPolicy = () => {
    return (
        <div className="legal-page">
            <div className="container">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last Updated: January 2026</p>

                <div className="legal-content">
                    <p>
                        At Empylo (Circles Health), your privacy is our priority. We are committed to protecting
                        your personal data and respecting your privacy rights.
                    </p>

                    <h2>1. Information We Collect</h2>
                    <p>
                        We collect information you provide directly to us, such as when you create an account,
                        update your profile, or communicate with us. This may include your name, email address,
                        and mood tracking data.
                    </p>

                    <h2>2. How We Use Your Information</h2>
                    <p>
                        We use the information we collect to provide, maintain, and improve our services,
                        such as personalizing your mood tracking insights and connecting you with relevant communities.
                    </p>

                    <h2>3. Data Security</h2>
                    <p>
                        We implement industry-standard security measures to protect your data from unauthorized access,
                        alteration, or destruction.
                    </p>

                    {/* Add more sections as per standard template */}
                </div>
            </div>
            <style>{`
                .legal-page { padding: 160px 0 100px; }
                .legal-page h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 8px; }
                .last-updated { color: #64748B; margin-bottom: 40px; }
                .legal-content { max-width: 800px; }
                .legal-content h2 { margin-top: 32px; margin-bottom: 16px; font-size: 1.5rem; font-weight: 700; color: #1E293B; }
                .legal-content p { line-height: 1.7; color: #475569; margin-bottom: 16px; }
      `}</style>
        </div>
    );
};
export default PrivacyPolicy;
