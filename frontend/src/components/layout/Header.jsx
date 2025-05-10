import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import NotificationIcon from '../notifications/NotificationIcon';
import NotificationList from '../notifications/NotificationList';
import { FaSun, FaMoon, FaShoppingCart, FaUser, FaBars, FaTimes, FaSignOutAlt, FaUserCircle, FaTachometerAlt, FaSignInAlt, FaUserPlus, FaChevronDown, FaHatWizard, FaCookieBite } from 'react-icons/fa';
import './user-dropdown.css';

const Header = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { items } = useSelector(state => state.cart);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // State for mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Ref for user dropdown
  const userDropdownRef = useRef(null);
  
  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close mobile menu and dropdowns when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [navigate]);
  
  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleLogout = () => {
    // Clear the cart when logging out
    dispatch(clearCart());
    // Then logout the user
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-text">
            UChef
          </span>
        </Link>
        
        {/* Mobile menu toggle button */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        
        <nav className={mobileMenuOpen ? 'open' : ''}>
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink to="/" className="nav-link">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/restaurants" className="nav-link">Restaurants</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/meals" className="nav-link">Meals</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/top-custom-meals" className="nav-link">Top Custom Meals</NavLink>
            </li>
            
            
            
            <li className="nav-item cart-item">
              <NavLink to="/cart" className="nav-link cart-link">
                <FaShoppingCart className="nav-icon" />
                <span>Cart</span>
                {items.length > 0 && <span className="cart-badge">{items.length}</span>}
              </NavLink>
            </li>
            
            {isAuthenticated && (
              <li className="nav-item notification-item">
                <div 
                  onClick={() => setNotificationOpen(!notificationOpen)} 
                  className="nav-link cursor-pointer position-relative" 
                  style={{ color: 'var(--header-text)' }}
                >
                  <NotificationIcon />
                  {notificationOpen && (
                    <div className="notification-dropdown-wrapper">
                      <NotificationList isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
                    </div>
                  )}
                </div>
              </li>
            )}
            
            {/* User dropdown menu */}
            <li className="nav-item user-dropdown-container" ref={userDropdownRef}>
              {/* Desktop dropdown toggle button */}
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)} 
                className="nav-link user-dropdown-toggle"
              >
                {isAuthenticated ? (
                  <>
                    <FaUser className="nav-icon" />
                    <span className="user-name">{user?.username || 'User'}</span>
                    <FaChevronDown className="dropdown-arrow" />
                  </>
                ) : (
                  <>
                    <FaCookieBite className="nav-icon anon-chef-icon" />
                    <span>AnonChef</span>
                    <FaChevronDown className="dropdown-arrow" />
                  </>
                )}
              </button>
              
              {/* Dropdown content - shown conditionally on desktop, always on mobile */}
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  {isAuthenticated ? (
                    <>
                      <h3 className="user-dropdown-title">
                        {user?.username || 'User'}
                      </h3>
                      <p className="user-dropdown-subtitle">
                        {user?.email || ''}
                      </p>
                    </>
                  ) : (
                    <h3 className="user-dropdown-title">Welcome, AnonChef!</h3>
                  )}
                </div>
                
                <div className="user-dropdown-content">
                  {isAuthenticated ? (
                    <>
                      <Link to="/profile" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                      
                        <FaUserCircle className="dropdown-icon" />
                        <li className="nav-item">
                        <span className="nav-link orders-link">Profile</span>
                      </li>
                      </Link>

                      {/* Customer-specific navigation items */}
                      {isAuthenticated && user?.user_type === 'customer' && (
                        <li className="nav-item">
                          <NavLink to="/orders" className="nav-link orders-link">My Orders</NavLink>
                        </li>
                      )}
                      
                      {/* Show different dashboard links based on user type */}
                      {user?.user_type === 'restaurant' && (
                        <Link to="/restaurant-dashboard" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                          <FaTachometerAlt className="dropdown-icon" />
                          <span>Restaurant Dashboard</span>
                        </Link>
                      )}
                      
                      {user?.user_type === 'admin' && (
                        <Link to="/admin-dashboard" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                          <FaTachometerAlt className="dropdown-icon" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      
                      <button onClick={() => { handleLogout(); setUserDropdownOpen(false); }} className="user-dropdown-item  p-2 logout-btn">
                        <FaSignOutAlt className="dropdown-icon" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="user-dropdown-item p-2 cursor-pointer " onClick={() => setUserDropdownOpen(false)}>
                        <FaSignInAlt className="dropdown-icon" />
                        <span>Login</span>
                      </Link>
                      <Link to="/register" className="user-dropdown-item p-2" onClick={() => setUserDropdownOpen(false)}>
                        <FaUserPlus className="dropdown-icon" />
                        <span>Register</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </li>
            
            <li className="nav-item theme-toggle">
              <button 
                onClick={toggleTheme} 
                className="theme-btn" 
                aria-label="Toggle theme"
              >
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
