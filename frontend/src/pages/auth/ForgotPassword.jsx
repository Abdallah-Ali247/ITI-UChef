import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Send password reset request to the backend
      await api.post('/api/users/password-reset/', { email });
      setEmailSent(true);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'An error occurred. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="auth-page" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          backgroundColor: '#f9f9f9', 
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '1rem' }}>✉️</div>
          <h1 style={{ color: '#2e4057', marginBottom: '1.5rem' }}>Check Your Email</h1>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            We've sent password reset instructions to <strong>{email}</strong>.
          </p>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            If you don't receive an email within a few minutes, please check your spam folder
            or make sure you entered the correct email address.
          </p>
          <Link 
            to="/login" 
            style={{ 
              display: 'inline-block',
              backgroundColor: '#ff6b35',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '50px',
              textDecoration: 'none',
              fontWeight: 'bold',
              marginTop: '1rem'
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Forgot Your Password?</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      
      {error && (
        <div className="alert alert-danger" style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '0.75rem 1.25rem', 
          marginBottom: '1rem',
          borderRadius: '0.25rem',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="email" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
            style={{ 
              width: '100%', 
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '1rem'
            }}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ 
            width: '100%', 
            backgroundColor: '#ff6b35',
            border: 'none',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '50px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Reset Password'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <p>
          <Link to="/login" style={{ color: '#2e4057' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
