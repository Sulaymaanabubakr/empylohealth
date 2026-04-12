import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import logo from '../assets/logo_white.png';

const circlesSiteUrl = import.meta.env.VITE_CIRCLES_SITE_URL || 'http://localhost:5174';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand-column">
          <Link to="/" className="footer-logo">
            <img src={logo} alt="Empylo" style={{ height: '32px' }} />
            <span className="logo-text-white">Empylo</span>
          </Link>
          <p className="brand-tagline">
            Human-centred mental wellbeing for individuals and organisations, anchored by Circles Health App and tailored programmes.
          </p>
        </div>

        <div className="footer-links-group">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/circles">Circles</Link></li>
            <li><Link to="/organisations">Organisations</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Connect</h4>
          <ul>
            <li><Link to="/contact">Contact</Link></li>
            <li>
              <a href={circlesSiteUrl} target="_blank" rel="noopener noreferrer">
                Circles Health App
              </a>
            </li>
            <li className="contact-item"><Mail size={16} /> hello@empylo.com</li>
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
          gap: 48px;
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
        }

        .brand-tagline {
          color: #CBD5E1;
          line-height: 1.7;
          max-width: 360px;
        }

        .footer h4 {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
        }

        .footer ul li {
          margin-bottom: 0.75rem;
          color: #CBD5E1;
        }

        .footer ul li a:hover {
          color: var(--color-primary-light);
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

        @media (max-width: 900px) {
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
