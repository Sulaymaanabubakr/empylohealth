import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo-link">
          <img src={logo} alt="Empylo Logo" className="logo-img" />
        </Link>

        {/* Mobile Menu Toggle */}
        <div className="mobile-toggle" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Desktop Menu */}
        <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={() => setIsOpen(false)}>Home</Link></li>
          <li><Link to="/features" onClick={() => setIsOpen(false)}>Features</Link></li>
          <li><Link to="/pricing" onClick={() => setIsOpen(false)}>Pricing</Link></li>
          <li><Link to="/contact" onClick={() => setIsOpen(false)}>Contact Us</Link></li>

          {/* Mobile Only Button in Menu */}
          <li className="mobile-btn">
            <button className="btn btn-primary">Get Started</button>
          </li>
        </ul>

        {/* Desktop Button */}
        <button className="btn btn-primary desktop-btn">Get Started</button>
      </div>

      <style>{`
        .navbar {
          height: 80px; /* Reduced height */
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          
          /* Glass Effect - White */
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        
        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .logo-img {
          height: 40px; /* Adjusted size relative to new height */
          width: auto;
          display: block;
          /* Filter to match Primary Turquoise #00a99d */
          filter: invert(48%) sepia(89%) saturate(2476%) hue-rotate(130deg) brightness(92%) contrast(101%);
        }

        .nav-links {
          display: flex;
          gap: 50px;
        }

        .nav-links a {
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-secondary);
          font-size: 1rem;
          transition: color 0.2s;
          opacity: 0.8;
        }

        .nav-links a:hover {
          color: var(--color-primary);
          opacity: 1;
        }

        .mobile-toggle {
            display: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--color-primary);
        }
        
        .mobile-btn {
            display: none;
        }
        
        .desktop-btn {
            display: inline-flex;
        }

        @media (max-width: 1024px) {
           .logo-img {
               height: 32px; /* Reduced for Tablet */
           }
        }

        @media (max-width: 960px) {
          .mobile-toggle {
              display: block;
              z-index: 1001; /* Above overlay */
          }
          
          .desktop-btn {
              display: none;
          }
          
          .mobile-btn {
              display: block;
              margin-top: 20px;
          }

          .nav-links {
            /* Full screen overlay for mobile */
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: white;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 40px;
            transform: translateY(-100%);
            transition: transform 0.4s ease-in-out;
            z-index: 999;
          }
          
          .nav-links.active {
              transform: translateY(0);
          }
          
          .nav-links a {
              font-size: 1.5rem;
              color: var(--color-secondary);
          }
        }
        
        @media (max-width: 768px) {
            .logo-img {
                height: 28px; /* Further reduced for Mobile */
            }
            .navbar {
                height: 64px; /* Slightly tighter navbar height on mobile */
            }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
