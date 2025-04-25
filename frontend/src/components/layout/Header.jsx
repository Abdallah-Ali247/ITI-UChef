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
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">UChef</Link>
        
        <nav>
          <ul className="nav-menu">
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
