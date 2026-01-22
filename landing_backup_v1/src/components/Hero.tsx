import topBg from '../assets/top-bg.png';
import heroImg from '../assets/iphone-mockup-2.png';
import vectorBg from '../assets/vector-logo.png';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero">
      {/* Background Gradient/Pattern */}
      <div className="hero-bg-accent"></div>

      {/* Abstract Blobs for depth */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="container hero-container">
        <div className="hero-content">
          <p className="hero-subtitle">Circles Health App Client</p>
          <h1 className="hero-title">
            Stronger <span className="highlight">Connections</span>,<br />
            Better Health
          </h1>
          <p className="hero-description">
            Sign up to champion a workplace that values mental health, and
            together, let's create a nurturing environment where your employees can thrive.
          </p>
          <Link to="/features" className="btn btn-primary btn-lg">Get Started</Link>
        </div>

        <div className="hero-image">
          {/* Vector Background */}
          <img src={vectorBg} alt="" className="hero-vector-bg" />

          {/* Real Mockup Image - Desktop/Tablet Only */}
          {/* On mobile, the entire .hero-image is hidden via CSS */}
          <div className="img-container-mobile">
            <img src={heroImg} alt="App Interface" className="hero-mockup-img" />
          </div>
        </div>
      </div>

      <style>{`
        .hero {
          padding: 80px 0 100px;
          position: relative;
          overflow: hidden;
          background: #FAFAFA;
        }

        .hero-bg-accent {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            background: radial-gradient(circle at 10% 20%, rgba(15, 118, 110, 0.03) 0%, transparent 40%);
            z-index: 0;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          z-index: 0;
        }
        .blob-1 {
          width: 500px;
          height: 500px;
          background: rgba(204, 251, 241, 0.6); /* Teal light */
          top: -150px;
          right: -100px;
        }
        .blob-2 {
          width: 400px;
          height: 400px;
          background: rgba(254, 226, 226, 0.5); /* Soft red/pink */
          bottom: -50px;
          left: -100px;
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 60px;
          align-items: center;
          position: relative;
          z-index: 10;
        }

        .hero-subtitle {
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 16px;
          font-size: 0.8rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .hero-title {
          font-size: 3.5rem; /* Refined size */
          line-height: 1.15;
          font-weight: 800;
          margin-bottom: 24px;
          color: #111827;
          letter-spacing: -1px;
        }

        .hero-title .highlight {
          color: var(--color-accent);
          position: relative;
        }
        
        .hero-title .highlight::after {
            content: '';
            position: absolute;
            bottom: 6px;
            left: 0;
            width: 100%;
            height: 10px;
            background: rgba(245, 158, 11, 0.15);
            z-index: -1;
            transform: rotate(-1deg);
        }

        .hero-description {
          font-size: 1.1rem;
          color: #4B5563;
          margin-bottom: 32px;
          max-width: 500px;
          line-height: 1.6;
        }

        .btn-lg {
            display: inline-block;
            padding: 1rem 2.5rem;
            font-size: 1.05rem;
            box-shadow: 0 8px 20px rgba(15, 118, 110, 0.2);
            text-decoration: none;
        }

        .hero-image {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-vector-bg {
           position: absolute;
           z-index: -1;
           width: 120%; 
           max-width: none;
           opacity: 0.6;
        }

        .img-container-mobile {
          width: 70%;
          max-width: 300px;
          transform: rotate(-3deg);
          transition: transform 0.5s ease;
        }
        
        .img-container-mobile:hover {
           transform: rotate(0deg) scale(1.02);
        }
        
        .hero-mockup-img {
            width: 100%;
            height: auto;
            display: block;
            filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15));
        }

        /* Tablet adjustments */
        @media (max-width: 1024px) {
          .hero-title { font-size: 3rem; }
          .hero-container {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .hero { padding: 60px 0 80px; }
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 0;
          }

          /* HIDE MOCKUP ON MOBILE - STRICTLY ENFORCED */
          .hero-image {
              display: none !important; 
          }

          .hero-subtitle { 
              margin: 0 auto 12px; 
              font-size: 0.75rem;
          }
          
          .hero-title { 
              font-size: 2.25rem;
              margin-bottom: 16px;
              line-height: 1.2;
          }
          
          .hero-description { 
              margin: 0 auto 24px; 
              font-size: 1rem;
              padding: 0 10px;
          }
          
          .hero-content {
              display: flex;
              flex-direction: column;
              align-items: center;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
