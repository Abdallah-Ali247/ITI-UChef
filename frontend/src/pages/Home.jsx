import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants } from '../store/slices/restaurantSlice';
import { fetchMeals } from '../store/slices/mealSlice';
import axios from 'axios';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaStar, FaUtensils, FaDollarSign, FaAngleRight, FaTags, FaStore, FaHeart, FaTag, FaDice, FaShoppingCart } from 'react-icons/fa';
import { FaPizzaSlice, FaShippingFast  } from "react-icons/fa";
import { toast } from 'react-toastify';

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

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchMeals({ isPublic: true }));
    
    // Fetch top custom meals
    const fetchTopCustomMeals = async () => {
      try {
        setLoadingCustomMeals(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/top-rated/`
        );
        
        // Make sure we're dealing with an array
        const data = Array.isArray(response.data) ? response.data : [];
        setTopCustomMeals(data);
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
  
  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

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
      <section className="how-it-works animate-fade-in" style={{ padding: '4rem 2rem', backgroundColor: 'var(--bg-color-secondary)', borderRadius: '10px', margin: '2rem auto', maxWidth: '1200px' }}>
        <h2 className="section-title animate-slide-in-left" style={{ textAlign: 'center', marginBottom: '3rem', color: 'var(--text-color-primary)', fontSize: '2.4rem' }}>How It Works</h2>
        <div className="steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="step animate-slide-in-bottom stagger-delay-1" style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--card-bg)', borderRadius: '10px', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-color-primary)' }}><FaUtensils /></div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'var(--text-color-primary)' }}>Choose Your Ingredients</h3>
            <p style={{ color: 'var(--text-color-secondary)' }}>Browse through our extensive catalog of high-quality ingredients.</p>
          </div>
          <div className="step animate-slide-in-bottom stagger-delay-2" style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--card-bg)', borderRadius: '10px', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-color-secondary)' }}><FaPizzaSlice /></div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'var(--text-color-primary)' }}>Customize Your Meal</h3>
            <p style={{ color: 'var(--text-color-secondary)' }}>Personalize portion sizes and ingredient combinations.</p>
          </div>
          <div className="step animate-slide-in-bottom stagger-delay-3" style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--card-bg)', borderRadius: '10px', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-color-tertiary)' }}><FaShippingFast /></div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'var(--text-color-primary)' }}>Enjoy Delivery</h3>
            <p style={{ color: 'var(--text-color-secondary)' }}>Get your perfect meal delivered right to your doorstep.</p>
          </div>
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
                  <span>Roll the Dice!</span>
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
      <section className="custom-meals animate-fade-in" style={{ padding: '4rem 2rem', backgroundColor: 'var(--bg-color)', maxWidth: '1200px', margin: '0 auto' }}>
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
      </section>

      {/* Featured Custom Meals Section with pattern background */}
      <section className="section-accent pattern-bg">
        <div className="container">
          <h2 className="section-title">Top Rated Custom Creations</h2>
          <p className="section-subtitle">Discover unique meals created by our community</p>
          
          {loadingCustomMeals ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="slider-container" style={{ margin: '0 -15px' }}>
              {topCustomMeals.length > 0 ? (
                <Slider {...sliderSettings}>
                  {topCustomMeals.map((meal, index) => {
                    // Use the function to get the accent class instead of the hook
                    const accentClass = getAccentClass(index + 4); // Offset for variety
                    return (
                      <div key={meal.id} style={{ padding: '0 15px' }}>
                        <div className={`card ${accentClass}`}>
                          <div className="card-img" style={{ 
                            height: '220px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: 'var(--bg-accent)',
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e94e37\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                          }}>
                            <div style={{ 
                              width: '120px', 
                              height: '120px', 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--primary-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '2.5rem',
                              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                            }}>
                              <FaUtensils />
                            </div>
                          </div>
                          <div className="card-body">
                            <div className="tags-container">
                              <span className="tag tag-accent">
                                <FaHeart style={{ marginRight: '0.3rem' }} /> Community Creation
                              </span>
                            </div>
                            <h3 className="card-title">{meal.name}</h3>
                            <div className="rating">
                              <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                              <span className="rating-text">5.0 ({meal.votes || 5} votes)</span>
                            </div>
                            <p className="card-text">
                              A custom meal with {meal.ingredients?.length || 'various'} ingredients from {meal.restaurant_name || 'one of our restaurants'}.
                            </p>
                            <div className="price-tag">
                              <FaDollarSign /> {typeof meal.total_price === 'number' ? meal.total_price.toFixed(2) : meal.total_price || '12.99'}
                            </div>
                          </div>
                          <div className="card-footer">
                            <Link to={`/meals/custom/${meal.id}`} className="btn btn-primary">
                              View Details <FaAngleRight style={{ marginLeft: '0.3rem' }} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Slider>
              ) : (
                <div className="info-box info-box-accent" style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <h4 className="info-box-title">No Custom Meals Yet</h4>
                  <p>Be the first to create a custom meal and share it with the community!</p>
                  <div style={{ marginTop: '1rem' }}>
                    <Link to="/restaurants" className="btn btn-accent">Create Your Own Meal</Link>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/top-custom-meals" className="btn btn-accent">
              View All Custom Meals
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
