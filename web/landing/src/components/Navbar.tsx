import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo_turquoise.png';

// Make sure logo path matches where you copied it. 
// If it was in src/assets/logo.png, then '../assets/logo.png' is correct from src/components

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const getLinkClass = (path: string, isMobile = false) => {
    const baseClass = isMobile ? 'mobile-link' : 'nav-link';
    let isActive = false;

    if (path === '/') {
      isActive = location.pathname === '/' && location.hash === '';
    } else if (path === '/#features') {
      isActive = location.hash === '#features';
    } else {
      isActive = location.pathname === path;
    }

    return `${baseClass} ${isActive ? 'active' : ''}`;
  };

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
              <Link
                key={link.name}
                to={link.path}
                className={getLinkClass(link.path)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Side Button */}
        <div className="navbar-right hidden-mobile">
          <Link to="/download" className="btn btn-primary">Download App</Link>
        </div>

        {/* Mobile Toggle */}
        <div className="mobile-menu-wrapper" ref={menuRef}>
          <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Menu Card */}
          {isOpen && (
            <div className="navbar-mobile card-style">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={getLinkClass(link.path, true)}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link to="/download" className="btn btn-primary mobile-btn" onClick={() => setIsOpen(false)}>
                Download App
              </Link>
            </div>
          )}
        </div>
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
          position: relative; /* Context for mobile menu absolute pos */ 
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          /* Removed text, just logo */
        }

        .logo-img {
          height: 28px; /* Reduced from 36px */
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
          text-decoration: none; /* Ensure no underline default */
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
          /* Default hidden logic handled by React conditional */
        }

        .card-style {
            position: absolute;
            top: 150%; /* Just below the toggle button */
            right: 0;
            background: white;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-radius: 20px;
            border: 1px solid rgba(0,0,0,0.05);
            min-width: 220px;
            text-align: center;
            z-index: 1001;
            /* Animation */
            animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .mobile-link {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-text);
          padding: 0.5rem 0;
          display: block;
          text-decoration: none;
        }
        
        .mobile-link.active {
            color: var(--color-primary);
        }

        .mobile-btn {
            text-align: center;
            margin-top: 0.5rem;
            width: 100%;
        }

        /* Mobile Menu Wrapper - Hidden on Desktop */
        .mobile-menu-wrapper {
            display: none;
        }

        @media (max-width: 900px) {
           .logo-img { height: 24px; }
        }

        @media (max-width: 768px) {
          .hidden-mobile {
            display: none;
          }
          .mobile-menu-wrapper {
            display: block;
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
