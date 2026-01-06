import { FaApple, FaGooglePlay } from 'react-icons/fa';
import appScreen1 from '../assets/app-screen-1.png';
import appScreen2 from '../assets/app-screen-2.png';

const DownloadApp = () => {
  return (
    <section className="download-section">
      <div className="container download-container">

        <div className="download-content">
          <h2 className="download-title">
            Download The <br />
            Circles Health App
          </h2>
          <p className="download-desc">
            A unique data-powered approach to combat loneliness and improve mental and physical health.
            Experience meaningful connections like never before.
          </p>

          <div className="app-buttons">
            <button className="store-btn">
              <FaGooglePlay className="store-icon" />
              <div className="store-text">
                <span className="get-on">GET IT ON</span>
                <span className="store-name">Google Play</span>
              </div>
            </button>
            <button className="store-btn">
              <FaApple className="store-icon" />
              <div className="store-text">
                <span className="get-on">Download on the</span>
                <span className="store-name">App Store</span>
              </div>
            </button>
          </div>
        </div>

        <div className="download-image">
          {/* Phone Mockups placed to overlap section */}
          <div className="phone-group">
            <div className="phone-mockup phone-1">
              <img src={appScreen1} alt="App Profile" />
            </div>
            <div className="phone-mockup phone-2">
              <img src={appScreen2} alt="App Circles" />
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .download-section {
          background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
          padding: 120px 0;
          overflow: hidden;
          color: white; /* White text for contrast */
        }

        .download-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 80px;
        }

        .download-title {
          font-size: 3.5rem;
          margin-bottom: 24px;
          line-height: 1.1;
          color: white; /* Override global dark color */
          font-weight: 800;
        }

        .download-desc {
          color: rgba(255,255,255,0.9);
          line-height: 1.6;
          margin-bottom: 48px;
          max-width: 500px;
          font-size: 1.15rem;
        }

        .app-buttons {
          display: flex;
          gap: 20px;
        }

        .store-btn {
          background: #000;
          color: white;
          border-radius: 12px;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 180px;
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .store-btn:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            background: #111;
        }

        .store-icon {
          font-size: 28px;
        }

        .store-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }

        .get-on {
          font-size: 11px;
          text-transform: uppercase;
          opacity: 0.8;
          font-weight: 600;
        }

        .store-name {
          font-size: 18px;
          font-weight: 700;
        }

        .phone-group {
          position: relative;
          height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .phone-mockup {
          width: 220px;
          height: 440px;
          background: #333;
          border-radius: 32px;
          border: 10px solid #111;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
        }
        
        .phone-mockup img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 20px; /* Match inner curvature roughly */
        }
        
        /* Removed ::after pseudo-element that was creating the obstructing notch */
        
        .phone-1 {
            transform: rotate(-10deg) translateX(-30px);
            z-index: 1;
            background: #FAFAFA;
        }
        
        .phone-2 {
            transform: rotate(10deg) translateX(30px) translateY(30px);
            z-index: 2;
            background: #FAFAFA;
        }

        /* Tablet adjustments */
        @media(max-width: 1024px) {
            .download-container {
                grid-template-columns: 1fr;
                text-align: center;
                gap: 60px;
            }
            .download-title {
                margin: 0 auto 24px;
            }
            .download-desc {
                margin: 0 auto 40px;
            }
            .app-buttons {
                justify-content: center;
            }
            .download-image {
                display: flex;
                justify-content: center;
            }
        }

        /* Mobile adjustments */
        @media(max-width: 768px) {
            .download-section {
                padding: 60px 0;
            }
            .download-container {
                gap: 40px;
            }
            .download-title {
                font-size: 2.25rem; /* Much smaller */
            }
            .download-desc {
                margin: 0 auto 32px;
                font-size: 1rem;
            }
            .app-buttons {
                flex-direction: column; /* Stack buttons on mobile */
                align-items: center;
            }
            .store-btn {
                width: 100%;
                max-width: 280px;
            }
            .phone-group {
                margin-top: 40px;
                height: 380px; /* Reduced height container */
                transform: scale(0.85); /* Scale down whole group */
            }
        }
      `}</style>
    </section>
  );
};

export default DownloadApp;
