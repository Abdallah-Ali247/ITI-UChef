import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { removeFromCart, updateQuantity, clearCart } from '../../store/slices/cartSlice';

const Cart = () => {
  const { items, restaurantName, total } = useSelector(state => state.cart);
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleRemoveItem = (id, type) => {
    dispatch(removeFromCart({ id, type }));
  };
  
  const handleQuantityChange = (id, type, quantity) => {
    dispatch(updateQuantity({ id, type, quantity }));
  };
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    navigate('/checkout');
  };
  
  if (items.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h1>Your Cart is Empty</h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-color-secondary)' }}>Looks like you haven't added any items to your cart yet.</p>
          <Link to="/restaurants" className="btn btn-primary">
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Your Cart</h1>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-color-secondary)' }}>Items from {restaurantName}</p>
      
      <div className="cart-layout" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 600px), 1fr))', 
        gap: '1.5rem', 
        position: 'relative'
      }}>
        <div className="cart-items-container" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          height: 'fit-content',
          maxHeight: items.length > 3 ? '80vh' : 'auto',
          overflowY: items.length > 3 ? 'auto' : 'visible',
          padding: '0.5rem',
          backgroundColor: 'var(--bg-color-secondary)', 
          borderRadius: 'var(--border-radius)'
        }}>
          {items.map(item => (
            <div 
              key={`${item.type}-${item.id || item.customMealId}`} 
              className="card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                padding: '1rem',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(80px, 100px) 1fr', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <img 
                  src={item.image || 'https://via.placeholder.com/100x100?text=Meal'} 
                  alt={item.name} 
                  style={{ 
                    width: '100%', 
                    aspectRatio: '1/1',
                    objectFit: 'cover', 
                    borderRadius: 'var(--border-radius)' 
                  }}
                />
                
                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>{item.name}</h3>
                  {item.type === 'custom' && <p style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>Custom Meal</p>}
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>${item.price} each</p>
                  
                  {item.specialInstructions && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-color-secondary)' }}>
                      <small>Special instructions: {item.specialInstructions}</small>
                    </p>
                  )}
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <button 
                    className="quantity-btn"
                    style={{ 
                      width: '36px', 
                      height: '36px', 
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-color-secondary)',
                      color: 'var(--text-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                    onClick={() => handleQuantityChange(
                      item.type === 'regular' ? item.id : item.customMealId,
                      item.type,
                      Math.max(1, item.quantity - 1)
                    )}
                  >
                    -
                  </button>
                  
                  <input 
                    type="number" 
                    className="quantity-input"
                    value={item.quantity} 
                    min="1" 
                    style={{ 
                      width: '50px', 
                      textAlign: 'center',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '0.5rem',
                      backgroundColor: 'var(--bg-color-secondary)',
                      color: 'var(--text-color)'
                    }}
                    onChange={(e) => handleQuantityChange(
                      item.type === 'regular' ? item.id : item.customMealId,
                      item.type,
                      parseInt(e.target.value) || 1
                    )}
                  />
                  
                  <button 
                    className="quantity-btn"
                    style={{ 
                      width: '36px', 
                      height: '36px', 
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-color-secondary)',
                      color: 'var(--text-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                    onClick={() => handleQuantityChange(
                      item.type === 'regular' ? item.id : item.customMealId,
                      item.type,
                      item.quantity + 1
                    )}
                  >
                    +
                  </button>
                </div>
                
                <button 
                  className="btn btn-outline"
                  style={{ 
                    color: 'var(--danger-color)', 
                    borderColor: 'var(--danger-color)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.9rem'
                  }}
                  onClick={() => handleRemoveItem(
                    item.type === 'regular' ? item.id : item.customMealId,
                    item.type
                  )}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ 
          position: 'sticky', 
          top: '1rem',
          height: 'fit-content',
          alignSelf: 'flex-start'
        }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Order Summary</h2>
            
            <div style={{ 
              margin: '1.5rem 0', 
              borderBottom: '1px solid var(--border-color)', 
              paddingBottom: '1rem',
              maxHeight: items.length > 5 ? '200px' : 'auto',
              overflowY: items.length > 5 ? 'auto' : 'visible',
              paddingRight: items.length > 5 ? '0.5rem' : '0'
            }}>
              {items.map(item => (
                <div 
                  key={`${item.type}-${item.id || item.customMealId}-summary`} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '0.75rem',
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)'
                  }}
                >
                  <span style={{ 
                    maxWidth: '70%', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>{item.name} x {item.quantity}</span>
                  <span style={{ fontWeight: '500' }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontWeight: 'bold', 
              fontSize: 'clamp(1.1rem, 2.5vw, 1.2rem)', 
              marginBottom: '1.5rem' 
            }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </button>
              
              <button 
                className="btn btn-outline" 
                style={{ width: '100%' }}
                onClick={() => dispatch(clearCart())}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
