const DeleteAccount = () => {
    return (
        <div className="legal-page">
            <div className="container">
                <h1>Request Account Deletion</h1>
                <p className="last-updated">We respect your right to be forgotten.</p>

                <div className="legal-content">
                    <p>
                        If you wish to delete your account and all associated data from the Circles Health App,
                        you can do so directly within the app settings or by submitting a request here.
                    </p>

                    <div className="deletion-steps glass-panel">
                        <h3>Option 1: In-App Deletion</h3>
                        <ol>
                            <li>Open the Circles Health App.</li>
                            <li>Go to <strong>Profile</strong> {'>'} <strong>Account</strong> {'>'} <strong>Security</strong>.</li>
                            <li>Tap <strong>Delete Account</strong> and confirm.</li>
                        </ol>
                    </div>

                    <div className="deletion-steps glass-panel mt-8">
                        <h3>Option 2: Manual Request</h3>
                        <p>
                            If you cannot access the app, please email our support team with the subject line
                            "Account Deletion Request". Please verify your identity by sending the email from
                            the address associated with your account.
                        </p>
                        <a href="mailto:support@empylo.com" className="btn btn-primary">Email Support</a>
                    </div>

                    <div className="warning-box">
                        <p><strong>Warning:</strong> Deleting your account is permanent. Your profile and account access are removed immediately. Some records may be retained for legal/safety obligations, and message history may be anonymized instead of fully deleted where required for integrity and moderation.</p>
                    </div>
                </div>
            </div>
            <style>{`
                .legal-page { padding: 100px 0 80px; }
                .legal-page h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 8px; }
                .last-updated { color: #64748B; margin-bottom: 40px; }
                .legal-content { max-width: 800px; }
                .legal-content p { line-height: 1.7; color: #475569; margin-bottom: 16px; }

                .deletion-steps {
                    padding: 24px;
                    border-radius: 16px;
                    background: #F8FAFC;
                    margin-bottom: 24px;
                }

                .deletion-steps h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                }

                ol { list-style-position: inside; margin-bottom: 16px; }
                li { margin-bottom: 8px; color: #475569; }

                .warning-box {
                    background: #FEF2F2;
                    border: 1px solid #FECACA;
                    color: #B91C1C;
                    padding: 16px;
                    border-radius: 12px;
                    margin-top: 32px;
                }

                @media (max-width: 768px) {
                    .legal-page h1 { text-align: center; font-size: 2rem; }
                    .last-updated { text-align: center; }
                    .legal-content { text-align: center; }
                    .deletion-steps { text-align: center; }
                    ol { text-align: left; display: inline-block; padding-left: 20px; }
                    .warning-box { text-align: center; }
                }
        `}</style>
        </div>
    );
};
export default DeleteAccount;
