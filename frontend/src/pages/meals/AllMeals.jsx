import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMeals, fetchMealCategories } from '../../store/slices/mealSlice';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSearch, FaTag, FaDollarSign, FaListAlt, FaStar, FaRegClock, FaUtensils } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AllMeals = () => {
  const accentClasses = ['card-accent-1', 'card-accent-2', 'card-accent-3', 'card-accent-4', 'card-accent-5'];
  const getAccentClass = (index) => accentClasses[index % accentClasses.length];

  const dispatch = useDispatch();
  const { meals, loading, error, categories } = useSelector(state => state.meals);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    dispatch(fetchMeals({ isPublic: true }));
    dispatch(fetchMealCategories());
  }, [dispatch]);

  // Log meal data structure when it changes
  useEffect(() => {
    if (meals && meals.length > 0) {
      console.log('Meal data structure:', meals[0]);
    }
  }, [meals]);

  // Fetch ingredient availability for all meals
  useEffect(() => {
    const checkAllAvailability = async () => {
      setCheckingAvailability(true);
      let map = {};
      await Promise.all(meals.map(async meal => {
        try {
          const res = await axios.get(`${API_URL}/api/meals/meals/${meal.id}/check_availability/`);
          map[meal.id] = res.data.unavailable_ingredients.length === 0;
        } catch (err) {
          map[meal.id] = false;
        }
      }));
      setAvailabilityMap(map);
      setCheckingAvailability(false);
    };
    if (meals.length > 0) checkAllAvailability();
  }, [meals]);

  useEffect(() => {
    let result = meals;
    if (searchTerm) {
      result = result.filter(meal => meal.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedCategory) {
      result = result.filter(meal => meal.category && meal.category.toString() === selectedCategory);
    }
    result = result.filter(meal => meal.base_price >= priceRange[0] && meal.base_price <= priceRange[1]);
    setFilteredMeals(result);
  }, [meals, searchTerm, selectedCategory, priceRange]);

  const minPrice = Math.min(...meals.map(m => m.base_price), 0);
  const maxPrice = Math.max(...meals.map(m => m.base_price), 100);

  return (
    <div className="all-meals-page section animate-fade-in">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 className="section-title animate-scale-up">Explore Our Meals</h1>
        <p className="section-subtitle animate-scale-up">Discover a variety of delicious meals prepared by our talented chefs. Use the filters below to find exactly what you're craving.</p>
        
        <div className="filters animate-slide-in-bottom" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap', padding: '1.5rem', backgroundColor: 'var(--bg-color-secondary)', borderRadius: 'var(--border-radius)' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1', minWidth: '220px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-color-secondary)' }}>
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search by meal name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, width: '180px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-color-secondary)' }}>
                <FaListAlt />
              </span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              >
                <option value="">All Categories</option>
                {categories && categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-color-secondary)' }}>
                <FaDollarSign />
              </span>
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                value={priceRange[0]}
                onChange={e => setPriceRange([+e.target.value, priceRange[1]])}
                className="form-control"
                style={{ width: '80px' }}
              />
            </div>
            <span>to</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-color-secondary)' }}>
                <FaDollarSign />
              </span>
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], +e.target.value])}
                className="form-control"
                style={{ width: '80px' }}
              />
            </div>
          </div>
        </div>
        
        {loading || checkingAvailability ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : error ? (
          <div className="info-box info-box-accent" style={{ borderColor: 'var(--danger-color)' }}>
            <h4 className="info-box-title animate-scale-up">Error</h4>
            <p>{error}</p>
          </div>
        ) : filteredMeals.length === 0 ? (
          <div className="info-box animate-scale-up">
            <h4 className="info-box-title">No Meals Found</h4>
            <p>We couldn't find any meals matching your criteria. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid">
            {filteredMeals.map((meal, index) => {
              const accentClass = getAccentClass(index);
              return (
                <div key={meal.id} className={`card-container animate-fade-in stagger-delay-${index % 5 + 1}`}>
                  <div className={`card ${accentClass}`} style={{ opacity: availabilityMap[meal.id] === false ? 0.75 : 1 }}>
                    <img
                      src={meal.image || 'https://via.placeholder.com/300x200?text=Meal'}
                      alt={meal.name}
                      className="card-img"
                    />
                    <div className="card-body">
                      <div className="tags-container">
                        {meal.category_name && (
                          <span className="tag tag-accent">
                            <FaTag style={{ marginRight: '0.3rem' }} /> {meal.category_name}
                          </span>
                        )}
                        <span className="tag">
                          <FaRegClock style={{ marginRight: '0.3rem' }} /> 30 min
                        </span>
                      </div>
                      
                      <h3 className="card-title">{meal.name}</h3>
                      
                      <div className="rating">
                        <FaStar /><FaStar /><FaStar /><FaStar /><FaStar style={{ opacity: 0.4 }} />
                        <span className="rating-text">4.0 (12 reviews)</span>
                      </div>
                      
                      <p className="card-text">{meal.description?.substring(0, 100)}{meal.description?.length > 100 ? '...' : ''}</p>
                      
                      <div className="price-tag">
                        <FaDollarSign /> {typeof meal.base_price === 'number' ? meal.base_price.toFixed(2) : meal.base_price || '0.00'}
                      </div>
                    </div>
                    <div className="card-footer">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color-tertiary)' }}>
                        <FaUtensils /> {meal.meal_ingredients?.length || 0} ingredients
                      </span>
                      <Link to={`/meals/${meal.id}`} className="btn btn-primary">View Details</Link>
                    </div>
                    
                    {availabilityMap[meal.id] === false && (
                      <div style={{ position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 'var(--card-radius)' }}>
                        <div style={{ backgroundColor: 'var(--warning-color)', color: '#333', padding: '0.7rem 1.2rem', borderRadius: 'var(--border-radius)', fontWeight: 'bold', transform: 'rotate(-5deg)' }}>
                          Currently Unavailable
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMeals;
