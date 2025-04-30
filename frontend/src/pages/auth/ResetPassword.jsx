import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (formData.new_password !== formData.confirm_password) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post('/api/users/password-reset-confirm/', {
        uid,
        token,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });
      
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'An error occurred. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          backgroundColor: '#f9f9f9', 
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '1rem' }}>✓</div>
          <h1 style={{ color: '#2e4057', marginBottom: '1.5rem' }}>Password Reset Successful</h1>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.9rem', color: '#666' }}>
            You will be redirected to the login page in 5 seconds...
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
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Reset Your Password</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
        Please enter your new password below.
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
          <label htmlFor="new_password" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            New Password
          </label>
          <input
            type="password"
            id="new_password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            className="form-control"
            style={{ 
              width: '100%', 
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '1rem'
            }}
            required
            minLength="8"
          />
          <small style={{ color: '#6c757d', fontSize: '0.875rem' }}>
            Password must be at least 8 characters long
          </small>
        </div>
        
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="confirm_password" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
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
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
