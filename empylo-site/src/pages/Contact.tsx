import { Mail, MessageSquare, User } from 'lucide-react';
import { useState } from 'react';

const Contact = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  });

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container contact-grid">
          <div>
            <span className="pill-label">Contact</span>
            <h1>Start the conversation.</h1>
            <p className="contact-lead">
              This form is currently a simple UI placeholder for enquiries and consultation requests.
            </p>
          </div>

          <div className="contact-card glass-panel">
            <form onSubmit={(event) => event.preventDefault()}>
              <label className="form-label">
                <span><User size={16} /> Name</span>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Your name"
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span><Mail size={16} /> Email</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="you@example.com"
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span><MessageSquare size={16} /> Message</span>
                <textarea
                  rows={5}
                  value={formState.message}
                  onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="Tell us what you’re exploring"
                  className="form-input"
                />
              </label>

              <button type="submit" className="btn btn-primary btn-wide">Send message</button>
            </form>
          </div>
        </div>
      </section>

      <style>{`
        .contact-hero {
          padding: 140px 0 100px;
          background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 36px;
          align-items: start;
        }

        .contact-hero h1 {
          font-size: 3rem;
          color: var(--color-secondary);
          margin-bottom: 18px;
          font-weight: 800;
        }

        .contact-lead {
          color: var(--color-text-light);
          line-height: 1.7;
          max-width: 520px;
        }

        .contact-card {
          padding: 28px;
          border-radius: 28px;
          background: white;
          box-shadow: var(--shadow-xl);
        }

        form {
          display: grid;
          gap: 18px;
        }

        .form-label {
          display: grid;
          gap: 8px;
          font-weight: 600;
          color: var(--color-secondary);
        }

        .form-label span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .form-input {
          width: 100%;
          border: 1px solid #D7E0E7;
          border-radius: 16px;
          padding: 0.95rem 1rem;
          font: inherit;
          resize: vertical;
        }

        .btn-wide {
          width: 100%;
        }

        @media (max-width: 860px) {
          .contact-grid { grid-template-columns: 1fr; }
          .contact-hero h1 { font-size: 2.35rem; }
        }
      `}</style>
    </div>
  );
};

export default Contact;
