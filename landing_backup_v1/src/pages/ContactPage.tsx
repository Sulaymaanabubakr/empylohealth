import React from 'react';
import Contact from '../components/Contact';
import { FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const ContactPage = () => {
    return (
        <div className="contact-page">
            {/* Re-using the Contact Component which has the form */}
            <Contact />

            <section className="contact-details container">
                <div className="details-grid">
                    <div className="detail-item">
                        <div className="icon"><FaEnvelope /></div>
                        <h3>Email Support</h3>
                        <p>For general inquiries and support:</p>
                        <a href="mailto:support@empylo.com">support@empylo.com</a>
                    </div>
                    <div className="detail-item">
                        <div className="icon"><FaMapMarkerAlt /></div>
                        <h3>Office</h3>
                        <p>Global Headquarters</p>
                        <span>London, United Kingdom</span>
                    </div>
                </div>
            </section>

            <style>{`
        .contact-page {
          background: #F8FAFC;
        }
        
        .contact-details {
          padding-bottom: 100px;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .detail-item {
          background: white;
          padding: 32px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        
        .detail-item .icon {
          font-size: 2rem;
          color: var(--color-primary);
          margin-bottom: 16px;
        }
        
        .detail-item h3 {
          font-size: 1.25rem;
          margin-bottom: 8px;
          color: #1E293B;
          font-weight: 700;
        }
        
        .detail-item p {
            color: #64748B;
            margin-bottom: 4px;
        }
        
        .detail-item a, .detail-item span {
            font-weight: 600;
            color: #0F172A;
            text-decoration: none;
        }

        @media(max-width: 768px) {
            .details-grid {
                grid-template-columns: 1fr;
            }
        }
      `}</style>
        </div>
    );
};

export default ContactPage;
