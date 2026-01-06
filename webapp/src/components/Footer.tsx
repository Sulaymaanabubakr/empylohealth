import { FaLinkedinIn, FaInstagram, FaFacebookF, FaTwitter } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="footer-logo-text">
            <img src={logo} alt="Empylo" className="footer-logo-img" />
          </div>
          <p>© Copyright Empylo 2026. All rights reserved</p>
        </div>

        <div className="footer-links-group">
          <h4>Company</h4>
          <ul>
            <li>Home</li>
            <li>About Us</li>
            <li>Services</li>
            <li>Contact Us</li>
            <li>Careers</li>
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
            <span className="social-icon"><FaTwitter /></span> {/* Placeholder for X */}
            <span className="social-icon"><FaFacebookF /></span>
          </div>
        </div>
      </div>

      <div className="footer-bottom container">
        <div className="legal-links">
          <span>Privacy Policy</span> | <span>Terms of Use</span> | <span>Data Processing Agreement</span>
        </div>
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
          
          .footer-brand p {
            font-size: 1rem;
            opacity: 0.9;
            margin-top: auto; 
            font-weight: 600; /* Semi-Bold/Bold */
            color: rgba(255,255,255,0.8);
          }
          
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
              justify-content: center;
              font-size: 1rem;
              opacity: 1;
              font-weight: 600; /* Bold */
              margin-top: 20px;
              color: rgba(255,255,255,0.8);
          }
          
          .legal-links span {
              margin: 0 8px;
              cursor: pointer;
          }
          
          @media (max-width: 960px) {
            .footer-content {
              grid-template-columns: 1fr 1fr;
            }
          }
          @media (max-width: 600px) {
            .footer-content {
              grid-template-columns: 1fr;
            }
            .footer-bottom {
                justify-content: center;
                margin-top: 20px;
            }
          }
        `}</style>
    </footer>
  );
};

export default Footer;
