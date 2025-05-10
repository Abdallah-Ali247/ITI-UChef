import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserOrders } from '../../store/slices/orderSlice';

const OrderHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchUserOrders());
  }, [dispatch, isAuthenticated, navigate]);
  
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
  
  if (orders.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>No Orders Yet</h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-color-secondary)' }}>You haven't placed any orders yet.</p>
          <Link to="/restaurants" className="btn btn-primary">
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '1.5rem' }}>Order History</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 500px), 1fr))', 
        gap: '1.5rem',
        marginTop: '1rem'
      }}>
        {orders.map(order => (
          <div key={order.id} className="card" style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            position: 'relative'
          }}>
            <div style={{ 
              padding: '1.25rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <h3 style={{ fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', marginBottom: '0.5rem' }}>Order #{order.id}</h3>
                <p style={{ color: 'var(--text-color-secondary)', marginBottom: '0.25rem' }}>{order.restaurant_name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-color-tertiary)' }}>{formatDate(order.created_at)}</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className={`order-status ${getStatusClass(order.status)}`} style={{ 
                  display: 'inline-block',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem'
                }}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <div style={{ fontWeight: 'bold', fontSize: 'clamp(1.1rem, 2vw, 1.25rem)' }}>
                  ${parseFloat(order.total_price).toFixed(2)}
                </div>
              </div>
            </div>
            
            <div style={{ padding: '1.25rem', flex: '1' }}>
              <h4 style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', marginBottom: '0.75rem' }}>Items</h4>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                maxHeight: order.items.length > 3 ? '150px' : 'auto',
                overflowY: order.items.length > 3 ? 'auto' : 'visible',
                marginBottom: '1rem'
              }}>
                {order.items.map(item => (
                  <li key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--border-color-light)',
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)'
                  }}>
                    <div style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.meal_details ? item.meal_details.name : 
                       item.custom_meal_details ? item.custom_meal_details.name : 
                       `Meal #${item.meal || item.custom_meal}`} 
                      x {item.quantity}
                    </div>
                    <div style={{ fontWeight: '500' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
              
              <div style={{ marginTop: 'auto' }}>
                <Link 
                  to={`/orders/${order.id}`} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: 'clamp(0.5rem, 2vw, 0.75rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
                >
                  View Order Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
