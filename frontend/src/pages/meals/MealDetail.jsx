import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMealById } from '../../store/slices/mealSlice';
import Swal from 'sweetalert2';

import { addToCartWithConfirmation } from '../../utils/cartUtils';
import ReviewList from '../../components/reviews/ReviewList';

const MealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentMeal, loading, error } = useSelector(state => state.meals);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  useEffect(() => {
    dispatch(fetchMealById(id));
  }, [dispatch, id]);
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };
  
  const handleAddToCart = async () => {
    if (!currentMeal) return;
    
    // Create the cart item
    const cartItem = {
      id: currentMeal.id,
      name: currentMeal.name,
      price: currentMeal.base_price,
      image: currentMeal.image,
      type: 'regular',
      quantity,
      specialInstructions
    };
    
    // Use the utility function that handles restaurant conflicts
    const added = await addToCartWithConfirmation(
      cartItem,
      currentMeal.restaurant,
      currentMeal.restaurant_name
    );
    
    // Only show success and navigate if the item was added
    if (added) {
      // Show success message with SweetAlert2 instead of native alert
      await Swal.fire({
        icon: 'success',
        title: 'Added to Cart',
        text: `${currentMeal.name} added to cart!`,
        timer: 2000,
        showConfirmButton: false
      });
      navigate('/cart');
    }
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
  
  if (!currentMeal) {
    return (
      <div className="alert alert-warning">
        Meal not found.
      </div>
    );
  }
  
  return (
    <div className="meal-detail-page">
      <div className="breadcrumb" style={{ marginBottom: '1rem' }}>
        <Link to="/restaurants">Restaurants</Link> &gt; 
        <Link to={`/restaurants/${currentMeal.restaurant}`}> {currentMeal.restaurant_name}</Link> &gt; 
        <span> {currentMeal.name}</span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="meal-image-container">
          <img 
            src={currentMeal.image || 'https://via.placeholder.com/500x400?text=Meal'} 
            alt={currentMeal.name} 
            style={{ width: '100%', borderRadius: 'var(--border-radius)', objectFit: 'cover' }}
          />
        </div>
        
        <div className="meal-details">
          <h1>{currentMeal.name}</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {currentMeal.category_name} • {currentMeal.restaurant_name}
          </p>
          
          <div className="meal-price" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0' }}>
            ${currentMeal.base_price}
          </div>
          
          <div className="meal-availability" style={{ marginBottom: '1rem' }}>
            {currentMeal.is_available ? (
              <span style={{ color: 'var(--success-color)' }}>Available</span>
            ) : (
              <span style={{ color: 'var(--danger-color)' }}>Currently Unavailable</span>
            )}
          </div>
          
          <div className="meal-description" style={{ marginBottom: '2rem' }}>
            <h3>Description</h3>
            <p>{currentMeal.description}</p>
          </div>
          
          {currentMeal.meal_ingredients && currentMeal.meal_ingredients.length > 0 && (
            <div className="meal-ingredients" style={{ marginBottom: '2rem' }}>
              <h3>Ingredients</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                {currentMeal.meal_ingredients.map(item => (
                  <li key={item.id}>
                    {item.ingredient_details.name} ({item.quantity} {item.ingredient_details.unit})
                  
                    {/* {item.ingredient_details.quantity}  */}
                  
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {currentMeal.is_available && (
            <div className="order-options">
              <div className="form-group">
                <label htmlFor="quantity" className="form-label">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="form-control"
                  style={{ width: '100px' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="specialInstructions" className="form-label">Special Instructions</label>
                <textarea
                  id="specialInstructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="form-control"
                  placeholder="Any special requests or allergies?"
                  rows="3"
                ></textarea>
              </div>
              
              <button 
                className="btn btn-primary" 
                onClick={handleAddToCart}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                Add to Cart - ${(currentMeal.base_price * quantity).toFixed(2)}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="meal-reviews" style={{ marginTop: '3rem' }}>
        <h2>Customer Reviews</h2>
        <ReviewList type="meal" itemId={id} />
      </div>
    </div>
  );
};

export default MealDetail;
