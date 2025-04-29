import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { FaSun, FaMoon, FaShoppingCart, FaUser } from 'react-icons/fa';

const Header = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { items } = useSelector(state => state.cart);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear the cart when logging out
    dispatch(clearCart());
    // Then logout the user
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="header" style={{ 
      backgroundColor: 'var(--header-bg)', 
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-text" style={{ 
            color: 'var(--header-text)', 
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.8rem',
            fontWeight: '700',
            background: 'linear-gradient(45deg, var(--accent-color) 0%, var(--header-text) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            UChef
          </span>
        </Link>
        
        <nav>
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink to="/" className="nav-link" style={{ color: 'var(--header-text)' }}>Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/restaurants" className="nav-link" style={{ color: 'var(--header-text)' }}>Restaurants</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/meals" className="nav-link" style={{ color: 'var(--header-text)' }}>Meals</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/top-custom-meals" className="nav-link" style={{ color: 'var(--header-text)' }}>Top Custom Meals</NavLink>
            </li>
            
            {isAuthenticated ? (
              <>
                {/* Show different navigation based on user type */}
                {user?.user_type === 'restaurant' && (
                  <li className="nav-item">
                    <NavLink to="/restaurant-dashboard" className="nav-link" style={{ color: 'var(--header-text)' }}>Restaurant Dashboard</NavLink>
                  </li>
                )}
                
                {user?.user_type === 'admin' && (
                  <li className="nav-item">
                    <NavLink to="/admin-dashboard" className="nav-link" style={{ color: 'var(--header-text)' }}>Admin Dashboard</NavLink>
                  </li>
                )}
                
                {user?.user_type === 'customer' && (
                  <li className="nav-item">
                    <NavLink to="/orders" className="nav-link" style={{ color: 'var(--header-text)' }}>My Orders</NavLink>
                  </li>
                )}
                
                <li className="nav-item">
                  <NavLink to="/profile" className="nav-link" style={{ color: 'var(--header-text)' }}>
                    <FaUser className="nav-icon" /> Profile
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="nav-link logout-btn" style={{ color: 'var(--header-text)' }}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link" style={{ color: 'var(--header-text)' }}>Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/register" className="nav-link" style={{ color: 'var(--header-text)' }}>Register</NavLink>
                </li>
              </>
            )}
            
            <li className="nav-item cart-item">
              <NavLink to="/cart" className="nav-link cart-link" style={{ color: 'var(--header-text)' }}>
                <FaShoppingCart className="nav-icon" />
                <span>Cart</span>
                {items.length > 0 && <span className="cart-badge">{items.length}</span>}
              </NavLink>
            </li>
            
            <li className="nav-item theme-toggle">
              <button onClick={toggleTheme} className="theme-btn" aria-label="Toggle theme" style={{ color: 'var(--header-text)' }}>
                {theme === 'light' ? <FaMoon className="theme-icon" /> : <FaSun className="theme-icon" />}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
