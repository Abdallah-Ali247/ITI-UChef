import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants } from '../store/slices/restaurantSlice';
import { fetchMeals } from '../store/slices/mealSlice';
import axios from 'axios';
import { Carousel, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaStar, FaUtensils, FaDollarSign, FaAngleRight, FaTags, FaStore, FaHeart, FaTag, FaDice, FaShoppingCart } from 'react-icons/fa';
import { FaPizzaSlice, FaShippingFast, FaHamburger, FaCheese, FaCarrot, FaWineGlassAlt, FaIceCream, FaAppleAlt, FaEgg, FaCoffee, FaBreadSlice } from "react-icons/fa";
import { toast } from 'react-toastify';
import WeatherRecommendation from '../components/WeatherRecommendation';
import '../styles/weather.css';
import '../styles/feature-cards.css';
import '../styles/custom-meals.css';

const Home = () => {
  const dispatch = useDispatch();
  const { restaurants, loading: restaurantsLoading } = useSelector(state => state.restaurants);
  const { meals, loading: mealsLoading } = useSelector(state => state.meals);
  const [topCustomMeals, setTopCustomMeals] = useState([]);
  const [loadingCustomMeals, setLoadingCustomMeals] = useState(true);

  // Random meal feature states
  const [randomMeal, setRandomMeal] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showRandomMeal, setShowRandomMeal] = useState(false);

  // Pre-generate accent classes instead of using the hook in map functions
  const accentClasses = ['card-accent-1', 'card-accent-2', 'card-accent-3', 'card-accent-4', 'card-accent-5'];
  
  // Function to get accent class based on index
  const getAccentClass = (index) => accentClasses[index % accentClasses.length];
  
  // Function to format price with proper currency display
  const formatPrice = (meal) => {
    // First check if we have a calculated price from ingredients (like in CustomMealDetail)
    if (typeof meal.calculatedPrice === 'number') {
      return meal.calculatedPrice.toFixed(2);
    }
    // If no calculated price, try other price properties
    else if (typeof meal.total_price === 'number') {
      return meal.total_price.toFixed(2);
    } else if (typeof meal.price === 'number') {
      return meal.price.toFixed(2);
    } else if (typeof meal.base_price === 'number') {
      return meal.base_price.toFixed(2);
    } else {
      // If no numeric price is found, return a reasonable default
      return '0.00';
    }
  };

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchMeals({ isPublic: true }));
    
    // Fetch top custom meals with ingredients to calculate real price
    const fetchTopCustomMeals = async () => {
      try {
        setLoadingCustomMeals(true);
        // First get the top rated custom meals
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/top-rated/`
        );
        
        // Make sure we're dealing with an array
        const data = Array.isArray(response.data) ? response.data : [];
        
        // For each meal, fetch its ingredients to calculate the real price
        const mealsWithPrices = await Promise.all(
          data.map(async (meal) => {
            try {
              // Fetch ingredients for this custom meal
              const ingredientsResponse = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/${meal.id}/ingredients/`
              );
              
              // Get the ingredients array
              const mealIngredients = ingredientsResponse.data;
              
              // Calculate total price based on ingredients exactly like in CustomMealDetail
              const calculatedPrice = mealIngredients.reduce((sum, item) => {
                return sum + (item.ingredient_details.price_per_unit * item.quantity);
              }, 0);
              
              // Return the meal with the calculated price
              return {
                ...meal,
                ingredients: mealIngredients,
                calculatedPrice: calculatedPrice
              };
            } catch (error) {
              console.error(`Error fetching ingredients for meal ${meal.id}:`, error);
              return meal; // Return original meal if ingredients fetch fails
            }
          })
        );
        
        setTopCustomMeals(mealsWithPrices);
      } catch (error) {
        console.error('Error fetching top custom meals:', error);
        setTopCustomMeals([]);
      } finally {
        setLoadingCustomMeals(false);
      }
    };
    
    fetchTopCustomMeals();
  }, [dispatch]);

  // Filtered featured meals for display - ensure we have meals to work with
  const featuredMeals = useMemo(() => {
    // Make sure we have at least some meals to display
    return meals && meals.length > 0 ? meals.slice(0, 6) : [];
  }, [meals]);

  // Random meal selection function with animation
  const selectRandomMeal = () => {
    // Safety check for meals array
    if (!meals || meals.length === 0) {
      console.error("No meals available for random selection");
      toast.error('No meals available right now! Please try again later.');
      return;
    }
    
    if (isShuffling) return;
    
    // Always get latest meals directly from the store
    const availableMeals = [...meals]; // Create copy of all meals
    console.log("Available meals for random selection:", availableMeals.length);
    
    setIsShuffling(true);
    setShowRandomMeal(false);
    
    let shuffleCount = 0;
    const maxShuffles = 12;
    
    // Run the shuffle animation
    const shuffleInterval = setInterval(() => {
      if (availableMeals.length > 0) {
        shuffleCount++;
        const randomIndex = Math.floor(Math.random() * availableMeals.length);
        const selectedMeal = availableMeals[randomIndex];
        console.log(`Shuffle ${shuffleCount}/${maxShuffles}: Selected meal ID: ${selectedMeal?.id}`);
        
        // Update the randomly selected meal
        setRandomMeal(selectedMeal);
        
        // Once we've reached the max shuffles, complete the animation
        if (shuffleCount >= maxShuffles) {
          clearInterval(shuffleInterval);
          setIsShuffling(false);
          setShowRandomMeal(true);
          toast.success('Your random meal has been selected! 🎲', {
            position: "top-center",
            autoClose: 3000
          });
        }
      } else {
        // No meals available, clear the interval
        clearInterval(shuffleInterval);
        setIsShuffling(false);
        toast.error('No meals available for selection!');
      }
    }, 200);
  };

  // Get featured restaurants (first 6)
  const featuredRestaurants = restaurants.slice(0, 6);
  
  // Custom CSS for the carousel
  const carouselStyles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0 15px',
      overflow: 'hidden',
      position: 'relative',
    },
    item: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '10px',
    },
    card: {
      width: '100%',
      maxWidth: '450px',
      margin: '0 auto',
      height: '100%',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease',
    },
  };

  useEffect(() => {
    // Add custom styles to make the carousel look better
    const style = document.createElement('style');
    style.innerHTML = `
      .carousel-control-prev, .carousel-control-next {
        width: 10%;
        opacity: 0.8;
      }
      .carousel-indicators {
        bottom: -10px;
      }
      .carousel-indicators button {
        background-color: var(--primary-color);
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin: 0 5px;
      }
      .carousel-inner {
        padding-bottom: 30px;
      }
      .carousel-item {
        transition: transform 0.6s ease-in-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="home-container animate-fade-in">
      {/* Hero Section with new styling */}
      <section className="hero animate-scale-up" style={{ 
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        padding: '8rem 1rem',
        textAlign: 'center',
        borderRadius: '0',
        marginBottom: '0',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)' }}>
          <h1 className="animate-slide-in-bottom" style={{ fontSize: '3.2rem', marginBottom: '1.5rem', fontWeight: '700' }}>Create Your Perfect Meal</h1>
          <p className="animate-slide-in-bottom stagger-delay-1" style={{ fontSize: '1.3rem', maxWidth: '800px', margin: '0 auto 2rem', lineHeight: '1.7' }}>
            UChef lets you customize your meals exactly how you want them. Choose your ingredients, control your portions, and enjoy your perfect meal.
          </p>
          <div className="hero-buttons animate-slide-in-bottom stagger-delay-2" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/restaurants" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
              Order Now
            </Link>
            <Link to="/top-custom-meals" className="btn btn-outline" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem', background: 'transparent', color: 'white', border: '2px solid white' }}>
              Explore Meals
            </Link>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color), var(--primary-color))' }}></div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works animate-fade-in" style={{ 
        padding: '5rem 2rem', 
        backgroundColor: 'var(--bg-color-secondary)', 
        borderRadius: '16px', 
        margin: '3rem auto', 
        maxWidth: '1200px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto 4rem', textAlign: 'center' }}>
          <h2 className="section-title animate-slide-in-left" style={{ 
            textAlign: 'center', 
            marginBottom: '1.5rem', 
            color: 'var(--text-color)', 
            fontSize: '2.6rem',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>How It Works</h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: 'var(--text-color-secondary)', 
            lineHeight: '1.7',
            maxWidth: '650px',
            margin: '0 auto'
          }}>
            Our simple three-step process makes creating your perfect meal easier than ever before.
          </p>
        </div>
        
        <div className="features-container">
          <div className="feature-card feature-card-1 animate-slide-in-bottom stagger-delay-1">
            <div className="feature-icon-container">
              <FaUtensils className="feature-icon" />
            </div>
            <div className="feature-card-content">
              <h3>Choose Your Ingredients</h3>
              <p>Browse through our extensive catalog of high-quality ingredients.</p>
            </div>
          </div>
          <div className="feature-card feature-card-2 animate-slide-in-bottom stagger-delay-2">
            <div className="feature-icon-container">
              <FaPizzaSlice className="feature-icon" />
            </div>
            <div className="feature-card-content">
              <h3>Customize Your Meal</h3>
              <p>Personalize portion sizes and ingredient combinations.</p>
            </div>
          </div>
          <div className="feature-card feature-card-3 animate-slide-in-bottom stagger-delay-3">
            <div className="feature-icon-container">
              <FaShippingFast className="feature-icon" />
            </div>
            <div className="feature-card-content">
              <h3>Enjoy Delivery</h3>
              <p>Get your perfect meal delivered right to your doorstep.</p>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/meals" className="btn btn-outline" style={{ 
            padding: '0.85rem 2rem',
            fontSize: '1.05rem',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}>
            Start Creating Your Meal
          </Link>
        </div>
      </section>

      {/* Featured Restaurants Section */}
      <section className="featured-restaurants animate-fade-in" style={{ padding: '4rem 2rem', backgroundColor: 'var(--bg-color)', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="section-title animate-slide-in-right" style={{ textAlign: 'center', marginBottom: '3rem', color: 'var(--text-color-primary)', fontSize: '2.4rem' }}>Featured Restaurants</h2>
        
        {restaurantsLoading ? (
          <div className="loading-container">
            <div className="loading-shimmer" style={{ height: '300px', borderRadius: '10px' }}></div>
          </div>
        ) : (
          <div className="restaurant-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {featuredRestaurants.slice(0, 3).map((restaurant, index) => {
              const accentClass = getAccentClass(index);
              return (
                <div key={restaurant.id} className={`card ${accentClass} animate-slide-in-bottom stagger-delay-${index + 1}`}>
                  <img 
                    src={restaurant.logo || 'https://via.placeholder.com/300x200?text=Restaurant'} 
                    alt={restaurant.name} 
                    className="card-img"
                  />
                  <div className="card-body">
                    <div className="tags-container">
                      <span className="tag tag-accent">
                        <FaTags style={{ marginRight: '0.3rem' }} /> 
                        {restaurant.cuisine || 'Restaurant'}
                      </span>
                    </div>
                    <h3 className="card-title">{restaurant.name}</h3>
                    <div className="rating">
                      <FaStar /><FaStar /><FaStar /><FaStar /><FaStar style={{ opacity: 0.4 }} />
                      <span className="rating-text">4.0 (15 reviews)</span>
                    </div>
                    <p className="card-text">{restaurant.description?.substring(0, 80)}{restaurant.description?.length > 80 ? '...' : ''}</p>
                  </div>
                  <div className="card-footer">
                    <Link to={`/restaurants/${restaurant.id}`} className="btn btn-primary">
                      View Menu <FaAngleRight style={{ marginLeft: '0.3rem' }} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/restaurants" className="btn btn-outline">
            View All Restaurants
          </Link>
        </div>
      </section>

      {/* Featured Meals Section */}
      <section className="featured-meals animate-fade-in" style={{ padding: '4rem 2rem', backgroundColor: 'var(--bg-color-secondary)', borderRadius: '10px', margin: '2rem auto', maxWidth: '1200px' }}>
        <h2 className="section-title animate-slide-in-left" style={{ textAlign: 'center', marginBottom: '3rem', color: 'var(--text-color-primary)', fontSize: '2.4rem' }}>Featured Meals</h2>
        
        {mealsLoading ? (
          <div className="loading-container">
            <div className="loading-shimmer" style={{ height: '300px', borderRadius: '10px' }}></div>
          </div>
        ) : (
          <div className="meal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {featuredMeals.slice(0, 3).map((meal, index) => {
              const accentClass = getAccentClass(index);
              return (
                <div key={meal.id} className={`card ${accentClass} animate-slide-in-bottom stagger-delay-${index + 1}`}>
                  <img
                    src={meal.image || 'https://via.placeholder.com/300x200?text=Meal'}
                    alt={meal.name}
                    className="card-img"
                  />
                  <div className="card-body">
                    <div className="tags-container">
                      <span className="tag tag-accent">
                        <FaTag style={{ marginRight: '0.3rem' }} />
                        {meal.category || 'Meal'}
                      </span>
                    </div>
                    <h3 className="card-title">{meal.name}</h3>
                    <div className="rating">
                      <FaStar /><FaStar /><FaStar /><FaStar /><FaStar style={{ opacity: 0.4 }} />
                      <span className="rating-text">4.0 (12 reviews)</span>
                    </div>
                    <p className="card-text">{meal.description?.substring(0, 80)}{meal.description?.length > 80 ? '...' : ''}</p>
                    <div className="price-tag">
                      <FaDollarSign /> {typeof meal.base_price === 'number' ? meal.base_price.toFixed(2) : meal.base_price || '0.00'}
                    </div>
                  </div>
                  <div className="card-footer">
                    <Link to={`/meals/${meal.id}`} className="btn btn-primary">
                      View Details <FaAngleRight style={{ marginLeft: '0.3rem' }} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/meals" className="btn btn-outline animate-pulse">
            View All Meals
          </Link>
        </div>
      </section>

      {/* Random Meal Section - Moved to middle of page */}
      <section className="random-meal-section animate-fade-in" style={{ 
        padding: '4rem 2rem', 
        background: 'linear-gradient(135deg, var(--bg-color-secondary), var(--bg-color))', 
        maxWidth: '1200px', 
        margin: '2rem auto',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 className="section-title animate-slide-in-left" style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-color-primary)', fontSize: '2.4rem' }}>Feeling Lucky?</h2>
        <p className="section-subtitle" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem', color: 'var(--text-color-secondary)', fontSize: '1.2rem', lineHeight: '1.6' }}>
          Can't decide what to eat? Let us pick a random meal for you! Click the dice to shuffle through our delicious options.
        </p>
        
        {/* Always show the random button unless we're currently showing a random meal result */}
        {(!showRandomMeal || isShuffling) && (
          <div className="random-meal-button-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <button 
              onClick={selectRandomMeal} 
              disabled={isShuffling || mealsLoading || meals.length === 0} 
              className="random-meal-button animate-pulse" 
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(45deg, var(--primary-color), var(--accent-color-primary))',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: mealsLoading || meals.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2), 0 0 15px rgba(255, 165, 0, 0.5) inset',
                transition: 'all 0.3s ease',
                padding: '2rem'
              }}
            >
              {isShuffling ? (
                <>
                  <span className="animate-spin" style={{ display: 'block', fontSize: '4rem', marginBottom: '1rem' }}>
                    <FaDice style={{ color: 'var(--dice-color)' }} />
                  </span>
                  <span>Shuffling...</span>
                </>
              ) : mealsLoading ? (
                <>
                  <span style={{ display: 'block', fontSize: '4rem', marginBottom: '1rem', opacity: 0.7 }}>
                    <FaDice style={{ color: 'var(--dice-color)' }} />
                  </span>
                  <span>Loading meals...</span>
                </>
              ) : meals.length === 0 ? (
                <>
                  <span style={{ display: 'block', fontSize: '4rem', marginBottom: '1rem', opacity: 0.7 }}>
                    <FaDice style={{ color: 'var(--dice-color)' }} />
                  </span>
                  <span>No meals available</span>
                </>
              ) : (
                <>
                  <span style={{ display: 'block', fontSize: '4rem', marginBottom: '1rem' }}>
                    <FaDice style={{ color: 'var(--dice-color)' }} />
                  </span>
                  <span style={{ color: 'var(--text-color)' }}>Roll the Dice!</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Show the random meal result only if we have selected a meal and are not currently shuffling */}
        {showRandomMeal && randomMeal && !isShuffling && (
          <div className="random-meal-result" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <h3 className="random-meal-subtitle animate-slide-in-bottom" style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-color-primary)', fontSize: '2rem' }}>Your Random Meal is...</h3>
            
            <div className={`card animate-shuffle-in animate-spotlight ${getAccentClass(Math.floor(Math.random() * 5))}`} style={{ overflow: 'hidden', position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '2rem' }}>
                <div className="random-meal-image" style={{ height: '100%', overflow: 'hidden', borderRadius: '8px' }}>
                  <img 
                    src={randomMeal.image || 'https://via.placeholder.com/600x600?text=Random+Meal'} 
                    alt={randomMeal.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                
                <div className="random-meal-details">
                  <div className="tags-container" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="tag tag-accent animate-pulse">
                      <FaDice style={{ marginRight: '0.3rem', color: 'var(--dice-color)' }} /> Random Pick
                    </span>
                    {randomMeal.category && (
                      <span className="tag tag-accent">
                        <FaTag style={{ marginRight: '0.3rem' }} /> {randomMeal.category}
                      </span>
                    )}
                  </div>
                  
                  <h3 style={{ fontSize: '2.2rem', marginBottom: '1rem', color: 'var(--text-color-primary)' }}>{randomMeal.name}</h3>
                  
                  <div className="rating" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                    <FaStar style={{ color: 'var(--accent-color)' }} />
                    <FaStar style={{ color: 'var(--accent-color)' }} />
                    <FaStar style={{ color: 'var(--accent-color)' }} />
                    <FaStar style={{ color: 'var(--accent-color)' }} />
                    <FaStar style={{ color: 'var(--accent-color)', opacity: 0.4 }} />
                    <span className="rating-text" style={{ marginLeft: '0.5rem' }}>4.0 (10 reviews)</span>
                  </div>
                  
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-color-secondary)', lineHeight: '1.7' }}>
                    {randomMeal.description}
                  </p>
                  
                  <div className="price-tag" style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--accent-color-primary)' }}>
                    <FaDollarSign /> {typeof randomMeal.base_price === 'number' ? randomMeal.base_price.toFixed(2) : randomMeal.base_price || '0.00'}
                  </div>
                  
                  <div className="random-meal-cta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to={`/meals/${randomMeal.id}`} className="btn btn-primary animate-pulse" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FaShoppingCart /> Add to Cart
                    </Link>
                    <button 
                      onClick={selectRandomMeal} 
                      className="btn btn-outline" 
                      disabled={isShuffling} 
                      style={{ fontSize: '1.1rem', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <FaDice style={{ color: 'var(--dice-color)' }} /> Roll Again
                    </button>
                  </div>
                </div>
              </div>
              <div className="animate-confetti" style={{ height: '8px', width: '100%' }}></div>
            </div>
          </div>
        )}
      </section>

      {/* Custom Meals Section */}
      {/* <section className="custom-meals animate-fade-in" style={{ padding: '4rem 2rem', backgroundColor: 'var(--bg-color)', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="section-title animate-slide-in-right" style={{ textAlign: 'center', marginBottom: '3rem', color: 'var(--text-color-primary)', fontSize: '2.4rem' }}>Your Custom Meals</h2>
        
        {loadingCustomMeals ? (
          <div className="loading-container">
            <div className="loading-shimmer" style={{ height: '300px', borderRadius: '10px' }}></div>
          </div>
        ) : (
          <div className="meal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {topCustomMeals.map((meal, index) => {
              const accentClass = getAccentClass(index);
              return (
                <div key={meal.id} className={`card ${accentClass} animate-slide-in-bottom stagger-delay-${index + 1}`}>
                  <img
                    src={meal.image || 'https://via.placeholder.com/300x200?text=Custom+Meal'}
                    alt={meal.name || 'Custom Meal'}
                    className="card-img"
                  />
                  <div className="card-body">
                    <div className="tags-container">
                      <span className="tag tag-accent">
                        <FaTag style={{ marginRight: '0.3rem' }} /> Custom
                      </span>
                    </div>
                    <h3 className="card-title">{meal.name || `Custom Meal #${index + 1}`}</h3>
                    <p className="card-text">
                      A custom meal with {meal.ingredients?.length || 'various'} ingredients from {meal.restaurant_name || 'one of our restaurants'}.
                    </p>
                    <div className="price-tag">
                      <FaDollarSign /> {typeof meal.total_price === 'number' ? meal.total_price.toFixed(2) : meal.total_price || '12.99'}
                    </div>
                  </div>
                  <div className="card-footer">
                    <Link to={`/custom-meals/${meal.id}`} className="btn btn-primary">
                      View Details <FaAngleRight style={{ marginLeft: '0.3rem' }} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/create-meal" className="btn btn-primary animate-pulse">
            Create New Custom Meal
          </Link>
        </div>
      </section> */}

      {/* Weather-based Recommendation Section */}
      <WeatherRecommendation />
      
      {/* Top Rated Custom Meals Section */}
      <section className="custom-meals-section animate-fade-in">
        <div className="section-header">
          <h2 className="section-title animate-slide-in-right">Top Rated Custom Creations</h2>
          <p className="section-subtitle">Discover unique meals created by our community</p>
        </div>
        
        {loadingCustomMeals ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              border: '3px solid var(--border-color)', 
              borderTopColor: 'var(--primary-color)',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : (
          <div className="custom-meals-carousel">
            {topCustomMeals.length > 0 ? (
              <Carousel 
                indicators={true}
                controls={true}
                interval={4000}
                className="custom-carousel"
                pause="hover"
              >
                {topCustomMeals.map((meal, index) => {
                  // Array of food icons to use randomly
                  const foodIcons = [
                    <FaUtensils key="utensils" />,
                    <FaPizzaSlice key="pizza" />,
                    <FaHamburger key="burger" />,
                    <FaCheese key="cheese" />,
                    <FaCarrot key="carrot" />,
                    <FaWineGlassAlt key="wine" />,
                    <FaIceCream key="icecream" />,
                    <FaAppleAlt key="apple" />,
                    <FaBreadSlice key="bread" />,
                    <FaCoffee key="coffee" />
                  ];
                  
                  // Select an icon based on the meal index
                  const foodIcon = foodIcons[index % foodIcons.length];
                  
                  return (
                    <Carousel.Item key={meal.id || index}>
                      <div className="custom-meal-card">
                        <div className="custom-meal-img-container">
                          <div className="custom-meal-img-pattern" style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e94e37\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                          }}></div>
                          <div className="custom-meal-icon-wrapper">
                            {foodIcon}
                          </div>
                        </div>
                        
                        <div className="custom-meal-content">
                          <div className="custom-meal-tags">
                            <span className="custom-meal-tag">
                              <FaHeart style={{ marginRight: '0.5rem' }} /> Community Creation
                            </span>
                            {meal.category && (
                              <span className="custom-meal-tag">
                                <FaTag style={{ marginRight: '0.5rem' }} /> {meal.category}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="custom-meal-title">{meal.name || `Custom Creation #${index + 1}`}</h3>
                          
                          <div className="custom-meal-rating">
                            <div className="rating-stars">
                              <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                            </div>
                            <span>5.0 ({meal.votes || 5} votes)</span>
                          </div>
                          
                          <p className="custom-meal-description">
                            A delicious custom meal with {meal.ingredients?.length || 'various'} ingredients from {meal.restaurant_name || 'one of our premium restaurants'}.
                          </p>
                          
                          <div className="custom-meal-icons">
                            <div className="custom-meal-icon custom-meal-icon-1">
                              <FaUtensils />
                            </div>
                            <div className="custom-meal-icon custom-meal-icon-2">
                              {index % 2 === 0 ? <FaPizzaSlice /> : <FaHamburger />}
                            </div>
                            <div className="custom-meal-icon custom-meal-icon-3">
                              {index % 3 === 0 ? <FaCarrot /> : index % 3 === 1 ? <FaCheese /> : <FaWineGlassAlt />}
                            </div>
                          </div>
                        </div>
                        
                        <div className="custom-meal-footer">
                          <div className="custom-meal-price">
                            <FaDollarSign /> {formatPrice(meal)}
                          </div>
                          <Link to={`/meals/custom/${meal.id}`} className="custom-meal-button">
                            View Details <FaAngleRight />
                          </Link>
                        </div>
                      </div>
                    </Carousel.Item>
                  );
                })}
              </Carousel>
            ) : (
              <div style={{ 
                maxWidth: '600px', 
                margin: '0 auto', 
                padding: '2rem', 
                borderRadius: 'var(--border-radius)', 
                backgroundColor: 'rgba(var(--primary-color-rgb), 0.05)', 
                textAlign: 'center',
                border: '1px solid rgba(var(--primary-color-rgb), 0.1)'
              }}>
                <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-color)' }}>No Custom Meals Yet</h4>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-color-secondary)' }}>Be the first to create a custom meal and share it with the community!</p>
                <Link to="/restaurants" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaUtensils /> Create Your Own Meal
                </Link>
              </div>
            )}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/top-custom-meals" className="btn btn-primary" style={{ 
            padding: '0.85rem 2rem',
            fontSize: '1.05rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FaHeart /> View All Custom Meals
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
