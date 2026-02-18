const CommunityGuidelines = () => {
    return (
        <div className="legal-page">
            <header className="legal-header">
                <div className="container">
                    <h1>Community Guidelines</h1>
                    <p className="last-updated">Last Updated: February 18, 2026</p>
                </div>
            </header>

            <div className="container">
                <div className="legal-content glass-panel">
                    <section>
                        <p>
                            Circles is built for respectful, supportive wellbeing conversations. These rules apply to all users,
                            circles, chats, huddles, and profile interactions.
                        </p>
                    </section>

                    <section>
                        <h2>1. Respect and safety</h2>
                        <ul>
                            <li>No harassment, bullying, threats, or hate speech.</li>
                            <li>No explicit sexual, violent, exploitative, or illegal content.</li>
                            <li>No impersonation, fraud, or misleading identity claims.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>2. Privacy and consent</h2>
                        <ul>
                            <li>Do not share private personal information without consent.</li>
                            <li>Do not post private conversations or media from others without permission.</li>
                            <li>Use report and block tools if someone violates your privacy or boundaries.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>3. Spam and abuse</h2>
                        <ul>
                            <li>No spam, scams, malicious links, or repetitive unsolicited messaging.</li>
                            <li>No manipulation of circle systems, engagement abuse, or coordinated harassment.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>4. Enforcement</h2>
                        <p>
                            Reports are reviewed by admins/moderators and may result in action including warning, content removal,
                            role restriction, temporary suspension, or permanent ban depending on severity and repeat behavior.
                        </p>
                    </section>

                    <section>
                        <h2>5. Appeals and support</h2>
                        <p>
                            If you believe an enforcement action is incorrect, contact us at{' '}
                            <a href="mailto:support@empylo.com">support@empylo.com</a> with relevant context.
                        </p>
                    </section>
                </div>
            </div>

            <style>{`
                .legal-page {
                    padding-top: 80px;
                    background-color: var(--color-bg-alt);
                    min-height: 100vh;
                }

                .legal-header {
                    padding: 80px 0;
                    background: white;
                    text-align: center;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }

                .legal-header h1 {
                    font-size: 3rem;
                    font-weight: 800;
                    color: var(--color-secondary);
                    margin-bottom: 16px;
                }

                .last-updated {
                    color: var(--color-text-light);
                    font-size: 1.1rem;
                }

                .legal-content {
                    margin: -40px auto 80px;
                    position: relative;
                    background: white;
                    border-radius: 20px;
                    padding: 60px;
                    max-width: 900px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                }

                .legal-content section {
                    margin-bottom: 32px;
                }

                .legal-content h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--color-secondary);
                    margin-bottom: 18px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid var(--color-primary-bg);
                }

                .legal-content p {
                    margin-bottom: 14px;
                    line-height: 1.8;
                    color: var(--color-text);
                }

                .legal-content ul {
                    margin-bottom: 16px;
                    padding-left: 20px;
                }

                .legal-content ul li {
                    margin-bottom: 10px;
                    line-height: 1.6;
                    color: var(--color-text);
                }

                .legal-content a {
                    color: var(--color-primary);
                    text-decoration: underline;
                }

                @media (max-width: 768px) {
                    .legal-header h1 {
                        font-size: 2.25rem;
                    }

                    .legal-content {
                        padding: 30px;
                        margin-top: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CommunityGuidelines;
