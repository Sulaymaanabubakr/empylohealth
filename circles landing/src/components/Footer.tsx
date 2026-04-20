import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import logo from '../assets/logo_white.png';

const Footer = () => {
  const empyloSiteUrl = import.meta.env.VITE_EMPYLO_SITE_URL || 'http://localhost:5173';

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand-column">
          <Link to="/" className="footer-logo">
            <img src={logo} alt="Circles Health App by Empylo" style={{ height: '32px' }} />
            <span className="logo-text-white">Circles Health App</span>
          </Link>
          <p className="brand-tagline">
            Circles Health App by Empylo helps people reflect, connect, and build supportive wellbeing habits.
          </p>
        </div>

        <div className="footer-links-group">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/features">Benefits</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Legal & Brand</h4>
          <ul>
            <li><Link to="/legal/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/legal/terms">Terms of Service</Link></li>
            <li><a href={empyloSiteUrl} target="_blank" rel="noopener noreferrer">Empylo</a></li>
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
          grid-template-columns: 2fr 1fr 1fr;
          gap: 60px;
          padding-bottom: 60px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.5rem;
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
          max-width: 320px;
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
          .footer-logo,
          .contact-item {
            justify-content: center;
          }
          .brand-tagline {
            margin: 0 auto;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
