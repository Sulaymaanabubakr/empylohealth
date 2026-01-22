import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo_turquoise.png';

// Make sure logo path matches where you copied it. 
// If it was in src/assets/logo.png, then '../assets/logo.png' is correct from src/components

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Empylo" className="logo-img" />
          {/* Text removed as per request */}
        </Link>

        {/* Desktop Menu */}
        {/* Center Navigation */}
        <div className="navbar-center hidden-mobile">
          <div className="nav-links">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {link.name}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right Side Button */}
        <div className="navbar-right hidden-mobile">
          <Link to="/download" className="btn btn-primary">Download App</Link>
        </div>

        {/* Mobile Toggle */}
        <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="navbar-mobile">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className="mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </NavLink>
            ))}
            <Link to="/download" className="btn btn-primary mobile-btn" onClick={() => setIsOpen(false)}>
              Download App
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          background: transparent;
          padding: 1.25rem 0;
        }

        .navbar.scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: var(--shadow-sm);
          padding: 1rem 0;
        }

        .navbar-container {
          display: flex;
          align-items: center;
          /* Logo on left, Button on right, Links centered via auto margins */
          justify-content: space-between; 
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          /* Removed text, just logo */
        }

        .logo-img {
          height: 36px; /* Reduced from 48px */
          width: auto;
        }

        /* Desktop */
        /* Desktop Layout */
        .hidden-mobile {
            display: block;
        }

        .navbar-center {
             position: absolute;
             left: 50%;
             transform: translateX(-50%);
        }
        
        .navbar-right {
            display: flex;
            align-items: center;
        }

        .nav-links {
          display: flex;
          gap: 2.5rem;
        }

        .nav-link {
          font-weight: 500;
          color: var(--color-text-light);
          position: relative;
          font-size: 1rem;
        }

        .nav-link:hover, .nav-link.active {
          color: var(--color-primary);
        }
        
        .nav-link.active::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            background: var(--color-primary);
            border-radius: 50%;
        }

        .navbar-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text);
        }

        /* Mobile */
        .navbar-mobile {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: var(--shadow-lg);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .mobile-link {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-text);
          padding: 0.5rem 0;
        }
        
        .mobile-link.active {
            color: var(--color-primary);
        }

        .mobile-btn {
            text-align: center;
            margin-top: 0.5rem;
        }

        @media (max-width: 900px) {
           .logo-img { height: 36px; }
        }

        @media (max-width: 768px) {
          .hidden-mobile {
            display: none;
          }
          .navbar-toggle {
            display: block;
          }
          .navbar-logo {
             margin-right: auto;
          }
        }
      `}</style>
    </nav >
  );
};

export default Navbar;
