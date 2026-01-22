import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page">
            <div className="container">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last Updated: January 1, 2026</p>

                <section>
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Circles Health ("Empylo", "we", "our", or "us"). We are committed to protecting your privacy
                        and ensuring the security of your personal information. This Privacy Policy explains how we collect, use,
                        disclose, and safeguard your information when you use our mobile application ("Circles App") and website.
                    </p>
                </section>

                <section>
                    <h2>2. Information We Collect</h2>
                    <h3>2.1 Personal Information</h3>
                    <p>
                        We may collect personal information that you voluntarily provide to us when you register for the App,
                        expressed interest in obtaining information about us or our products and services, when you participate
                        in activities on the App (such as posting in forums or entering competitions, contests or giveaways)
                        or otherwise when you contact us.
                    </p>
                    <h3>2.2 Health and Mood Data</h3>
                    <p>
                        The App allows you to track your mood and wellness. This data is stored securely and is used to provide
                        you with personal insights. We do not sell your health data to third parties.
                    </p>
                </section>

                <section>
                    <h2>3. How We Use Your Information</h2>
                    <p>
                        We use the information we collect or receive:
                    </p>
                    <ul>
                        <li>To facilitate account creation and logon process.</li>
                        <li>To send you administrative information.</li>
                        <li>To fulfill and manage your orders.</li>
                        <li>To post testimonials.</li>
                        <li>To deliver and facilitate delivery of services to the user.</li>
                        <li>To respond to user inquiries/offer support to users.</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Data Security</h2>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information.
                        While we have taken reasonable steps to secure the personal information you provide to us, please be aware
                        that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission
                        can be guaranteed against any interception or other type of misuse.
                    </p>
                </section>

                <section>
                    <h2>5. Contact Us</h2>
                    <p>
                        If you have questions or comments about this policy, you may email us at support@empylo.com.
                    </p>
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
          font-size: 0.9rem;
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
        
        .legal-page h3 {
          font-size: 1.1rem;
          color: #334155;
          margin: 24px 0 12px;
          font-weight: 600;
        }
        
        .legal-page p {
          color: #475569;
          line-height: 1.7;
          margin-bottom: 16px;
        }
        
        .legal-page ul {
          list-style-type: disc;
          padding-left: 24px;
          margin-bottom: 16px;
        }
        
        .legal-page li {
          color: #475569;
          margin-bottom: 8px;
          line-height: 1.6;
        }
      `}</style>
        </div>
    );
};

export default PrivacyPolicy;
