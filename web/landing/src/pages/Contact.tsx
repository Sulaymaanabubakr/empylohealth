import { Mail, MapPin, Send } from 'lucide-react';

const Contact = () => {
    return (
        <div className="contact-page">
            <div className="contact-bg"></div>
            <div className="container contact-wrapper">
                <div className="contact-info">
                    <h1>Get in Touch</h1>
                    <p className="contact-lead">
                        Have questions about the Empylo app? Our team is here to help you.
                    </p>

                    <div className="contact-details">
                        <div className="detail-item">
                            <div className="icon-box"><Mail /></div>
                            <div>
                                <h3>Email Us</h3>
                                <p>support@empylo.com</p>
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="icon-box"><MapPin /></div>
                            <div>
                                <h3>Office</h3>
                                <p>London, United Kingdom</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="contact-form-card glass-panel">
                    <form>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" placeholder="Jane Doe" className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" placeholder="jane@example.com" className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea rows={5} placeholder="How can we help?" className="form-input"></textarea>
                        </div>
                        <button type="button" className="btn btn-primary btn-block">
                            Send Message <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                .contact-page {
                    padding: 160px 0 100px;
                    min-height: 100vh;
                    position: relative;
                }
                
                .contact-bg {
                    position: absolute;
                    top: 0;
                    right: 0;
                    left: 0;
                    height: 50%;
                    background: var(--color-primary-bg);
                    z-index: -1;
                    border-bottom-left-radius: 100px;
                }
                
                .contact-wrapper {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 80px;
                    align-items: flex-start;
                }
                
                .contact-info h1 {
                    font-size: 3rem;
                    font-weight: 800;
                    margin-bottom: 24px;
                    color: var(--color-secondary);
                }
                
                .contact-lead {
                    font-size: 1.1rem;
                    color: var(--color-text-light);
                    margin-bottom: 48px;
                    line-height: 1.6;
                }
                
                .contact-details {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }
                
                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                
                .icon-box {
                    width: 50px;
                    height: 50px;
                    background: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-primary);
                    box-shadow: var(--shadow-sm);
                }
                
                .detail-item h3 {
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                
                .contact-form-card {
                    padding: 40px;
                    border-radius: 24px;
                    background: white;
                    box-shadow: var(--shadow-xl);
                }
                
                .form-group {
                    margin-bottom: 24px;
                }
                
                .form-group label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                }
                
                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #E2E8F0;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                }
                
                .btn-block {
                    width: 100%;
                    gap: 8px;
                }
                
                @media (max-width: 768px) {
                    .contact-wrapper { grid-template-columns: 1fr; gap: 40px; }
                    .contact-bg { height: 100%; border-bottom-left-radius: 0; }
                }
            `}</style>
        </div>
    );
};

export default Contact;
