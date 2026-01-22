import { FaHeart, FaUsers, FaShieldAlt, FaBookOpen, FaSmile, FaUserMd } from 'react-icons/fa';

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

        {/* Unified Grid - No Center Image */}
        <div className="features-grid">
          {featuresList.map((f, i) => (
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

      <style>{`
        .features-section {
          padding: 80px 0;
          background-color: white; /* Clean white bg */
          position: relative;
        }

        .features-header {
          text-align: center;
          margin-bottom: 60px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .features-header h2 {
          font-size: 2.25rem;
          color: #0F172A;
          margin-bottom: 12px;
          font-weight: 700;
        }
        
        .features-subheader {
          font-size: 1.1rem;
          color: #64748B;
        }

        /* 3 Columns Desktop, 2 Columns Mobile */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: #F8FAFC; /* Light gray card bg */
          padding: 20px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }
        
        .feature-card:hover {
           background: white;
           transform: translateY(-4px);
           box-shadow: 0 10px 25px rgba(0,0,0,0.05);
           border-color: rgba(15, 118, 110, 0.1);
        }

        .feature-icon-wrapper {
          font-size: 1.25rem;
          background: white;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          flex-shrink: 0;
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }

        .feature-text h3 {
          font-size: 1rem; /* Compact title */
          margin-bottom: 4px;
          color: #1E293B;
          font-weight: 700;
        }

        .feature-text p {
          font-size: 0.875rem; /* Compact text */
          color: #64748B;
          line-height: 1.5;
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Mobile - Force 2 Columns */
        @media (max-width: 768px) {
          .features-section { padding: 50px 0; }
          .features-header { padding: 0 20px; margin-bottom: 32px; }
          .features-header h2 { font-size: 1.75rem; }
          
          .features-grid { 
             grid-template-columns: 1fr 1fr; /* TWO COLUMNS */
             gap: 12px;
          }
          
          .feature-card { 
             padding: 16px; /* Tighter padding */
             gap: 12px;
             align-items: center; /* Center align for mobile grid look */
             text-align: center;
          }
          
          .feature-text h3 { font-size: 0.9rem; }
          .feature-text p { font-size: 0.75rem; line-height: 1.3; }
        }
      `}</style>
    </section>
  );
};

export default Features;
