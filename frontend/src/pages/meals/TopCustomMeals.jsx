import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { FaUtensils, FaStar } from 'react-icons/fa';

const TopCustomMeals = () => {
  const [topMeals, setTopMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchTopMeals = async () => {
      try {
        setLoading(true);
        console.log('Fetching from:', `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/top-rated/`);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/top-rated/`
        );
        
        // Log the response to see the structure
        console.log('Top meals response:', response.data);
        
        // Make sure we're dealing with an array
        if (Array.isArray(response.data)) {
          setTopMeals(response.data);
        } else if (response.data && typeof response.data === 'object') {
          // If it's an object with results property (common DRF pattern)
          if (Array.isArray(response.data.results)) {
            setTopMeals(response.data.results);
          } else {
            // If it's some other object, convert to array or use empty array
            console.warn('Unexpected API response format:', response.data);
            setTopMeals([]);
          }
        } else {
          console.warn('Unexpected API response format:', response.data);
          setTopMeals([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching top custom meals:', err);
        setError('Failed to load top custom meals');
        setLoading(false);
      }
    };

    fetchTopMeals();
  }, []);

  const handleAddToCart = async (meal) => {
    if (!user) {
      toast.error('Please log in to add items to your cart');
      return;
    }

    try {
      // Log the meal object to debug
      console.log('Adding meal to cart:', meal);
      
      // First, get the ingredients for the custom meal
      const ingredientsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/${meal.id}/ingredients/`
      );
      
      const ingredients = ingredientsResponse.data;
      console.log('Ingredients response:', ingredients);
      
      // Calculate total price based on ingredients
      const totalPrice = ingredients.reduce((sum, item) => {
        const ingredientPrice = item.ingredient_details.price_per_unit * item.quantity;
        return sum + ingredientPrice;
      }, 0);

      // Get restaurant information from the meal
      // Check all possible fields where restaurant ID might be stored
      let restaurantId = meal.restaurant || meal.restaurant_id;
      let restaurantName = "";
      
      // Log restaurant ID for debugging
      console.log('Initial restaurant ID:', restaurantId);
      
      // If restaurant ID is missing, try to get it from the custom meal details
      if (!restaurantId) {
        try {
          // Fetch the full custom meal details to get the restaurant ID
          console.log('Fetching meal details for ID:', meal.id);
          const mealDetailsResponse = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/${meal.id}/`
          );
          
          console.log('Meal details response:', mealDetailsResponse.data);
          
          // Check all possible fields where restaurant ID might be stored
          if (mealDetailsResponse.data) {
            restaurantId = mealDetailsResponse.data.restaurant || 
                          mealDetailsResponse.data.restaurant_id || 
                          (mealDetailsResponse.data.restaurant_details && mealDetailsResponse.data.restaurant_details.id);
            
            // Also try to get restaurant name if available
            if (mealDetailsResponse.data.restaurant_name) {
              restaurantName = mealDetailsResponse.data.restaurant_name;
            } else if (mealDetailsResponse.data.restaurant_details && mealDetailsResponse.data.restaurant_details.name) {
              restaurantName = mealDetailsResponse.data.restaurant_details.name;
            }
          }
        } catch (detailsError) {
          console.error('Error fetching custom meal details:', detailsError);
          toast.error('Could not get restaurant information for this meal');
          return;
        }
      } else {
        // Try to get restaurant name if available
        if (meal.restaurant_name) {
          restaurantName = meal.restaurant_name;
        } else if (meal.restaurant_details && meal.restaurant_details.name) {
          restaurantName = meal.restaurant_details.name;
        }
      }
      
      console.log('Final restaurant ID:', restaurantId);
      console.log('Restaurant name:', restaurantName);
      
      // For testing purposes, use a default restaurant ID if none is found
      if (!restaurantId) {
        // Get the first restaurant ID from the ingredients if possible
        if (ingredients.length > 0 && ingredients[0].ingredient_details && 
            ingredients[0].ingredient_details.restaurant) {
          restaurantId = ingredients[0].ingredient_details.restaurant;
          console.log('Using restaurant ID from ingredients:', restaurantId);
        } else {
          // As a last resort, use the first restaurant ID from the meal's user's restaurants
          // This is just a fallback for testing
          restaurantId = 1; // Default to ID 1 for testing
          restaurantName = "Default Restaurant";
          console.log('Using default restaurant ID:', restaurantId);
        }
      }
      
      // Add to Redux cart instead of making an API call
      dispatch(addToCart({
        item: {
          id: meal.id,
          customMealId: meal.id,
          name: meal.name,
          price: totalPrice,
          image: meal.image || 'https://via.placeholder.com/300x200?text=Custom+Meal',
          type: 'custom',
          ingredients: ingredients,
          restaurant: restaurantId, // Add restaurant ID to the item itself as well
          specialInstructions: meal.cooking_instructions || ''
        },
        restaurantId: restaurantId,
        restaurantName: restaurantName || "Restaurant"
      }));

      toast.success(`${meal.name} added to cart!`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add item to cart');
    }
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          style={{ 
            color: i <= Math.round(rating) ? 'var(--accent-color)' : '#e4e5e9',
            marginRight: '2px'
          }}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="loading">Loading top custom meals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="section-header text-center mb-12">
        <h1 className="section-title">Top 10 Custom Meals</h1>
        <p className="section-description">
          Discover the most delicious custom meals created by our community!
          Create your own custom meal and compete for the top spot.
        </p>
      </div>

      {topMeals.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No rated custom meals yet</h2>
          <p className="mb-6">Be the first to create and share a custom meal!</p>
          <Link to="/" className="btn btn-primary">
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="grid">
          {Array.isArray(topMeals) && topMeals.map((meal, index) => (
            <div key={meal.id} className="card">
              <div className="rank-badge" style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                zIndex: '1'
              }}>
                #{index + 1}
              </div>
              {meal.image ? (
                <img 
                  src={meal.image} 
                  alt={meal.name} 
                  className="card-img"
                />
              ) : (
                <div className="custom-meal-img-container" style={{ height: '220px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, var(--bg-accent), var(--bg-accent-secondary))' }}>
                  <div className="custom-meal-icon-wrapper" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color-tertiary))', color: 'white', fontSize: '3rem', boxShadow: '0 8px 20px rgba(var(--primary-color-rgb), 0.3)', zIndex: '1' }}>
                    <FaUtensils style={{ fontSize: '2.5rem' }} />
                  </div>
                  <div className="custom-meal-img-pattern" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: '0.1' }}></div>
                </div>
              )}
              <div className="card-body">
                <h2 className="card-title">{meal.name}</h2>
                <p className="card-creator" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Created by {meal.user_username}
                </p>
                
                <div className="reviews-summary" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
                  <div className="average-rating" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="rating-number" style={{ fontWeight: 'bold' }}>{meal.avg_rating ? meal.avg_rating.toFixed(1) : '0'}</span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {renderStars(meal.avg_rating)}
                    </div>
                    <span className="review-count" style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                      ({meal.review_count} {meal.review_count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>
                
                <p className="card-text">
                  {meal.description ? (meal.description.length > 100 ? `${meal.description.substring(0, 100)}...` : meal.description) : 'No description provided'}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <Link to={`/meals/custom/${meal.id}`} className="btn btn-outline bc">
                    View Details
                  </Link>
                  <button 
                    onClick={() => handleAddToCart(meal)} 
                    className="btn btn-primary bc"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="section-cta text-center" data-theme="light" style={{ 
        marginTop: '3rem', 
        padding: '2rem', 
        background: 'linear-gradient(135deg,rgb(228, 187, 154), #FFC107,rgb(122, 108, 77))', 
        borderRadius: 'var(--border-radius)',
        boxShadow: '0 10px 25px rgba(255, 215, 0, 0.2)',
      }}>
        <h2 style={{ 
          fontSize: '1.8rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#000',
          textShadow: '0 1px 2px rgba(255, 215, 0, 0.3)'
        }}>
          Want to compete?
        </h2>
        <p style={{ 
          marginBottom: '1.5rem',
          color: '#000',
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>
          Create your own custom meal and share it with the community to see if it can reach the top!
        </p>
        <Link to="/restaurants" className="btn btn-primary">
          Find a Restaurant
        </Link>
      </div>
    </div>
  );
};

export default TopCustomMeals;
