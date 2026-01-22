import { FormEvent, useState } from 'react';

const Contact = () => {
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const firstName = String(data.get('firstName') || '');
    const lastName = String(data.get('lastName') || '');
    const email = String(data.get('email') || '');
    const company = String(data.get('company') || '');
    const message = String(data.get('message') || '');

    const baseUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL;
    if (!baseUrl) {
      setErrorMessage('Contact service is not configured.');
      setStatus('error');
      return;
    }

    fetch(`${baseUrl}/submitContactForm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, company, message })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to submit contact form.');
        }
        setStatus('sent');
        setErrorMessage('');
        form.reset();
      })
      .catch((error) => {
        setErrorMessage(error.message || 'Unable to submit form.');
        setStatus('error');
      });
  };

  return (
    <section className="contact-section">
      <div className="container contact-container">
        <div className="contact-header">
          <h2>Get in Touch</h2>
          <p className="contact-subheader">Have questions? We'd love to hear from you.</p>
        </div>

        <div className="contact-card glass-panel">
          <div className="contact-icon-top">
            {/* Icon placeholder */}
            <span>📞</span>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First name*</label>
                <input type="text" name="firstName" placeholder="Jane" required />
              </div>
              <div className="form-group">
                <label>Last name*</label>
                <input type="text" name="lastName" placeholder="Doe" required />
              </div>
            </div>

            <div className="form-group">
              <label>Email*</label>
              <input type="email" name="email" placeholder="jane@company.com" required />
            </div>

            <div className="form-group">
              <label>Company name*</label>
              <input type="text" name="company" placeholder="Company Inc." required />
            </div>

            <div className="form-group">
              <label>Message*</label>
              <textarea name="message" rows={5} placeholder="Tell us a bit about your team..." required></textarea>
            </div>

            <button type="submit" className="btn btn-primary btn-block">Send Message</button>
          </form>

          {status === 'sent' && (
            <p className="contact-success">Thanks! We received your message.</p>
          )}
          {status === 'error' && (
            <p className="contact-error">{errorMessage || 'Something went wrong. Try again.'}</p>
          )}

          <p className="contact-disclaimer">
            By submitting this form, you agree to our privacy policy and terms of service.
          </p>
        </div>
      </div>

      <style>{`
          .contact-section {
            padding: 120px 0 160px;
            background: radial-gradient(circle at 50% 100%, #E0F2F1 0%, #FAFAFA 50%);
            position: relative;
            display: flex;
            justify-content: center;
          }
  
          .contact-container {
            width: 100%;
            max-width: 640px; 
            text-align: center;
            position: relative;
            z-index: 2;
          }
          
          .contact-header {
             margin-bottom: 60px;
          }

          .contact-header h2 {
            margin-bottom: 16px;
            font-size: 2.25rem; /* Reduced from 3rem */
            color: #111;
            font-weight: 700;
          }
          
          .contact-subheader {
             font-size: 1.1rem; /* Reduced from 1.25rem */
             color: #666;
          }
  
          .contact-card {
            padding: 48px;
            border-radius: 24px;
            position: relative;
            margin-top: 40px;
            /* Glass styles provided by global class, enhanced here */
            background: white;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          }
  
          .contact-icon-top {
            position: absolute;
            top: -48px;
            left: 50%;
            transform: translateX(-50%);
            width: 96px;
            height: 96px;
            background: var(--color-primary-light);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: white;
            border: 8px solid #FAFAFA;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
  
          .contact-form {
            display: flex;
            flex-direction: column;
            gap: 24px;
            margin-top: 32px;
          }
  
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
  
          .form-group {
            display: flex;
            flex-direction: column;
            text-align: left;
          }
  
          .form-group label {
            font-size: 0.95rem;
            margin-bottom: 8px;
            color: #374151;
            font-weight: 600;
          }
  
          .form-group input,
          .form-group textarea {
            padding: 16px;
            border: 2px solid #E5E7EB;
            border-radius: 12px;
            font-size: 1.05rem;
            font-family: inherit;
            outline: none;
            transition: all 0.2s;
            background: #F9FAFB;
          }
  
          .form-group input:focus,
          .form-group textarea:focus {
            border-color: var(--color-primary);
            background: white;
            box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.1);
          }
  
          .btn-block {
            width: 100%;
            margin-top: 16px;
            padding: 16px;
            font-size: 1.1rem;
          }
  
          .contact-disclaimer {
            margin-top: 32px;
            font-size: 0.85rem;
            color: #9CA3AF;
            line-height: 1.5;
          }

          .contact-success {
            margin-top: 16px;
            font-size: 0.95rem;
            color: #0F766E;
            font-weight: 600;
          }

          .contact-error {
            margin-top: 16px;
            font-size: 0.95rem;
            color: #B91C1C;
            font-weight: 600;
          }
          
          @media(max-width: 600px) {
              .form-row {
                  grid-template-columns: 1fr;
              }
              .contact-card {
                  padding: 24px;
              }
          }
        `}</style>
    </section>
  );
};

export default Contact;
