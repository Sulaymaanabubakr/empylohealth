import React from 'react';

const Terms = () => {
    return (
        <div className="legal-page">
            <div className="container">
                <h1>Terms of Service</h1>
                <p className="last-updated">Last Updated: January 1, 2026</p>

                <section>
                    <h2>1. Agreement to Terms</h2>
                    <p>
                        These Terms of Service constitute a legally binding agreement made between you, whether personally or on
                        behalf of an entity (“you”) and Empylo ("we," “us” or “our”), concerning your access to and use of the
                        Circles Health mobile application as well as any other media form, media channel, mobile website or mobile
                        application related, linked, or otherwise connected thereto (collectively, the “Site”).
                    </p>
                </section>

                <section>
                    <h2>2. Intellectual Property Rights</h2>
                    <p>
                        Unless otherwise indicated, the Site and the App are our proprietary property and all source code, databases,
                        functionality, software, website designs, audio, video, text, photographs, and graphics on the Site
                        (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”)
                        are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                    </p>
                </section>

                <section>
                    <h2>3. User Representations</h2>
                    <p>
                        By using the Site, you represent and warrant that: (1) all registration information you submit will be true,
                        accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update
                        such registration information as necessary; (3) you have the legal capacity and you agree to comply with
                        these Terms of Service.
                    </p>
                </section>

                <section>
                    <h2>4. Community Guidelines</h2>
                    <p>
                        Circles Health is a safe space. We do not tolerate harassment, hate speech, or any form of abuse.
                        We reserve the right to suspend or terminate accounts that violate our community standards.
                    </p>
                </section>

                <section>
                    <h2>5. Contact Us</h2>
                    <p>
                        In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site,
                        please contact us at support@empylo.com.
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
        
        .legal-page p {
          color: #475569;
          line-height: 1.7;
          margin-bottom: 16px;
        }
      `}</style>
        </div>
    );
};

export default Terms;
