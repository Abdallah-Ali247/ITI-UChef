import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { 
  fetchRestaurantByOwner, 
  updateRestaurant 
} from '../../store/slices/restaurantSlice';
import { 
  fetchUserOrders, 
  updateOrderStatus 
} from '../../store/slices/orderSlice';
import { fetchMeals } from '../../store/slices/mealSlice';

const API_URL = 'http://localhost:8000/api';

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { currentRestaurant, loading: restaurantLoading, error: restaurantError } = useSelector(state => state.restaurants);
  const { orders, loading: ordersLoading, error: ordersError } = useSelector(state => state.orders);
  const { meals, loading: mealsLoading, error: mealsError } = useSelector(state => state.meals);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    description: '',
    address: '',
    phone_number: '',
    opening_time: '',
    closing_time: '',
    is_active: true,
    logo: null
  });
  
  const [ingredients, setIngredients] = useState([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [ingredientsError, setIngredientsError] = useState(null);
  
  const [mealSearchTerm, setMealSearchTerm] = useState('');
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  
  // Cancellation reason state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.user_type !== 'restaurant') {
      navigate('/');
      return;
    }
    
    dispatch(fetchRestaurantByOwner());
  }, [dispatch, isAuthenticated, navigate, user]);
  
  useEffect(() => {
    if (currentRestaurant) {
      setRestaurantData({
        name: currentRestaurant.name || '',
        description: currentRestaurant.description || '',
        address: currentRestaurant.address || '',
        phone_number: currentRestaurant.phone_number || '',
        opening_time: currentRestaurant.opening_time || '',
        closing_time: currentRestaurant.closing_time || '',
        is_active: currentRestaurant.is_active || false
      });
      
      // Fetch orders and meals for this restaurant
      dispatch(fetchUserOrders());
      dispatch(fetchMeals({ restaurantId: currentRestaurant.id }));
      
      // Fetch ingredients
      fetchIngredients();
    }
  }, [dispatch, currentRestaurant]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setRestaurantData({
        ...restaurantData,
        [name]: files[0]
      });
    } else {
      setRestaurantData({
        ...restaurantData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', restaurantData.name);
    formData.append('description', restaurantData.description);
    formData.append('address', restaurantData.address);
    formData.append('phone_number', restaurantData.phone_number);
    formData.append('opening_time', restaurantData.opening_time);
    formData.append('closing_time', restaurantData.closing_time);
    formData.append('is_active', restaurantData.is_active);
    
    // Add logo if provided
    if (restaurantData.logo) {
      formData.append('logo', restaurantData.logo);
    }
    
    // Use axios directly for multipart/form-data
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }
    
    axios.put(
      `${API_URL}/restaurants/restaurants/${currentRestaurant.id}/`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    )
      .then(response => {
        setEditMode(false);
        alert('Restaurant details updated successfully!');
        // Refresh restaurant data
        dispatch(fetchRestaurantByOwner());
      })
      .catch(error => {
        console.error('Failed to update restaurant:', error);
        alert(
          error.response?.data?.detail || 
          JSON.stringify(error.response?.data) || 
          'Failed to update restaurant. Please try again.'
        );
      });
  };
  
  const handleStatusChange = (orderId, newStatus) => {
    // If status is cancelled, show modal to get reason
    if (newStatus === 'cancelled') {
      setCancelOrderId(orderId);
      setShowCancelModal(true);
      return;
    }
    
    // Otherwise proceed with normal status update
    dispatch(updateOrderStatus({
      orderId,
      status: newStatus
    }))
      .then(resultAction => {
        if (updateOrderStatus.fulfilled.match(resultAction)) {
          alert(`Order #${orderId} status updated to ${newStatus}`);
        }
      });
  };
  
  const fetchIngredients = async () => {
    if (!currentRestaurant) return;
    
    setIngredientsLoading(true);
    setIngredientsError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(
        `${API_URL}/restaurants/restaurants/${currentRestaurant.id}/ingredients/`,
        {
          headers: {
            Authorization: `Token ${token}`
          }
        }
      );
      
      setIngredients(response.data);
    } catch (err) {
      console.error('Failed to fetch ingredients:', err);
      setIngredientsError(
        err.response?.data?.detail || 
        'Failed to load ingredients. Please try again.'
      );
    } finally {
      setIngredientsLoading(false);
    }
  };
  
  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }
      
      await axios.delete(`${API_URL}/meals/meals/${mealId}/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      
      // Refresh meals list
      dispatch(fetchMeals({ restaurantId: currentRestaurant.id }));
      alert('Meal deleted successfully');
    } catch (err) {
      console.error('Failed to delete meal:', err);
      alert(
        err.response?.data?.detail || 
        JSON.stringify(err.response?.data) || 
        'Failed to delete meal. Please try again.'
      );
    }
  };
  
  const handleDeleteIngredient = async (ingredientId) => {
    if (!window.confirm('Are you sure you want to delete this ingredient? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }
      
      await axios.delete(`${API_URL}/restaurants/ingredients/${ingredientId}/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      
      // Refresh ingredients list
      fetchIngredients();
      alert('Ingredient deleted successfully');
    } catch (err) {
      console.error('Failed to delete ingredient:', err);
      alert(
        err.response?.data?.detail || 
        JSON.stringify(err.response?.data) || 
        'Failed to delete ingredient. Please try again.'
      );
    }
  };
  
  // Handle cancellation with reason
  const handleCancelSubmit = () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }
    
    dispatch(updateOrderStatus({
      orderId: cancelOrderId,
      status: 'cancelled',
      reason: cancelReason
    }))
      .then(resultAction => {
        if (updateOrderStatus.fulfilled.match(resultAction)) {
          alert(`Order #${cancelOrderId} has been cancelled`);
          // Reset modal state
          setShowCancelModal(false);
          setCancelOrderId(null);
          setCancelReason('');
        }
      });
  };
  
  if (restaurantLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (restaurantError) {
    // Check if the error is that the restaurant doesn't exist yet
    if (typeof restaurantError === 'object' && restaurantError.detail === 'You do not have a restaurant set up yet.') {
      return (
        <div className="create-restaurant-prompt" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h2>Welcome to UChef!</h2>
          <p>You don't have a restaurant set up yet. Let's create one to get started.</p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1.5rem' }}
            onClick={() => navigate('/create-restaurant')}
          >
            Create Your Restaurant
          </button>
        </div>
      );
    }
    
    // Other errors
    return (
      <div className="alert alert-danger">
        {typeof restaurantError === 'object' ? Object.values(restaurantError).flat().join(', ') : restaurantError}
      </div>
    );
  }
  
  if (!currentRestaurant) {
    return (
      <div className="alert alert-warning">
        <p>You don't have a restaurant set up yet.</p>
        <button 
          className="btn btn-primary" 
          style={{ marginTop: '1rem' }}
          onClick={() => navigate('/create-restaurant')}
        >
          Create Restaurant
        </button>
      </div>
    );
  }
  
  return (
    <div className="restaurant-dashboard">
      <h1>Restaurant Dashboard</h1>
      
      <div className="menu-tabs" style={{ marginTop: '2rem' }}>
        <div 
          className={`menu-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </div>
        <div 
          className={`menu-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </div>
        <div 
          className={`menu-tab ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menu Management
        </div>
        <div 
          className={`menu-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setActiveTab('ingredients')}
        >
          Ingredients
        </div>
      </div>
      
      <div className="tab-content" style={{ marginTop: '2rem' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Restaurant Details</h2>
              <button 
                className="btn btn-outline"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Cancel' : 'Edit Details'}
              </button>
            </div>
            
            {editMode ? (
              <form onSubmit={handleSubmit}>
                <div className="card">
                  <div className="card-body">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">Restaurant Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={restaurantData.name}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="description" className="form-label">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={restaurantData.description}
                        onChange={handleInputChange}
                        className="form-control"
                        rows="3"
                        required
                      ></textarea>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="address" className="form-label">Address</label>
                      <textarea
                        id="address"
                        name="address"
                        value={restaurantData.address}
                        onChange={handleInputChange}
                        className="form-control"
                        rows="2"
                        required
                      ></textarea>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone_number" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="phone_number"
                        name="phone_number"
                        value={restaurantData.phone_number}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label htmlFor="opening_time" className="form-label">Opening Time</label>
                        <input
                          type="time"
                          id="opening_time"
                          name="opening_time"
                          value={restaurantData.opening_time}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="closing_time" className="form-label">Closing Time</label>
                        <input
                          type="time"
                          id="closing_time"
                          name="closing_time"
                          value={restaurantData.closing_time}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={restaurantData.is_active}
                        onChange={handleInputChange}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <label htmlFor="is_active">Restaurant is currently open</label>
                    </div>
                    
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                      <label htmlFor="logo" className="form-label">Restaurant Logo</label>
                      <input
                        type="file"
                        id="logo"
                        name="logo"
                        onChange={handleInputChange}
                        className="form-control"
                        accept="image/*"
                      />
                      <small className="form-text text-muted">Upload a new logo only if you want to change the current one</small>
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <img 
                      src={currentRestaurant.logo || 'https://via.placeholder.com/100x100?text=Logo'} 
                      alt={currentRestaurant.name} 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '1.5rem', borderRadius: 'var(--border-radius)' }}
                    />
                    <div>
                      <h3>{currentRestaurant.name}</h3>
                      <p>{currentRestaurant.description}</p>
                      <p>
                        <span className={`order-status ${currentRestaurant.is_active ? 'status-confirmed' : 'status-cancelled'}`}>
                          {currentRestaurant.is_active ? 'Open' : 'Closed'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="restaurant-details">
                    <div className="detail-item" style={{ marginBottom: '1rem' }}>
                      <h4>Address</h4>
                      <p>{currentRestaurant.address}</p>
                    </div>
                    
                    <div className="detail-item" style={{ marginBottom: '1rem' }}>
                      <h4>Contact</h4>
                      <p>{currentRestaurant.phone_number}</p>
                    </div>
                    
                    <div className="detail-item" style={{ marginBottom: '1rem' }}>
                      <h4>Hours</h4>
                      <p>{currentRestaurant.opening_time} - {currentRestaurant.closing_time}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="dashboard-stats" style={{ marginTop: '2rem' }}>
              <h2>Statistics</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3>{orders?.length || 0}</h3>
                    <p>Total Orders</p>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3>{meals?.length || 0}</h3>
                    <p>Menu Items</p>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3>
                      {orders
                        ? orders.filter(order => order.status === 'pending').length
                        : 0
                      }
                    </h3>
                    <p>Pending Orders</p>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3>
                      ${orders
                        ? orders.reduce((total, order) => total + parseFloat(order?.total_price || 0), 0).toFixed(2)
                        : '0.00'
                      }
                    </h3>
                    <p>Total Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="orders-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Manage Orders</h2>
            </div>
            
            {ordersLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : ordersError ? (
              <div className="alert alert-danger">
                {typeof ordersError === 'object' ? Object.values(ordersError).flat().join(', ') : ordersError}
              </div>
            ) : orders?.length === 0 ? (
              <div className="alert alert-info">
                No orders have been placed yet.
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  
                  <div key={order.id} className="card" style={{ marginBottom: '1rem' }}>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>

                          <h3>Order #{order.id}</h3>
                          <p><small>{new Date(order.created_at).toLocaleString()}</small></p>
                          <p><strong>Customer:</strong> {order.user_username || 'Anonymous'}</p>
                          <p><strong>Total:</strong> ${order.total_price}</p>
                          <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
                          
                          {order.delivery_notes && (
                            <p><strong>Notes:</strong> {order.delivery_notes}</p>
                          )}
                        </div>
                        
                        <div>
                          <span className={`order-status status-${order.status}`} style={{ marginBottom: '1rem', display: 'inline-block' }}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          
                          <div className="form-group">
                            <label htmlFor={`status-${order.id}`} className="form-label">Update Status</label>
                            <select
                              id={`status-${order.id}`}
                              className="form-control"
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready for Pickup/Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '1.5rem' }}>
                        <h4>Order Items</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {order.items.map(item => (
                            <li 
                              key={item.id} 
                              style={{ 
                                padding: '0.5rem 0', 
                                borderBottom: '1px solid var(--light-gray)',
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div>
                                <strong>
                                  {item.meal_details ? item.meal_details.name : item.custom_meal_details.name}
                                  {item.custom_meal_details && <span style={{ color: '#666' }}> (Custom)</span>}
                                </strong>
                                <p>Quantity: {item.quantity}</p>
                                
                                {item.special_instructions && (
                                  <p><small>Special instructions: {item.special_instructions}</small></p>
                                )}
                              </div>
                              <div>
                                ${(item.price * item.quantity).toFixed(2)}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div className="menu-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Menu Management</h2>
              <Link to="/add-meal" className="btn btn-primary">
                Add New Meal
              </Link>
            </div>
            
            <div className="search-container" style={{ marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search meals by name, category, or description..."
                  value={mealSearchTerm}
                  onChange={(e) => setMealSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <span style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#666'
                }}>
                  🔍
                </span>
                {mealSearchTerm && (
                  <button 
                    onClick={() => setMealSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {mealsLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : mealsError ? (
              <div className="alert alert-danger">
                {typeof mealsError === 'object' ? Object.values(mealsError).flat().join(', ') : mealsError}
              </div>
            ) : meals?.length === 0 ? (
              <div className="alert alert-info">
                You haven't added any meals to your menu yet.
              </div>
            ) : (
              <div className="meals-list">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Meal</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Price</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meals
                      .filter(meal => {
                        if (!mealSearchTerm) return true;
                        const searchTermLower = mealSearchTerm.toLowerCase();
                        return (
                          meal.name.toLowerCase().includes(searchTermLower) ||
                          (meal.description && meal.description.toLowerCase().includes(searchTermLower)) ||
                          (meal.category_name && meal.category_name.toLowerCase().includes(searchTermLower))
                        );
                      })
                      .map(meal => (
                      <tr key={meal.id} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {meal.image && (
                              <img 
                                src={meal.image} 
                                alt={meal.name} 
                                style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '0.75rem', borderRadius: 'var(--border-radius-sm)' }}
                              />
                            )}
                            <div>
                              <strong>{meal.name}</strong>
                              <p><small>{meal.description.substring(0, 50)}...</small></p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{meal.category_name || 'Uncategorized'}</td>
                        <td style={{ padding: '0.75rem' }}>${meal.base_price}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`order-status ${meal.is_available ? 'status-confirmed' : 'status-cancelled'}`}>
                            {meal.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to={`/edit-meal/${meal.id}`} className="btn btn-sm btn-outline">
                              Edit
                            </Link>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteMeal(meal.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Ingredients Tab */}
        {activeTab === 'ingredients' && (
          <div className="ingredients-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Ingredients Management</h2>
              <Link to="/add-ingredient" className="btn btn-primary">
                Add New Ingredient
              </Link>
            </div>
            
            <div className="search-container" style={{ marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search ingredients by name, unit, or description..."
                  value={ingredientSearchTerm}
                  onChange={(e) => setIngredientSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <span style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#666'
                }}>
                  🔍
                </span>
                {ingredientSearchTerm && (
                  <button 
                    onClick={() => setIngredientSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            <div className="alert alert-info">
              <p>Manage your restaurant's ingredients inventory here. Add, edit, and update stock levels.</p>
            </div>
            
            {ingredientsLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : ingredientsError ? (
              <div className="alert alert-danger">
                {typeof ingredientsError === 'object' ? Object.values(ingredientsError).flat().join(', ') : ingredientsError}
              </div>
            ) : ingredients?.length === 0 ? (
              <div className="alert alert-info">
                You haven't added any ingredients to your inventory yet.
              </div>
            ) : (
              <div className="ingredients-list">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ingredient</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Unit</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Quantity</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Price/Unit</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients
                      .filter(ingredient => {
                        if (!ingredientSearchTerm) return true;
                        const searchTermLower = ingredientSearchTerm.toLowerCase();
                        return (
                          ingredient.name.toLowerCase().includes(searchTermLower) ||
                          (ingredient.description && ingredient.description.toLowerCase().includes(searchTermLower)) ||
                          (ingredient.unit && ingredient.unit.toLowerCase().includes(searchTermLower)) ||
                          (ingredient.allergen_type && ingredient.allergen_type.toLowerCase().includes(searchTermLower))
                        );
                      })
                      .map(ingredient => (
                      <tr key={ingredient.id} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {ingredient.image && (
                              <img 
                                src={ingredient.image} 
                                alt={ingredient.name} 
                                style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '0.75rem', borderRadius: 'var(--border-radius-sm)' }}
                              />
                            )}
                            <div>
                              <strong>{ingredient.name}</strong>
                              {ingredient.description && (
                                <p><small>{ingredient.description.substring(0, 50)}...</small></p>
                              )}
                              {ingredient.is_allergen && (
                                <span style={{ 
                                  display: 'inline-block',
                                  fontSize: '0.75rem',
                                  padding: '0.15rem 0.5rem',
                                  backgroundColor: '#ffcccc',
                                  color: '#cc0000',
                                  borderRadius: 'var(--border-radius-sm)',
                                  marginTop: '0.25rem'
                                }}>
                                  Allergen: {ingredient.allergen_type || 'Yes'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{ingredient.unit}</td>
                        <td style={{ padding: '0.75rem' }}>{ingredient.quantity}</td>
                        <td style={{ padding: '0.75rem' }}>${ingredient.price_per_unit}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`order-status ${ingredient.is_available ? 'status-confirmed' : 'status-cancelled'}`}>
                            {ingredient.is_available ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to={`/edit-ingredient/${ingredient.id}`} className="btn btn-sm btn-outline">
                              Edit
                            </Link>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteIngredient(ingredient.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Cancellation Reason Modal */}
        {showCancelModal && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div className="modal-content" style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: 'var(--border-radius)',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3>Provide Cancellation Reason</h3>
              <p>Please provide a reason for cancelling order #{cancelOrderId}. This will be sent to the customer.</p>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="cancelReason" className="form-label">Cancellation Reason</label>
                <textarea 
                  id="cancelReason"
                  className="form-control"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows="3"
                  placeholder="Example: Out of stock items, outside delivery area, etc."
                  required
                />
              </div>
              
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelOrderId(null);
                    setCancelReason('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleCancelSubmit}
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDashboard;
