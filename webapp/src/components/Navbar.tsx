import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo-link">
          <img src={logo} alt="Empylo Logo" className="logo-img" />
        </Link>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/features">Features</Link></li>
          <li><Link to="/pricing">Pricing</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
        </ul>

        <button className="btn btn-primary">Get Started</button>
      </div>

      <style>{`
        .navbar {
          height: 100px;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          
          /* Glass Effect */
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.03);
        }
        
        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .logo-img {
          height: 40px; /* Bigger logo */
          width: auto;
          display: block;
        }

        .nav-links {
          display: flex;
          gap: 50px;
        }

        .nav-links a {
          font-family: var(--font-body);
          font-weight: 600; /* Bolder */
          color: var(--color-secondary);
          font-size: 1rem;
          transition: color 0.2s;
          opacity: 0.8;
        }

        .nav-links a:hover {
          color: var(--color-primary);
          opacity: 1;
        }

        @media (max-width: 960px) {
          .nav-links {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
