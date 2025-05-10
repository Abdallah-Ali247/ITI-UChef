import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurantById, fetchRestaurantIngredients } from '../../store/slices/restaurantSlice';
import { createCustomMeal } from '../../store/slices/mealSlice';
import { addToCart } from '../../store/slices/cartSlice';

const CustomMealBuilder = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentRestaurant, ingredients, loading: restaurantLoading, error: restaurantError } = useSelector(state => state.restaurants);
  const { loading: mealLoading, error: mealError } = useSelector(state => state.meals);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  const [mealName, setMealName] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchRestaurantById(restaurantId));
    dispatch(fetchRestaurantIngredients(restaurantId));
  }, [dispatch, restaurantId, isAuthenticated, navigate]);
  
  useEffect(() => {
    // Calculate total price based on selected ingredients
    const price = selectedIngredients.reduce((total, item) => {
      return total + (item.price_per_unit * item.quantity);
    }, 0);
    
    setTotalPrice(price);
  }, [selectedIngredients]);
  
  const handleIngredientChange = (ingredient, quantity) => {
    // Find if ingredient is already selected
    const existingIndex = selectedIngredients.findIndex(item => item.id === ingredient.id);
    
    if (quantity <= 0) {
      // Remove ingredient if quantity is 0 or less
      if (existingIndex !== -1) {
        setSelectedIngredients(selectedIngredients.filter(item => item.id !== ingredient.id));
      }
    } else {
      // Update quantity if ingredient exists
      if (existingIndex !== -1) {
        const updatedIngredients = [...selectedIngredients];
        updatedIngredients[existingIndex] = { ...ingredient, quantity };
        setSelectedIngredients(updatedIngredients);
      } else {
        // Add new ingredient
        setSelectedIngredients([...selectedIngredients, { ...ingredient, quantity }]);
      }
    }
  };
  
  const getIngredientQuantity = (ingredientId) => {
    const ingredient = selectedIngredients.find(item => item.id === ingredientId);
    return ingredient ? ingredient.quantity : 0;
  };
  
  const handleCreateMeal = async () => {
    if (!mealName.trim()) {
      alert('Please give your meal a name');
      return;
    }
    
    if (selectedIngredients.length === 0) {
      alert('Please select at least one ingredient');
      return;
    }
    
    // Prepare data for API
    const mealData = {
      name: mealName,
      description: mealDescription,
      cooking_instructions: cookingInstructions,
      is_public: isPublic,
      restaurant: parseInt(restaurantId),
      base_price: totalPrice
    };
    
    const ingredientsData = selectedIngredients.map(item => ({
      ingredient: item.id,
      quantity: item.quantity
    }));
    
    try {
      const resultAction = await dispatch(createCustomMeal({ 
        mealData, 
        ingredients: ingredientsData 
      }));
      
      if (createCustomMeal.fulfilled.match(resultAction)) {
        const customMeal = resultAction.payload;
        
        // Add to cart
        dispatch(addToCart({
          item: {
            customMealId: customMeal.id,
            name: customMeal.name,
            price: totalPrice,
            type: 'custom',
            quantity: 1,
            image: null, // Add a placeholder for image
            specialInstructions: cookingInstructions // Include cooking instructions
          },
          restaurantId: parseInt(restaurantId),
          restaurantName: currentRestaurant.name
        }));
        
        alert('Custom meal created and added to cart!');
        navigate('/cart');
      }
    } catch (error) {
      if (typeof error === 'object') {
        alert(`Failed to create custom meal: ${JSON.stringify(error)}`);
      } else {
        alert(`Failed to create custom meal: ${error}`);
      }
      console.error('Failed to create custom meal:', error);
    }
  };
  
  if (restaurantLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (restaurantError || mealError) {
    return (
      <div className="alert alert-danger">
        {restaurantError || mealError}
      </div>
    );
  }
  
  if (!currentRestaurant) {
    return (
      <div className="alert alert-warning">
        Restaurant not found.
      </div>
    );
  }
  
  const availableIngredients = ingredients.filter(ingredient => ingredient.is_available);
  
  return (
    <div className="container" style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <h1 style={{ 
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
        marginBottom: '0.5rem', 
        color: 'var(--primary-color)',
        fontWeight: '700',
        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }}>Create Your Custom Meal</h1>
      <p style={{ 
        fontSize: 'clamp(1rem, 2vw, 1.1rem)', 
        color: 'var(--text-color-secondary)', 
        marginBottom: '2rem',
        maxWidth: '800px',
        lineHeight: '1.5'
      }}>
        Select ingredients from {currentRestaurant?.name} to create your perfect meal.
      </p>
      
      {(restaurantError || mealError) && (
        <div className="alert alert-danger" style={{ borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', padding: '1rem' }}>
          {restaurantError || mealError}
        </div>
      )}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', 
        gap: 'clamp(1.5rem, 4vw, 2rem)',
        position: 'relative'
      }}>
        <div>
          <div className="card" style={{ 
            height: 'fit-content', 
            marginBottom: 'clamp(1.5rem, 4vw, 2rem)', 
            boxShadow: 'var(--box-shadow)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            border: '1px solid var(--border-color)',
            animation: 'scaleUp 0.4s ease-out'
          }}>
            <div style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Meal Information</h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="mealName" style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  color: 'var(--text-color)'
                }}>
                  Meal Name *
                </label>
                <input
                  type="text"
                  id="mealName"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="form-control"
                  placeholder="Give your meal a name"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--border-color)',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                    backgroundColor: 'var(--bg-accent)',
                    color: 'var(--text-color)',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="mealDescription" style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  color: 'var(--text-color)'
                }}>
                  Description (Optional)
                </label>
                <textarea
                  id="mealDescription"
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  className="form-control"
                  placeholder="Describe your meal"
                  rows="3"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--border-color)',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    resize: 'vertical',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                    backgroundColor: 'var(--bg-accent)',
                    color: 'var(--text-color)',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="cookingInstructions" style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  color: 'var(--text-color)'
                }}>
                  Cooking Instructions (Optional)
                </label>
                <textarea
                  id="cookingInstructions"
                  value={cookingInstructions}
                  onChange={(e) => setCookingInstructions(e.target.value)}
                  className="form-control"
                  placeholder="Explain how you'd like these ingredients to be prepared"
                  rows="4"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--border-color)',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    resize: 'vertical',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                    backgroundColor: 'var(--bg-accent)',
                    color: 'var(--text-color)',
                    transition: 'all 0.3s ease'
                  }}
                />
                <small style={{ 
                  display: 'block', 
                  marginTop: '0.5rem', 
                  color: 'var(--text-color-tertiary, #999)', 
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}>
                  Share your recipe or specific preparation instructions for the chef
                </small>
              </div>
              
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  color: 'var(--text-color)'
                }}>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    style={{ 
                      marginRight: '0.75rem', 
                      width: '18px', 
                      height: '18px', 
                      accentColor: 'var(--primary-color)' 
                    }}
                  />
                  Make this meal public (others can see and order it)
                </label>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ 
            height: 'fit-content', 
            boxShadow: 'var(--box-shadow)',
            border: '1px solid var(--border-color)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            animation: 'scaleUp 0.4s ease-out 0.2s both'
          }}>
            <div style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1.25rem', color: 'var(--primary-color)' }}>Meal Summary</h2>
              
              {selectedIngredients.length === 0 ? (
                <div style={{ 
                  padding: '1.5rem', 
                  textAlign: 'center', 
                  backgroundColor: 'var(--bg-color-secondary)', 
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--text-color-secondary)',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  border: '1px dashed var(--border-color)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <p>No ingredients selected yet.</p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Select ingredients from the right panel to build your meal.</p>
                </div>
              ) : (
                <>
                  <div style={{ 
                    maxHeight: selectedIngredients.length > 5 ? '250px' : 'auto',
                    overflowY: selectedIngredients.length > 5 ? 'auto' : 'visible',
                    marginBottom: '1.25rem',
                    padding: selectedIngredients.length > 5 ? '0 0.5rem 0 0' : '0'
                  }}>
                    {selectedIngredients.map(item => (
                      <div key={item.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid var(--border-color-light)',
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '70%' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>{item.name}</span>
                          <span style={{ color: 'var(--text-color-secondary)' }}>x {item.quantity}</span>
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                          ${(parseFloat(item.price_per_unit) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)',
                    padding: '1rem',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: 'var(--bg-color-secondary)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span>Total Price:</span>
                    <span style={{ color: 'var(--primary-color)' }}>${totalPrice.toFixed(2)}</span>
                  </div>
                </>
              )}
              
              <button 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  borderRadius: 'var(--border-radius)',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: selectedIngredients.length > 0 && mealName.trim() && !mealLoading ? 'translateY(0)' : 'translateY(0)',
                  opacity: selectedIngredients.length > 0 && mealName.trim() && !mealLoading ? '1' : '0.7'
                }}
                onClick={handleCreateMeal}
                disabled={selectedIngredients.length === 0 || !mealName.trim() || mealLoading}
              >
                {mealLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Creating...
                  </span>
                ) : 'Create and Add to Cart'}
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <div className="card" style={{ 
            height: 'fit-content', 
            boxShadow: 'var(--box-shadow)',
            border: '1px solid var(--border-color)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            animation: 'scaleUp 0.4s ease-out 0.2s both'
          }}>
            <div style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', margin: 0, color: 'var(--primary-color)' }}>Select Ingredients</h2>
                
                <div style={{ 
                  flex: '1',
                  minWidth: '200px',
                  maxWidth: '300px'
                }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search ingredients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        borderRadius: 'var(--border-radius)',
                        border: '1px solid var(--border-color)',
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                        backgroundColor: 'var(--bg-accent)',
                        color: 'var(--text-color)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <span style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'var(--text-color-secondary)'
                    }}>
                      🔍
                    </span>
                  </div>
                </div>
              </div>
              
              {availableIngredients.length === 0 ? (
                <div style={{ 
                  padding: '1.5rem', 
                  backgroundColor: 'var(--bg-color-warning)', 
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--text-color-warning)',
                  textAlign: 'center'
                }}>
                  <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No ingredients available</p>
                  <p>There are no ingredients available for custom meals at this restaurant.</p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
                  gap: '1rem',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--border-color) transparent'
                }}>
                  {availableIngredients
                    .filter(ingredient => 
                      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (ingredient.description && ingredient.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      ingredient.unit.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(ingredient => {
                      const isSelected = getIngredientQuantity(ingredient.id) > 0;
                      return (
                        <div key={ingredient.id} className="card" style={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s ease',
                          border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          boxShadow: isSelected ? '0 6px 12px rgba(var(--primary-color-rgb), 0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
                          transform: isSelected ? 'translateY(-3px) scale(1.02)' : 'none',
                          backgroundColor: isSelected ? 'var(--card-bg)' : 'var(--card-bg)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: '0',
                              right: '0',
                              background: 'var(--primary-color)',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.7rem',
                              borderBottomLeftRadius: 'var(--border-radius)',
                              fontWeight: 'bold',
                              zIndex: '1',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              Selected
                            </div>
                          )}
                          <div style={{ padding: '1rem', flex: '1' }}>
                            <h4 style={{ 
                              fontSize: 'clamp(1rem, 2vw, 1.1rem)', 
                              marginBottom: '0.5rem',
                              fontWeight: '600',
                              color: isSelected ? 'var(--primary-color)' : 'var(--text-color)'
                            }}>
                              {ingredient.name}
                            </h4>
                            
                            {ingredient.description && (
                              <p style={{ 
                                fontSize: 'clamp(0.85rem, 2vw, 0.9rem)', 
                                color: 'var(--text-color-secondary)',
                                marginBottom: '0.75rem',
                                minHeight: '2.5rem'
                              }}>
                                {ingredient.description.length > 60 ? 
                                  `${ingredient.description.substring(0, 60)}...` : 
                                  ingredient.description}
                              </p>
                            )}
                            
                            <p style={{ 
                              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                              fontWeight: '600',
                              marginBottom: '0.5rem',
                              color: 'var(--primary-color)'
                            }}>
                              ${parseFloat(ingredient.price_per_unit).toFixed(2)} per {ingredient.unit}
                            </p>
                          </div>
                          
                          <div style={{ 
                            padding: '0.75rem 1rem',
                            borderTop: '1px solid var(--border-color-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isSelected ? 'rgba(var(--primary-color-rgb), 0.05)' : 'transparent'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              width: '100%'
                            }}>
                              <button 
                                style={{ 
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  border: '1px solid var(--border-color)',
                                  background: isSelected ? 'var(--primary-color)' : 'var(--bg-accent-secondary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.25rem',
                                  fontWeight: 'bold',
                                  color: isSelected ? 'white' : 'var(--text-color)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={() => handleIngredientChange(
                                  ingredient, 
                                  Math.max(0, getIngredientQuantity(ingredient.id) - 1)
                                )}
                              >
                                -
                              </button>
                              
                              <input
                                type="number"
                                value={getIngredientQuantity(ingredient.id)}
                                onChange={(e) => handleIngredientChange(
                                  ingredient, 
                                  parseInt(e.target.value) || 0
                                )}
                                style={{ 
                                  width: '50px',
                                  textAlign: 'center',
                                  padding: '0.25rem',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--border-radius)',
                                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                  fontWeight: isSelected ? '600' : 'normal',
                                  color: isSelected ? 'var(--primary-color)' : 'var(--text-color)',
                                  backgroundColor: 'var(--bg-accent)',
                                  boxShadow: isSelected ? '0 0 0 1px var(--primary-color)' : 'none',
                                  transition: 'all 0.3s ease'
                                }}
                                min="0"
                              />
                              
                              <button 
                                style={{ 
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  border: '1px solid var(--border-color)',
                                  background: isSelected ? 'var(--primary-color)' : 'var(--bg-accent-secondary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.25rem',
                                  fontWeight: 'bold',
                                  color: isSelected ? 'white' : 'var(--text-color)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={() => handleIngredientChange(
                                  ingredient, 
                                  getIngredientQuantity(ingredient.id) + 1
                                )}
                              >
                                +
                              </button>
                              
                              {isSelected && (
                                <span style={{ 
                                  marginLeft: 'auto', 
                                  fontWeight: '600',
                                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                  color: 'var(--primary-color)'
                                }}>
                                  ${(parseFloat(ingredient.price_per_unit) * getIngredientQuantity(ingredient.id)).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomMealBuilder;
