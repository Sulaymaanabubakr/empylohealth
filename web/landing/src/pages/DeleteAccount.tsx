import React from 'react';

const DeleteAccount = () => {
    return (
        <div className="legal-page">
            <div className="container">
                <h1>Request Account Deletion</h1>
                <p className="last-updated">We respect your right to be forgotten.</p>

                <section>
                    <h2>How to Delete Your Account</h2>
                    <p>
                        You can delete your account and all associated data directly within the Circles App.
                    </p>
                    <ol>
                        <li>Open the <strong>Circles App</strong> on your mobile device.</li>
                        <li>Go to <strong>Settings</strong> (accessible from your Profile).</li>
                        <li>Select <strong>Account Settings</strong>.</li>
                        <li>Tap on <strong>Delete Account</strong> at the bottom of the screen.</li>
                        <li>Confirm your choice. This action is irreversible.</li>
                    </ol>
                </section>

                <section>
                    <h2>Manual Request</h2>
                    <p>
                        If you no longer have access to the app, you may request account deletion by emailing our support team.
                        Please include your registered email address so we can verify your identity.
                    </p>
                    <a href="mailto:support@empylo.com" className="btn btn-primary">Email Support to Delete Account</a>
                </section>

                <section>
                    <h2>What Happens to Your Data?</h2>
                    <p>
                        When you delete your account:
                    </p>
                    <ul>
                        <li>Your profile and personal information will be permanently removed.</li>
                        <li>Your mood logs and private journal entries will be deleted.</li>
                        <li>Your community posts may remain but will be anonymized.</li>
                    </ul>
                </section>
            </div>

            <style>{`
        .legal-page {
          padding: 120px 0;
          background-color: #F8FAFC; 
          min-height: 80vh;
        }
        
        .legal-page h1 {
          font-size: 2.5rem;
          color: #0F172A;
          margin-bottom: 16px;
          font-weight: 800;
        }
        
        .last-updated {
          color: #64748B;
          margin-bottom: 48px;
          font-size: 1.1rem;
        }
        
        .legal-page section {
          margin-bottom: 40px;
          background: white;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        
        .legal-page h2 {
          font-size: 1.5rem;
          color: #1E293B;
          margin-bottom: 16px;
          font-weight: 700;
        }
        
        .legal-page p {
          color: #475569;
          line-height: 1.7;
          margin-bottom: 16px;
        }
        
        .legal-page ol, .legal-page ul {
          padding-left: 24px;
          margin-bottom: 24px;
          color: #475569;
        }
        
        .legal-page li {
          margin-bottom: 12px;
          line-height: 1.6;
        }
        
        .btn {
            display: inline-block;
            margin-top: 16px;
        }
      `}</style>
        </div>
    );
};

export default DeleteAccount;
