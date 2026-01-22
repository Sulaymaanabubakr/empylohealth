import mobileMockup from '../assets/iphone-mockup-1.png';
import desktopMockup from '../assets/iphone-mockup-2.png';
import googlePlayBadge from '../assets/google-play-badge.png';
import appStoreBadge from '../assets/app-store-badge.png';

const DownloadApp = () => {
  return (
    <section className="download-section">
      <div className="container download-container">

        <div className="download-content">
          <h2 className="download-title">
            Download The <br />
            Circles Health App by Empylo
          </h2>
          <p className="download-desc">
            Circles Health App by Empylo provides a unique data-powered approach to combat loneliness and improve mental and physical health.
            Join now to experience meaningful connections like never before.
          </p>

          <div className="app-buttons">
            <a href="#" className="store-link">
              <img src={googlePlayBadge} alt="Get it on Google Play" className="store-img" />
            </a>
            <a href="#" className="store-link">
              <img src={appStoreBadge} alt="Download on the App Store" className="store-img" />
            </a>
          </div>
        </div>

        <div className="download-image">
          {/* Desktop Image */}
          <img src={desktopMockup} alt="App Mockup Desktop" className="mockup-desktop" />

          {/* Mobile Image */}
          <img src={mobileMockup} alt="App Mockup Mobile" className="mockup-mobile" />
        </div>

      </div>

      <style>{`
        .download-section {
          background: #CCFBF1; /* Light Pastel Teal matching screenshot */
          padding: 100px 0;
          overflow: hidden;
          color: #111827; /* Dark text */
        }

        .download-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 60px;
        }

        .download-title {
          font-size: 3rem;
          margin-bottom: 24px;
          line-height: 1.1;
          color: #111827;
          font-weight: 800;
        }

        .download-desc {
          color: #374151; /* Dark grey */
          line-height: 1.6;
          margin-bottom: 40px;
          max-width: 540px;
          font-size: 1.125rem;
        }

        .app-buttons {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .store-link {
          display: inline-block;
          transition: transform 0.2s ease;
          border-radius: 8px; /* Smooth corners for badge */
          overflow: hidden;
        }

        .store-link:hover {
            transform: translateY(-4px);
            opacity: 0.9;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .store-img {
            height: 50px; /* Standard badge height */
            width: auto;
            display: block;
        }

        .download-image {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .mockup-desktop {
            display: block;
            width: 100%;
            max-width: 600px; /* Limit width */
            height: auto;
            transform: scale(1.1); /* Slight pop */
        }

        .mockup-mobile {
            display: none;
        }

        /* Tablet adjustments */
        @media(max-width: 1024px) {
            .download-container {
                grid-template-columns: 1fr 1fr;
                gap: 40px;
            }
            .download-title {
                font-size: 2.5rem;
            }
        }

        /* Mobile adjustments: Switch Image & Stack */
        @media(max-width: 768px) {
            .download-section {
                padding: 60px 0;
            }
            .download-container {
                grid-template-columns: 1fr;
                text-align: center;
                gap: 40px;
            }
            .download-content {
                padding: 0 20px;
            }
            .download-title {
                font-size: 2rem;
                margin: 0 auto 16px;
            }
            .download-desc {
                margin: 0 auto 32px;
                font-size: 1rem;
                padding: 0 10px;
            }
            .app-buttons {
                flex-direction: row; /* Side by side on mobile if they fit, or stack if small */
                justify-content: center;
                flex-wrap: wrap;
                gap: 16px;
            }

            .store-img {
                height: 48px; /* Slightly smaller on mobile if needed */
            }

            /* Toggle Images */
            .mockup-desktop {
                display: none;
            }
            .mockup-mobile {
                display: block;
                width: 100%;
                max-width: 320px; /* Constrain mobile image width */
                height: auto;
                margin: 0 auto;
            }
        }
      `}</style>
    </section>
  );
};

export default DownloadApp;
