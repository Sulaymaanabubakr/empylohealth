import { FaLinkedinIn, FaInstagram, FaFacebookF, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="footer-logo-text">
            <img src={logo} alt="Empylo" className="footer-logo-img" />
          </div>
          {/* Copyright moved to bottom */}
        </div>

        <div className="footer-links-group">
          <h4>Company</h4>
          <ul>
            <li><Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link></li>
            <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About Us</Link></li>
            <li><Link to="/features" style={{ color: 'inherit', textDecoration: 'none' }}>Services</Link></li>
            <li><Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Us</Link></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Products</h4>
          <ul>
            <li>Circles Health App</li>
            <li>Circles Health App Client</li>
            <li>How to Use</li>
            <li>Pricing</li>
            <li>FAQs</li>
          </ul>
        </div>

        <div className="footer-socials">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <span className="social-icon"><FaLinkedinIn /></span>
            <span className="social-icon"><FaInstagram /></span>
            <span className="social-icon"><FaTwitter /></span>
            <span className="social-icon"><FaFacebookF /></span>
          </div>
        </div>
      </div>

      <div className="footer-bottom container">
        <div className="legal-links">
          <span><Link to="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link></span>
          <span><Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Use</Link></span>
          <span><Link to="/delete-account" style={{ color: 'inherit', textDecoration: 'none' }}>Delete Account</Link></span>
        </div>
        <p className="copyright-text">© Copyright Empylo 2026. All rights reserved</p>
      </div>

      <style>{`
          .footer {
            background-color: var(--color-primary);
            color: #fff;
            padding: 80px 0 40px;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
          
          .footer-logo-text {
             font-size: 1.5rem;
             font-weight: 700;
             margin-bottom: 20px;
             display: flex;
             align-items: center;
             justify-content: center;
             gap: 10px;
          }
          
          .footer-logo-img {
              height: 36px;
              width: auto;
              filter: brightness(0) invert(1); /* Make logo white */
          }
          
          .footer-content {
            display: grid;
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
            gap: 40px;
            margin-bottom: 60px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 40px;
            text-align: center;
          }
          
          .footer h4 {
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 1;
            margin-bottom: 24px;
            font-weight: 800;
            color: #fff; /* White Heading */
          }
          
          .footer ul li {
            margin-bottom: 14px;
            font-size: 1.1rem; /* Slightly larger */
            cursor: pointer;
            opacity: 1;
            transition: all 0.2s;
            font-weight: 700; /* Bold */
            color: rgba(255,255,255,0.9);
          }
          
          .footer ul li:hover {
            transform: translateX(4px);
            color: #fff;
          }
          
          /* Socials styling unchanged */
          
          .social-icons {
              display: flex;
              gap: 16px;
              justify-content: center;
          }
          
          .social-icon {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: rgba(255,255,255,0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2rem;
              cursor: pointer;
              transition: all 0.3s;
              color: white;
          }
          
          .social-icon:hover {
              transform: translateY(-4px);
              background: white;
              color: var(--color-primary);
          }
  
          .footer-bottom {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 20px;
              font-size: 1rem;
              opacity: 1;
              font-weight: 600; /* Bold */
              margin-top: 20px;
              color: rgba(255,255,255,0.8);
          }
          
          .legal-links {
              display: flex;
              align-items: center;
              justify-content: center;
              flex-wrap: wrap; /* Allow wrapping on small screens */
              gap: 20px;
          }
          
          .legal-links span {
              cursor: pointer;
              position: relative;
          }

          /* Default Pipes for Desktop/Tablet */
          .legal-links span:not(:last-child)::after {
              content: '|';
              position: absolute;
              right: -14px;
              color: rgba(255,255,255,0.4);
              pointer-events: none;
          }
          
          .copyright-text {
              opacity: 0.7;
              font-weight: 500;
              text-align: center;
          }

          /* Tablet adjustments */
          @media (max-width: 1024px) {
            .footer-content {
               /* Slightly condensed grid for tablet, but keep structure */
               grid-template-columns: 1.5fr 1fr 1fr 1fr; 
               text-align: left;
               gap: 20px;
            }
            .footer-brand {
                grid-column: 1; /* Brand in first column */
                margin-bottom: 0;
            }
            .footer-links-group {
                text-align: left;
                display: block;
                align-items: flex-start;
            }
            .footer-socials {
                grid-column: 4; /* Socials in last column */
                margin-top: 0;
            }
             .footer-logo-text {
                 justify-content: flex-start;
             }
             .social-icons {
                 justify-content: flex-start;
             }
          }
          
          /* Intermediate breakpoint for smaller tablets */
          @media (max-width: 768px) {
             .footer-content {
                grid-template-columns: 1fr 1fr; /* 2x2 grid */
                text-align: left;
                gap: 40px;
             }
             .footer-brand { grid-column: 1 / -1; }
             .footer-socials { grid-column: 1 / -1; }
             .footer-logo-text { justify-content: flex-start; } 
          }


          @media (max-width: 600px) {
            .footer-content {
              grid-template-columns: 1fr;
              text-align: center;
              gap: 32px; /* Slightly tighter gap */
            }
            .footer-brand, .footer-socials {
                grid-column: auto;
            }
             .footer-logo-text { justify-content: center; } 
             .social-icons { justify-content: center; }
             
            .footer-links-group {
                text-align: center;
                align-items: center;
            }
            
            /* Mobile Font Size Reductions */
            .footer h4 {
                font-size: 1rem; /* Smaller headings */
                margin-bottom: 16px;
            }
            .footer ul li {
                font-size: 0.95rem; /* Smaller links */
                margin-bottom: 12px;
            }
            .footer-brand p {
                font-size: 0.9rem;
            }
            
            /* Clean Mobile Stack for Legal Links */
            .legal-links {
                flex-direction: column;
                gap: 10px;
            }
            .legal-links span {
                display: block;
                margin: 0;
            }
            /* Hide pipes on mobile stack */
            .legal-links span:not(:last-child)::after {
                display: none; 
            }
            
            .footer-bottom {
                gap: 20px;
                font-size: 0.85rem; /* Smaller legal text */
                margin-top: 10px;
            }
          }
        `}</style>
    </footer>
  );
};

export default Footer;
