import topBg from '../assets/top-bg.png';
import heroImg from '../assets/longscroll-browser.png';
import vectorBg from '../assets/vector-logo.png';

const Hero = () => {
  return (
    <section className="hero">
      {/* Abstract Background Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="container hero-container">
        <div className="hero-content">
          <p className="hero-subtitle">CIRCLES HEALTH APP CLIENT</p>
          <h1 className="hero-title">
            Stronger <span className="highlight">Connections</span>,<br />
            Better Health
          </h1>
          <p className="hero-description">
            Sign up to champion a workplace that values mental health. Together,
            let's create a nurturing environment where your employees can thrive.
          </p>
          <button className="btn btn-primary btn-lg">Get Started</button>
        </div>

        <div className="hero-image">
          {/* Vector Background */}
          <img src={vectorBg} alt="" className="hero-vector-bg" />

          {/* Real Mockup Image */}
          <div className="img-container-skew">
            <img src={heroImg} alt="Dashboard Mockup" className="hero-mockup-img" />
          </div>
        </div>
      </div>

      <style>{`
        .hero {
          padding: 120px 0 160px;
          position: relative;
          overflow: hidden; /* For blobs */
        }

        /* Abstract Blobs for depth */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          z-index: -1;
        }
        .blob-1 {
          width: 600px;
          height: 600px;
          background: #CCFBF1; /* Teal light */
          top: -200px;
          right: -100px;
        }
        .blob-2 {
          width: 500px;
          height: 500px;
          background: #FEE2E2; /* Soft red/pinkish hint */
          bottom: -100px;
          left: -100px;
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 80px;
          align-items: center;
          position: relative;
        }

        .hero-subtitle {
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 24px;
          font-size: 0.875rem;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .hero-title {
          font-size: 5rem; /* Massive Premium Heading */
          line-height: 1.05;
          font-weight: 800;
          margin-bottom: 32px;
          color: #111827;
          letter-spacing: -2px;
        }

        .hero-title .highlight {
          color: var(--color-accent);
          position: relative;
        }
        
        /* Underline effect for highlight */
        .hero-title .highlight::after {
            content: '';
            position: absolute;
            bottom: 8px;
            left: 0;
            width: 100%;
            height: 12px;
            background: rgba(245, 158, 11, 0.2);
            z-index: -1;
            transform: rotate(-2deg);
        }

        .hero-description {
          font-size: 1.25rem;
          color: #4B5563;
          margin-bottom: 48px;
          max-width: 540px;
          line-height: 1.6;
        }

        .btn-lg {
            padding: 1.125rem 3rem;
            font-size: 1.125rem;
            box-shadow: 0 10px 30px rgba(15, 118, 110, 0.25);
        }

        .hero-image {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-vector-bg {
           position: absolute;
           z-index: -1;
           width: 140%; 
           max-width: none;
           top: 50%;
           left: 50%;
           transform: translate(-50%, -50%) scale(1.1);
           opacity: 1;
           pointer-events: none;
        }

        .img-container-skew {
          width: 100%;
          transform: perspective(2500px) rotateY(-12deg) rotateX(5deg) scale(1.25);
          transform-origin: center center;
          /* Removed background, border, and box-shadow per user request */
          /* The image itself is the mockup, floating over the vector */
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        .img-container-skew:hover {
           transform: perspective(2500px) rotateY(-5deg) rotateX(2deg) scale(1.3);
           /* Removed hover shadow on container */
        }
        
        .hero-mockup-img {
            width: 100%;
            height: auto;
            display: block;
            /* Removed border-radius and box-shadow to prevent rectangular artifacts 
               on transparent/curled mockup images. */
            filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15)); /* Optional: softer shadow respecting transparency */
        }
        
        /* Remove unused mock-ui styles */

        /* Tablet adjustments */
        @media (max-width: 1024px) {
          .hero-title { font-size: 3.5rem; }
          .hero-container {
            /* Keep side-by-side for tablet, just tighter */
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            text-align: left; /* Reset text align */
          }
           .hero-subtitle { margin: 0 0 16px; }
           .hero-description { margin: 0 0 32px; }
           .img-container-skew { 
               transform: perspective(2500px) rotateY(-8deg) rotateX(4deg) scale(1.1); /* Tamed skew */
           }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .hero { 
              padding: 40px 0 60px;
              background: #F0FDFA; /* Slight tint instead of white to separate from header */
          }
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 20px;
          }
          /* HIDE background elements that might obstruct */
          .hero-vector-bg, .blob {
              display: none !important;
          }
          
          .hero-subtitle { 
              margin: 0 auto 12px; 
              font-size: 0.75rem;
          }
          .hero-title { 
              font-size: 2rem;
              letter-spacing: -1px;
              margin-bottom: 16px;
              line-height: 1.15;
          }
          .hero-description { 
              margin: 0 auto 24px; 
              font-size: 0.95rem;
              padding: 0 10px;
              max-width: 100%;
          }
          .btn-lg {
              padding: 0.875rem 2rem;
              font-size: 1rem;
              width: auto;
              min-width: 200px;
          }
          
          .img-container-skew { 
              transform: none; 
              margin-top: 10px;
              width: 100%;
          }
          .hero-mockup-img {
              max-width: 100%;
              width: 100%;
              height: auto;
              filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1));
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
