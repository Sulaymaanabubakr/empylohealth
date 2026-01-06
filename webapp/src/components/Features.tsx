import { FaDatabase, FaLock, FaExclamationTriangle, FaDesktop, FaUsers, FaChartLine } from 'react-icons/fa';
import adminImg from '../assets/admin-overview.png';

const Features = () => {
  const featuresList = [
    {
      title: "Data-Driven Decisions",
      description: "Interactive dashboards facilitate easy monitoring of campaigns with clear recommendations.",
      icon: <FaDatabase />,
      color: "#F5A623" // Yellow/Orange
    },
    {
      title: "2FA and Data Security",
      description: "Intuitive and secure login with two-factor authentication (2FA) and robust encryption.",
      icon: <FaLock />,
      color: "#F5A623"
    },
    {
      title: "Error Handling",
      description: "Comprehensive handling to prevent crashes, including smart retry logic for operational errors.",
      icon: <FaExclamationTriangle />,
      color: "#F5A623"
    },
    {
      title: "Interactive Dashboard",
      description: "Visually appealing dashboards for monitoring campaign progress, analytics, and insights.",
      icon: <FaDesktop />,
      color: "#F5A623"
    },
    {
      title: "Role Based Features",
      description: "Distinct interfaces and permissions for super-admins, admins, and regular users.",
      icon: <FaUsers />,
      color: "#F5A623"
    },
    {
      title: "Campaign Management",
      description: "Easily add colleagues, create audiences, and design targeted surveys.",
      icon: <FaChartLine />,
      color: "#F5A623"
    }
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div className="features-header">
          <h2>Some Key Features Our App Offers</h2>
          <p className="features-subheader">We provide a comprehensive suite of tools to manage workplace health.</p>
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

          {/* Center Image - Laptop Mockup */}
          <div className="features-center-img">
            <div className="laptop-mockup-container">
              <div className="laptop-frame">
                <div className="laptop-screen">
                  <img src={adminImg} alt="Admin Dashboard" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
              <div className="laptop-base"></div>
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
          grid-template-columns: 1fr 1.2fr 1fr;
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
        }
        
        .feature-card:hover {
           transform: translateY(-5px);
           box-shadow: 0 20px 40px rgba(0,0,0,0.06);
           border-color: rgba(15, 118, 110, 0.1);
        }

        .feature-icon-wrapper {
          font-size: 1.5rem;
          background: #FEF3C7; /* Soft amber bg matching color */
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px; /* Squircle */
          flex-shrink: 0;
        }

        .feature-text h3 {
          font-size: 1.25rem;
          margin-bottom: 8px;
          color: #1E293B;
          font-weight: 700;
          line-height: 1.2;
        }

        .feature-text p {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.6;
        }

        /* Laptop css mockup */
        .laptop-mockup-container {
           display: flex;
           flex-direction: column;
           align-items: center;
           width: 100%;
           padding: 40px;
        }
        
        .laptop-frame {
           width: 100%;
           aspect-ratio: 16/10;
           background: #1E293B;
           border-radius: 16px 16px 0 0;
           padding: 12px;
           position: relative;
           box-shadow: 0 30px 60px rgba(0,0,0,0.25);
           z-index: 10;
        }
        .laptop-screen {
           width: 100%;
           height: 100%;
           background: #fff;
           border-radius: 4px;
           overflow: hidden;
        }
        
        .laptop-base {
           width: 120%;
           height: 16px;
           background: #CBD5E1;
           border-radius: 0 0 16px 16px;
           position: relative;
           box-shadow: 0 20px 40px rgba(0,0,0,0.15);
           margin-top: -1px; /* seamless join */
        }

        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: 1fr;
            gap: 60px;
            justify-items: center; /* Center grid items */
          }
           .features-center-img {
             width: 80%;
             margin: 0 auto;
             order: -1;
           }
           .feature-card {
             flex-direction: column;
             text-align: center;
             align-items: center;
             max-width: 600px; /* Limit width for nice centering */
             margin: 0 auto;
           }
           .features-column {
               width: 100%;
               align-items: center;
           }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .features-section {
              padding: 60px 0;
          }
          .features-header {
              margin-bottom: 40px;
              padding: 0 20px;
          }
          .features-header h2 {
              font-size: 2rem;
          }
          
          .features-grid {
             grid-template-columns: 1fr 1fr; /* Compact 2-column */
             gap: 12px;
             align-items: stretch;
          }
          
          .features-center-img {
             grid-column: 1 / -1;
             width: 100%;
             margin-bottom: 24px;
             order: -1;
          }
          
          .features-column {
              display: contents; /* Flatten validation */
          }

          .feature-card {
             flex-direction: column;
             padding: 16px;
             gap: 12px;
             border-radius: 16px;
             align-items: center;
             text-align: center;
             height: 100%;
          }
          
          .feature-icon-wrapper {
              width: 48px;
              height: 48px;
              font-size: 1.25rem;
              border-radius: 12px;
          }
          
          .feature-text h3 {
              font-size: 0.9rem;
              margin-bottom: 4px;
              line-height: 1.2;
          }
          
          .feature-text p {
              font-size: 0.75rem;
              line-height: 1.35;
          }
        }
      `}</style>
    </section>
  );
};

export default Features;
