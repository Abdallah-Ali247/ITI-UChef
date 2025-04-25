import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants } from '../store/slices/restaurantSlice';
import { fetchMeals } from '../store/slices/mealSlice';
import axios from 'axios';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import PLACEHOLDER_IMAGES from '../utils/placeholderImages';

const Home = () => {
  const dispatch = useDispatch();
  const { restaurants, loading: restaurantsLoading } = useSelector(state => state.restaurants);
  const { meals, loading: mealsLoading } = useSelector(state => state.meals);
  const [topCustomMeals, setTopCustomMeals] = useState([]);
  const [loadingCustomMeals, setLoadingCustomMeals] = useState(true);

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

  // Get featured restaurants (first 6)
  const featuredRestaurants = restaurants.slice(0, 6);
  
  // Get featured meals (first 6) - if none are featured, show the first 6 meals
  const featuredMeals = meals.filter(meal => meal.is_featured).length > 0 
    ? meals.filter(meal => meal.is_featured).slice(0, 6)
    : meals.slice(0, 6);
  
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
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" style={{ 
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        padding: '6rem 1rem',
        textAlign: 'center',
        borderRadius: 'var(--border-radius-lg)',
        marginBottom: '3rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div data-aos="fade-up" data-aos-delay="100">
          <h1 style={{ 
            fontSize: '3rem', 
            marginBottom: '1.5rem',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>Create Your Perfect Meal</h1>
          <p style={{ 
            fontSize: '1.25rem', 
            maxWidth: '800px', 
            margin: '0 auto 2rem',
            lineHeight: '1.8',
            opacity: '0.9'
          }}>
            UChef lets you customize your meals exactly how you want them. Choose your ingredients, control your portions, and enjoy your perfect meal.
          </p>
          <Link 
            to="/restaurants" 
            className="btn btn-primary" 
            style={{ 
              fontSize: '1.2rem', 
              padding: '0.85rem 2.5rem',
              fontWeight: '600',
              borderRadius: 'var(--border-radius)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              zIndex: '1'
            }}>
            Order Now
          </Link>
        </div>
      </section>

      {/* Featured Restaurants Section */}
      <section className="section" style={{ padding: '2rem 0' }}>
        <div className="section-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          borderBottom: '2px solid var(--primary-color-light)',
          paddingBottom: '1rem'
        }}>
          <h2 data-aos="fade-right" style={{ 
            fontSize: '2rem', 
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>Featured Restaurants</h2>
          <Link 
            to="/restaurants" 
            className="btn btn-outline"
            data-aos="fade-left"
            style={{ 
              transition: 'all 0.3s ease',
              borderColor: 'var(--primary-color)',
              color: 'var(--primary-color)',
              fontWeight: '500',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              borderRadius: 'var(--border-radius)'
            }}>
            View All
          </Link>
        </div>
        
        {restaurantsLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="slider-container" style={{ margin: '0 -15px' }}>
            <Slider {...sliderSettings}>
              {featuredRestaurants.map(restaurant => (
                <div key={restaurant.id} style={{ padding: '0 15px' }}>
                  <div 
                    className="card" 
                    data-aos="fade-up" 
                    data-aos-delay={`${100 * (restaurant.id % 6)}`}
                    style={{ 
                      borderRadius: 'var(--border-radius)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-md)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      ':hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 'var(--shadow-lg)'
                      }
                    }}
                  >
                    <div className="card-img-container" style={{ 
                      position: 'relative',
                      overflow: 'hidden',
                      height: '200px'
                    }}>
                      <img 
                        src={restaurant.logo || PLACEHOLDER_IMAGES.restaurant} 
                        alt={restaurant.name} 
                        className="card-img"
                        style={{ 
                          height: '100%', 
                          width: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </div>
                    <div className="card-body" style={{ 
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: '1',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <h3 className="card-title" style={{ 
                          fontSize: '1.4rem', 
                          fontWeight: '600',
                          marginBottom: '0.75rem',
                          color: 'var(--text-primary)'
                        }}>{restaurant.name}</h3>
                        <p className="card-text" style={{ 
                          color: 'var(--text-secondary)',
                          marginBottom: '1.25rem',
                          lineHeight: '1.6'
                        }}>{restaurant.description.substring(0, 100)}...</p>
                      </div>
                      <Link 
                        to={`/restaurants/${restaurant.id}`} 
                        className="btn btn-primary"
                        style={{ 
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.25rem',
                          borderRadius: 'var(--border-radius)',
                          fontWeight: '500',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          display: 'inline-block',
                          textDecoration: 'none',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--primary-color-hover)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        View Menu
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        )}
      </section>

      {/* Featured Meals Section */}
      <section className="section" style={{ padding: '3rem 0' }}>
        <div className="section-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          borderBottom: '2px solid var(--secondary-color-light)',
          paddingBottom: '1rem'
        }}>
          <h2 data-aos="fade-right" data-aos-delay="50" style={{ 
            fontSize: '2rem', 
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>Featured Meals</h2>
          <Link 
            to="/meals" 
            className="btn btn-outline"
            data-aos="fade-left" 
            data-aos-delay="50"
            style={{ 
              transition: 'all 0.3s ease',
              borderColor: 'var(--secondary-color)',
              color: 'var(--secondary-color)',
              fontWeight: '500',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              borderRadius: 'var(--border-radius)'
            }}>
            View All
          </Link>
        </div>
        
        {mealsLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="slider-container" style={{ margin: '0 -15px' }}>
            <Slider {...sliderSettings}>
              {featuredMeals.map(meal => (
                <div key={meal.id} style={{ padding: '0 15px' }}>
                  <div 
                    className="card" 
                    data-aos="fade-up" 
                    data-aos-delay={`${100 * (meal.id % 6)}`}
                    style={{ 
                      borderRadius: 'var(--border-radius)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-md)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                  >
                    <div className="card-img-container" style={{ 
                      position: 'relative',
                      overflow: 'hidden',
                      height: '200px'
                    }}>
                      <img 
                        src={meal.image || PLACEHOLDER_IMAGES.meal} 
                        alt={meal.name} 
                        className="card-img"
                        style={{ 
                          height: '100%', 
                          width: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      <div className="meal-price" style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'var(--secondary-color)',
                        color: 'white',
                        padding: '5px 12px',
                        borderRadius: 'var(--border-radius-full)',
                        fontWeight: '600',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        ${meal.base_price}
                      </div>
                    </div>
                    <div className="card-body" style={{ 
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: '1',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <h3 className="card-title" style={{ 
                          fontSize: '1.4rem', 
                          fontWeight: '600',
                          marginBottom: '0.75rem',
                          color: 'var(--text-primary)'
                        }}>{meal.name}</h3>
                        <p className="card-text" style={{ 
                          color: 'var(--text-secondary)',
                          marginBottom: '1.25rem',
                          lineHeight: '1.6'
                        }}>{meal.description ? meal.description.substring(0, 80) + '...' : 'No description available'}</p>
                      </div>
                      <Link 
                        to={`/meals/${meal.id}`} 
                        className="btn btn-primary"
                        style={{ 
                          backgroundColor: 'var(--secondary-color)',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.25rem',
                          borderRadius: 'var(--border-radius)',
                          fontWeight: '500',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          display: 'inline-block',
                          textDecoration: 'none',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--secondary-color-hover)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        )}
      </section>

      {/* Featured Custom Meals Section */}
      <section className="section" style={{ padding: '3rem 0' }}>
        <div className="section-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          borderBottom: '2px solid var(--accent-color-light)',
          paddingBottom: '1rem'
        }}>
          <h2 data-aos="fade-right" data-aos-delay="100" style={{ 
            fontSize: '2rem', 
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>Featured Custom Meals</h2>
          <Link 
            to="/top-custom-meals" 
            className="btn btn-outline"
            data-aos="fade-left" 
            data-aos-delay="100"
            style={{ 
              transition: 'all 0.3s ease',
              borderColor: 'var(--accent-color)',
              color: 'var(--accent-color)',
              fontWeight: '500',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              borderRadius: 'var(--border-radius)'
            }}>
            View All
          </Link>
        </div>
        
        {loadingCustomMeals ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="slider-container" style={{ margin: '0 -15px' }}>
            {topCustomMeals.length > 0 ? (
              <Slider {...sliderSettings}>
                {topCustomMeals.map(meal => (
                  <div key={meal.id} style={{ padding: '0 15px' }}>
                    <div 
                      className="card" 
                      data-aos="fade-up" 
                      data-aos-delay={`${100 * (meal.id % 5)}`}
                      style={{ 
                        borderRadius: 'var(--border-radius)',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-md)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                    >
                      <div className="card-img-container" style={{ 
                        position: 'relative',
                        overflow: 'hidden',
                        height: '200px'
                      }}>
                        <div className="card-img" style={{ 
                          height: '100%', 
                          width: '100%',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundImage: `url(${PLACEHOLDER_IMAGES.customMeal})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-inverse)',
                          position: 'relative',
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{  
                              fontSize: '1.4rem',
                              fontWeight: 'bold',
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                              padding: '10px 20px',
                              borderRadius: 'var(--border-radius)',
                              backgroundColor: 'rgba(0,0,0,0.5)',
                            }}>Custom Meal</span>
                          </div>
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'var(--accent-color)',
                            color: 'white',
                            padding: '5px 12px',
                            borderRadius: 'var(--border-radius-full)',
                            fontWeight: '600',
                            boxShadow: 'var(--shadow-sm)'
                          }}>
                            ${meal.price}
                          </div>
                        </div>
                      </div>
                      <div className="card-body" style={{ 
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: '1',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <h3 className="card-title" style={{ 
                            fontSize: '1.4rem', 
                            fontWeight: '600',
                            marginBottom: '0.75rem',
                            color: 'var(--text-primary)'
                          }}>{meal.name}</h3>
                          <p className="card-text" style={{ 
                            marginBottom: '0.5rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <span style={{ fontWeight: '600' }}>Created by:</span> 
                            <span>{meal.user_name || 'Anonymous'}</span>
                          </p>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '5px',
                            marginBottom: '1.25rem',
                            color: 'var(--accent-color)'
                          }}>
                            <span style={{ fontWeight: '600' }}>Rating:</span>
                            <div>
                              {meal.average_rating ? (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '5px'
                                }}>
                                  <span style={{ color: 'var(--accent-color)', fontWeight: '600' }}>{meal.average_rating}</span>
                                  <span>/5</span>
                                  <span style={{ 
                                    color: 'var(--accent-color)', 
                                    marginLeft: '2px'
                                  }}>★</span>
                                </div>
                              ) : 'No ratings yet'}
                            </div>
                          </div>
                        </div>
                        <Link 
                          to={`/custom-meal/${meal.id}`} 
                          className="btn btn-secondary"
                          style={{ 
                            backgroundColor: 'var(--accent-color)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.25rem',
                            borderRadius: 'var(--border-radius)',
                            fontWeight: '500',
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                            display: 'inline-block',
                            textDecoration: 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-color-hover)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>No custom meals available yet. Be the first to create one!</p>
                <Link to="/create-custom-meal" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Create Custom Meal
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
      
      {/* Top Custom Meals Competition Section */}
      <section className="section" style={{ 
        textAlign: 'center', 
        padding: '3rem 0',
        backgroundColor: 'var(--accent-light)',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Custom Meal Competition</h2>
        <p style={{ fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto 1.5rem' }}>
          Create your own custom meal and compete to be in the Top 10! Show off your culinary creativity and get recognized by the UChef community.
        </p>
        <Link to="/top-custom-meals" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem', marginBottom: '1rem' }}>
          View Top Custom Meals
        </Link>
      </section>
      
      {/* How It Works Section */}
      <section className="section" style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h2 style={{ marginBottom: '2rem' }}>How UChef Works</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="step">
            <div className="step-icon" style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2rem', 
              margin: '0 auto 1rem' 
            }}>1</div>
            <h3>Choose a Restaurant</h3>
            <p>Browse our selection of restaurants and find your favorite cuisine.</p>
          </div>
          
          <div className="step">
            <div className="step-icon" style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2rem', 
              margin: '0 auto 1rem' 
            }}>2</div>
            <h3>Customize Your Meal</h3>
            <p>Select ingredients, adjust portions, and create your perfect meal.</p>
          </div>
          
          <div className="step">
            <div className="step-icon" style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2rem', 
              margin: '0 auto 1rem' 
            }}>3</div>
            <h3>Place Your Order</h3>
            <p>Review your order, make payment, and wait for your delicious meal.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
