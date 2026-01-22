import { FaHeart, FaUsers, FaShieldAlt, FaBookOpen, FaSmile, FaUserMd } from 'react-icons/fa';
import appScreen from '../assets/app-screen-1.png';

const Features = () => {
  const featuresList = [
    {
      title: "Supportive Communities",
      description: "Join Circles that resonate with your journey. Share, listen, and grow together.",
      icon: <FaUsers />,
      color: "#F5A623"
    },
    {
      title: "Daily Mood Tracking",
      description: "Check in with yourself daily. Visualize your emotional trends and gain self-awareness.",
      icon: <FaSmile />,
      color: "#F5A623"
    },
    {
      title: "Private & Secure",
      description: "Your data and conversations are encrypted. A safe space to be vulnerable.",
      icon: <FaShieldAlt />,
      color: "#F5A623"
    },
    {
      title: "Wellness Resources",
      description: "Access a library of curated articles, affirmations, and exercises.",
      icon: <FaBookOpen />,
      color: "#F5A623"
    },
    {
      title: "Professional Support",
      description: "Connect with certified therapists and counselors when you need extra help.",
      icon: <FaUserMd />,
      color: "#F5A623"
    },
    {
      title: "Holistic Health",
      description: "Tools designed to improve your mental, emotional, and social well-being.",
      icon: <FaHeart />,
      color: "#F5A623"
    }
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div className="features-header">
          <h2>Holistic Wellness in Your Pocket</h2>
          <p className="features-subheader">Everything you need to nurture your mental health, all in one premium app.</p>
        </div>

        <div className="features-grid">
          {/* Left Column */}
          <div className="features-column">
            {featuresList.slice(0, 3).map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrapper" style={{ color: f.color }}>
                  {f.icon}
                </div>
                <div className="feature-text">
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Center Image - Mobile App */}
          <div className="features-center-img">
            <div className="app-mockup-container">
              <img src={appScreen} alt="Circles App" className="app-screen-img" />
              <div className="app-glow"></div>
            </div>
          </div>

          {/* Right Column */}
          <div className="features-column">
            {featuresList.slice(3, 6).map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrapper" style={{ color: f.color }}>
                  {f.icon}
                </div>
                <div className="feature-text">
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .features-section {
          padding: 120px 0;
          background-color: #F8FAFC;
          position: relative;
        }

        .features-header {
          text-align: center;
          margin-bottom: 80px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .features-header h2 {
          font-size: 3rem;
          color: #0F172A;
          margin-bottom: 16px;
          font-weight: 700;
        }
        
        .features-subheader {
          font-size: 1.25rem;
          color: #64748B;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr 0.8fr 1fr;
          gap: 40px;
          align-items: center;
        }
        
        .features-column {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .feature-card {
          background: white;
          padding: 24px;
          border-radius: 20px;
          display: flex;
          gap: 20px;
          align-items: flex-start;
          transition: all 0.3s ease;
          border: 1px solid rgba(0,0,0,0.03);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01);
          min-height: 140px; /* Ensure uniform height perception */
        }
        
        .feature-card:hover {
           transform: translateY(-5px);
           box-shadow: 0 20px 40px rgba(0,0,0,0.06);
           border-color: rgba(15, 118, 110, 0.1);
        }

        .feature-icon-wrapper {
          font-size: 1.5rem;
          background: #FEF3C7;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          flex-shrink: 0;
        }

        .feature-text h3 {
          font-size: 1.15rem;
          margin-bottom: 6px;
          color: #1E293B;
          font-weight: 700;
        }

        .feature-text p {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.5;
        }

        .features-center-img {
           display: flex;
           justify-content: center;
           position: relative;
        }
        
        .app-mockup-container {
           position: relative;
           width: 280px;
           border-radius: 40px;
           z-index: 10;
        }
        
        .app-screen-img {
            width: 100%;
            height: auto;
            border-radius: 40px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 8px solid white;
        }
        
        .app-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 80%;
            background: radial-gradient(circle, rgba(13, 148, 136, 0.2) 0%, rgba(0,0,0,0) 70%);
            z-index: -1;
            filter: blur(40px);
        }

        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: 1fr 1fr; 
            gap: 30px;
            align-items: start;
          }
           .features-center-img {
             grid-column: 1 / -1; 
             margin: 40px auto 0;
             order: 10;
           }
           .features-column {
               display: contents; 
           }
        }

        @media (max-width: 768px) {
          .features-section { padding: 60px 0; }
          .features-header { padding: 0 20px; margin-bottom: 40px; }
          .features-header h2 { font-size: 2rem; }
          .features-grid { grid-template-columns: 1fr; gap: 16px; }
          .features-center-img { width: 100%; margin-bottom: 32px; order: -1; }
          .feature-card { flex-direction: row; text-align: left; }
        }
      `}</style>
    </section>
  );
};

export default Features;
