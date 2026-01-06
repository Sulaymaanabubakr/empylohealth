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
            background-color: #F1F5F9; /* Very light slate */
            color: #334155;
            padding: 80px 0 40px;
            border-top: 1px solid rgba(0,0,0,0.05);
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
              /* Filter Black -> Teal #0F766E approximation */
              filter: invert(33%) sepia(90%) saturate(634%) hue-rotate(129deg) brightness(91%) contrast(96%);
          }
          
          .footer-content {
            display: grid;
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
            gap: 40px;
            margin-bottom: 60px;
            border-bottom: 1px solid rgba(0,0,0,0.1); /* Darker border for light bg */
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
            color: #0F766E; /* Teal Heading */
          }
          
          .footer ul li {
            margin-bottom: 14px;
            font-size: 1.05rem;
            cursor: pointer;
            opacity: 1;
            transition: all 0.2s;
            font-weight: 500;
            color: #475569; /* Slate 600 */
          }
          
          .footer ul li:hover {
            transform: translateX(4px);
            color: #0F766E;
          }
          
          .footer-brand p {
            font-size: 0.95rem;
            opacity: 0.8;
            margin-top: auto; 
            font-weight: 500;
            color: #64748B;
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
              background: #E2E8F0; /* Light slate bg */
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2rem;
              cursor: pointer;
              transition: all 0.3s;
              color: #0F766E; /* Teal icon */
          }
          
          .social-icon:hover {
              transform: translateY(-4px);
              background: #0F766E;
              color: white;
          }
  
          .footer-bottom {
              display: flex;
              justify-content: center;
              font-size: 0.95rem;
              opacity: 0.9;
              font-weight: 500;
              margin-top: 20px;
              color: #64748B;
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
