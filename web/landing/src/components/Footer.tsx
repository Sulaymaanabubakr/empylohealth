import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';
import logo from '../assets/logo_white.png';

const Footer = () => {
    // Fallback if white logo doesn't exist, we can use CSS filter

    return (
        <footer className="footer">
            <div className="container footer-content">
                <div className="footer-brand-column">
                    <Link to="/" className="footer-logo">
                        <img src={logo} alt="Empylo" style={{ height: '32px' }} />
                        <span className="logo-text-white">Empylo</span>
                    </Link>
                    <p className="brand-tagline">
                        Empowering mental wellness through connection and technology.
                        Join the circle today.
                    </p>
                    <div className="social-icons">
                        <a href="#" className="social-icon"><Facebook size={20} /></a>
                        <a href="#" className="social-icon"><Twitter size={20} /></a>
                        <a href="#" className="social-icon"><Instagram size={20} /></a>
                        <a href="#" className="social-icon"><Linkedin size={20} /></a>
                    </div>
                </div>

                <div className="footer-links-group">
                    <h4>Company</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/features">Features</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </div>

                <div className="footer-links-group">
                    <h4>Legal</h4>
                    <ul>
                        <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                        <li><Link to="/terms">Terms of Service</Link></li>
                        <li><Link to="/delete-account">Delete Account</Link></li>
                    </ul>
                </div>

                <div className="footer-links-group">
                    <h4>Support</h4>
                    <ul>
                        <li><Link to="/contact">Help Center</Link></li>
                        <li className="contact-item"><Mail size={16} /> support@empylo.com</li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container copyright">
                    <p>© {new Date().getFullYear()} Empylo Health. All rights reserved.</p>
                </div>
            </div>

            <style>{`
                .footer {
                    background-color: var(--color-secondary);
                    color: white;
                    padding: 80px 0 0;
                }

                .footer-content {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 60px;
                    padding-bottom: 60px;
                }

                .footer-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 1.5rem;
                    text-decoration: none;
                }
                
                .logo-text-white {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: white;
                    letter-spacing: -0.5px;
                }

                .brand-tagline {
                    color: #94A3B8;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                    max-width: 300px;
                }

                .social-icons {
                    display: flex;
                    gap: 1rem;
                }

                .social-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .social-icon:hover {
                    background: var(--color-primary);
                    transform: translateY(-2px);
                }

                .footer h4 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: white;
                }

                .footer ul li {
                    margin-bottom: 0.75rem;
                    color: #CBD5E1;
                }

                .footer ul li a {
                    transition: color 0.2s;
                }

                .footer ul li a:hover {
                    color: var(--color-primary);
                }
                
                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .footer-bottom {
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding: 2rem 0;
                    text-align: center;
                    color: #64748B;
                    font-size: 0.9rem;
                }

                @media (max-width: 1024px) {
                    .footer-content {
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                    }
                }

                @media (max-width: 640px) {
                    .footer-content {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }
                    .brand-tagline { margin: 0 auto 2rem; }
                    .social-icons { justify-content: center; }
                    .contact-item { justify-content: center; }
                }
            `}</style>
        </footer >
    );
};

export default Footer;
