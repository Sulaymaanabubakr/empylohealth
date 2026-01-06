import { FaApple, FaGooglePlay } from 'react-icons/fa';
// Ideally use images for stores, but icons work for refined prototype

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
            <div className="phone-mockup phone-1"></div>
            <div className="phone-mockup phone-2"></div>
          </div>
        </div>

      </div>

      <style>{`
        .download-section {
          background: linear-gradient(135deg, #115E59 0%, #0F766E 100%); /* Deep Teal Premium */
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
        
        .phone-mockup::before {
            content: 'App Screen';
            color: #555;
            font-size: 0.9rem;
        }
        .phone-mockup::after {
            content: '';
            position: absolute;
            top: 20px;
            width: 80px;
            height: 20px;
            background: #111;
            border-radius: 0 0 12px 12px;
        }
        
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

        @media(max-width: 960px) {
            .download-container {
                grid-template-columns: 1fr;
                text-align: center;
            }
            .app-buttons {
                justify-content: center;
            }
            .phone-group {
                margin-top: 80px;
            }
        }
      `}</style>
    </section>
  );
};

export default DownloadApp;
