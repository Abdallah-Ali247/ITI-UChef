import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';

const Header = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { items } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="header" style={{
      width: '100vw',
      left: 0,
      top: 0,
      zIndex: 100,
      position: 'fixed',
      background: 'none',
      padding: 0,
      margin: 0
    }}>
      <div className="header-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
        padding: '0 2rem',
        minHeight: '64px',
        width: '100vw',
        boxSizing: 'border-box',
      }}>
        <Link to="/" className="logo" style={{
          fontWeight: '800',
          fontSize: '2rem',
          letterSpacing: '0.03em',
          color: 'var(--primary-color)',
          textDecoration: 'none',
          textShadow: '0 2px 8px rgba(255,123,59,0.08)',
          transition: 'color 0.2s'
        }}>UChef</Link>
        
        <nav style={{ flex: 1 }}>
          <ul className="nav-menu" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            justifyContent: 'flex-end',
            width: '100%'
          }}>
            <li className="nav-item">
              <NavLink to="/" className="nav-link">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/restaurants" className="nav-link">Restaurants</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/top-custom-meals" className="nav-link">Top Custom Meals</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/cart" className="nav-link">
                Cart {items.length > 0 && `(${items.length})`}
              </NavLink>
            </li>
            <li className="nav-item">
              <button 
                onClick={toggleTheme} 
                className="theme-toggle-btn"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.5rem',
                  color: 'var(--text-primary)'
                }}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </li>
            {isAuthenticated ? (
              <>
                {/* Show different navigation based on user type */}
                {user?.user_type === 'restaurant' && (
                  <li className="nav-item">
                    <NavLink to="/restaurant-dashboard" className="nav-link">Restaurant Dashboard</NavLink>
                  </li>
                )}
                
                {user?.user_type === 'admin' && (
                  <li className="nav-item">
                    <NavLink to="/admin-dashboard" className="nav-link">Admin Dashboard</NavLink>
                  </li>
                )}
                
                {user?.user_type === 'customer' && (
                  <li className="nav-item">
                    <NavLink to="/orders" className="nav-link">My Orders</NavLink>
                  </li>
                )}
                
                <li className="nav-item">
                  <NavLink to="/profile" className="nav-link">Profile</NavLink>
                </li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link">Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/register" className="nav-link">Register</NavLink>
                </li>
              </>
            )}
            
          
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
