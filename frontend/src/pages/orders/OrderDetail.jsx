import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById } from '../../store/slices/orderSlice';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector(state => state.orders);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchOrderById(id));
  }, [dispatch, id, isAuthenticated, navigate]);
  
  // Helper function to get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'preparing':
        return 'status-preparing';
      case 'ready':
        return 'status-ready';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger">
        {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
      </div>
    );
  }
  
  if (!currentOrder) {
    return (
      <div className="alert alert-warning">
        Order not found.
      </div>
    );
  }
  
  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div className="breadcrumb" style={{ 
        marginBottom: '1rem', 
        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
        color: 'var(--text-color-secondary)'
      }}>
        <Link to="/orders" style={{ color: 'var(--text-color-secondary)' }}>Orders</Link> &gt; 
        <span> Order #{currentOrder.id}</span>
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'clamp(1rem, 3vw, 2rem)',
        gap: '1rem'
      }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', margin: 0 }}>Order #{currentOrder.id}</h1>
        <span className={`order-status ${getStatusClass(currentOrder.status)}`} style={{ 
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          padding: '0.5rem 1rem',
          borderRadius: '30px',
          fontWeight: '500'
        }}>
          {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
        </span>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', 
        gap: 'clamp(1rem, 3vw, 2rem)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 2rem)' }}>
          <div className="card" style={{ height: 'fit-content' }}>
            <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1rem' }}>Order Information</h2>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Restaurant</p>
                  <p style={{ color: 'var(--text-color-secondary)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{currentOrder.restaurant_name}</p>
                </div>
                
                <div>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Order Date</p>
                  <p style={{ color: 'var(--text-color-secondary)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{formatDate(currentOrder.created_at)}</p>
                </div>
                
                <div>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Delivery Address</p>
                  <p style={{ color: 'var(--text-color-secondary)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{currentOrder.delivery_address}</p>
                </div>
                
                {currentOrder.delivery_notes && (
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Delivery Notes</p>
                    <p style={{ color: 'var(--text-color-secondary)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{currentOrder.delivery_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="card" style={{ height: 'fit-content' }}>
            <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1rem' }}>Order Items</h2>
              
              <div style={{ 
                maxHeight: currentOrder.items.length > 5 ? '300px' : 'auto',
                overflowY: currentOrder.items.length > 5 ? 'auto' : 'visible'
              }}>
                {currentOrder.items.map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border-color)',
                    gap: '0.5rem'
                  }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <h4 style={{ 
                        fontSize: 'clamp(1rem, 2vw, 1.1rem)', 
                        marginBottom: '0.5rem',
                        fontWeight: '600'
                      }}>
                        {item.custom_meal_details ? (
                          <>
                            {item.custom_meal_details.name}
                            <span style={{ 
                              color: 'var(--accent-color)', 
                              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                              marginLeft: '0.5rem' 
                            }}>(Custom)</span>
                          </>
                        ) : item.meal_details ? (
                          item.meal_details.name
                        ) : (
                          `Meal #${item.meal}`
                        )}
                      </h4>
                      
                      {item.special_instructions && (
                        <p style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: 'var(--text-color-secondary)' }}>
                          Special instructions: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--text-color-secondary)' }}>
                        {item.quantity} x ${parseFloat(item.price).toFixed(2)}
                      </p>
                      <p style={{ 
                        fontWeight: 'bold', 
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                        color: 'var(--text-color)'
                      }}>
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div style={{ position: 'sticky', top: '1rem' }}>
            <div className="card" style={{ height: 'fit-content' }}>
              <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1rem' }}>Payment Summary</h2>
                
                <div style={{ margin: '1.5rem 0' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '0.75rem',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                  }}>
                    <span>Subtotal</span>
                    <span>${parseFloat(currentOrder.total_price).toFixed(2)}</span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '0.75rem',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                  }}>
                    <span>Delivery Fee</span>
                    <span>$0.00</span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: 'bold', 
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1rem'
                }}>
                  <span>Total</span>
                  <span>${parseFloat(currentOrder.total_price).toFixed(2)}</span>
                </div>
                
                {currentOrder.payment && (
                  <div style={{ 
                    marginTop: '1.5rem', 
                    padding: '1rem',
                    backgroundColor: 'var(--bg-color-secondary)',
                    borderRadius: 'var(--border-radius)',
                  }}>
                    <h3 style={{ 
                      fontSize: 'clamp(1.1rem, 2vw, 1.2rem)', 
                      marginBottom: '0.75rem',
                      fontWeight: '600'
                    }}>Payment Information</h3>
                    
                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Method:</span>
                        <span>{currentOrder.payment.payment_method.replace('_', ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                        }</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Status:</span>
                        <span>{currentOrder.payment.status.charAt(0).toUpperCase() + 
                          currentOrder.payment.status.slice(1)
                        }</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Date:</span>
                        <span>{formatDate(currentOrder.payment.payment_date)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <Link 
                to="/orders" 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                }}
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
