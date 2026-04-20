import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo_turquoise.png';

const circlesSiteUrl = import.meta.env.VITE_CIRCLES_SITE_URL || 'http://localhost:5174';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Circles', path: '/circles' },
  { name: 'Organisations', path: '/organisations' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Contact', path: '/contact' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getLinkClass = (path: string, isMobile = false) => {
    const baseClass = isMobile ? 'mobile-link' : 'nav-link';
    return `${baseClass} ${location.pathname === path ? 'active' : ''}`;
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Empylo" className="logo-img" />
        </Link>

        <div className="navbar-center hidden-mobile">
          <div className="nav-links">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.path} className={getLinkClass(link.path)}>
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="navbar-right hidden-mobile">
          <a href={circlesSiteUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            Explore Circles Health App
          </a>
        </div>

        <div className="mobile-menu-wrapper" ref={menuRef}>
          <button className="navbar-toggle" onClick={() => setIsOpen((prev) => !prev)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

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
              <a
                href={circlesSiteUrl}
                className="btn btn-primary mobile-btn"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
              >
                Explore Circles Health App
              </a>
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
          justify-content: space-between;
          position: relative;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
        }

        .logo-img {
          height: 28px;
          width: auto;
        }

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
          gap: 2rem;
        }

        .nav-link {
          font-weight: 500;
          color: var(--color-text-light);
          position: relative;
          font-size: 1rem;
        }

        .nav-link:hover,
        .nav-link.active {
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

        .card-style {
          position: absolute;
          top: 150%;
          right: 0;
          background: white;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.05);
          min-width: 240px;
          text-align: center;
          z-index: 1001;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mobile-link {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--color-secondary);
        }

        .mobile-link.active {
          color: var(--color-primary);
        }

        .mobile-btn {
          width: 100%;
        }

        @media (max-width: 960px) {
          .hidden-mobile {
            display: none;
          }

          .navbar-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
