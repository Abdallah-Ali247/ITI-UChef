import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  
  return (
    <footer className="footer" style={{
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      borderTop: '1px solid var(--border-color)',
      padding: '2rem 0',
      marginTop: '2rem'
    }}>
      <div className="footer-content" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: '2rem'
      }}>
        <div className="footer-section" style={{ flex: '1', minWidth: '250px' }}>
          <h3 className="footer-heading" style={{ 
            color: 'var(--primary-color)',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>UChef</h3>
          <p className="footer-description" style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            Your one-stop solution for customizable meals and restaurant delivery.
          </p>
        </div>
        
        <div className="footer-section" style={{ flex: '1', minWidth: '250px' }}>
          <h3 className="footer-heading" style={{ 
            color: 'var(--primary-color)',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>Quick Links</h3>
          <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li className="footer-link" style={{ marginBottom: '0.75rem' }}>
              <Link to="/" style={{ 
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }} onMouseOver={(e) => e.target.style.color = 'var(--primary-color)'}
                 onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
                Home
              </Link>
            </li>
            <li className="footer-link" style={{ marginBottom: '0.75rem' }}>
              <Link to="/restaurants" style={{ 
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }} onMouseOver={(e) => e.target.style.color = 'var(--primary-color)'}
                 onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
                Restaurants
              </Link>
            </li>
            <li className="footer-link" style={{ marginBottom: '0.75rem' }}>
              <Link to="/cart" style={{ 
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }} onMouseOver={(e) => e.target.style.color = 'var(--primary-color)'}
                 onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
                Cart
              </Link>
            </li>
            <li className="footer-link" style={{ marginBottom: '0.75rem' }}>
              <Link to="/orders" style={{ 
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }} onMouseOver={(e) => e.target.style.color = 'var(--primary-color)'}
                 onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
                My Orders
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="footer-section" style={{ flex: '1', minWidth: '250px' }}>
          <h3 className="footer-heading" style={{ 
            color: 'var(--primary-color)',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>Contact Us</h3>
          <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li className="footer-link" style={{ 
              marginBottom: '0.75rem',
              color: 'var(--text-secondary)'
            }}>Email: support@uchef.com</li>
            <li className="footer-link" style={{ 
              marginBottom: '0.75rem',
              color: 'var(--text-secondary)'
            }}>Phone: +1 (555) 123-4567</li>
            <li className="footer-link" style={{ 
              marginBottom: '0.75rem',
              color: 'var(--text-secondary)'
            }}>Address: 123 Food Street, Cuisine City</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom" style={{ 
        marginTop: '2rem',
        textAlign: 'center',
        padding: '1rem 0',
        borderTop: '1px solid var(--border-color)',
        width: '100%'
      }}>
        <p style={{ 
          margin: 0,
          color: 'var(--text-tertiary)',
          fontSize: '0.9rem'
        }}>&copy; {currentYear} UChef. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

