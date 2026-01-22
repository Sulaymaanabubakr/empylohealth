import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        toggleRef.current &&
        !toggleRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo-link">
          <img src={logo} alt="Empylo Logo" className="logo-img" />
        </Link>

        {/* Mobile Menu Toggle */}
        <div className="mobile-toggle" onClick={toggleMenu} ref={toggleRef}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Desktop Menu */}
        <ul className={`nav-links ${isOpen ? 'active' : ''}`} ref={menuRef}>
          <li><Link to="/" onClick={() => setIsOpen(false)}>Home</Link></li>
          <li><Link to="/about" onClick={() => setIsOpen(false)}>About</Link></li>
          <li><Link to="/features" onClick={() => setIsOpen(false)}>Features</Link></li>
          <li><Link to="/contact" onClick={() => setIsOpen(false)}>Contact Support</Link></li>

          {/* Mobile Only Button in Menu */}
          <li className="mobile-btn">
            <button className="btn btn-primary">Download App</button>
          </li>
        </ul>

        {/* Desktop Button */}
        <button className="btn btn-primary desktop-btn">Download App</button>
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
              z-index: 1001;
          }
          
          .desktop-btn {
              display: none;
          }
          
          .mobile-btn {
              display: block;
              margin-top: 10px;
              width: 100%;
          }
          
          .mobile-btn button {
              width: 100%;
          }

          .nav-links {
            /* Compact Card Dropdown for Mobile */
            position: absolute;
            top: 70px; /* Below navbar */
            right: 20px;
            width: 250px; /* Fixed small width */
            height: auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            border: 1px solid rgba(0,0,0,0.05);
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            gap: 16px;
            padding: 24px;
            
            /* Hidden State */
            transform: translateY(-10px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease-in-out;
            z-index: 999;
          }
          
          .nav-links.active {
              transform: translateY(0);
              opacity: 1;
              pointer-events: auto;
          }
          
          .nav-links li {
              width: 100%;
          }
          
          .nav-links a {
              font-size: 1.05rem; /* Normal size */
              color: var(--color-secondary);
              display: block;
              padding: 4px 0;
          }
          
          .nav-links a:hover {
              color: var(--color-primary);
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
