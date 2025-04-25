import { createSlice } from '@reduxjs/toolkit';

// Helper functions for localStorage management
const getUserCartKey = (userId) => `uchef_cart_${userId || 'guest'}`;

// Load cart from localStorage based on user ID
const loadCartFromStorage = (userId) => {
  try {
    const cartData = localStorage.getItem(getUserCartKey(userId));
    return cartData ? JSON.parse(cartData) : null;
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return null;
  }
};

// Save cart to localStorage based on user ID
const saveCartToStorage = (userId, cartData) => {
  try {
    localStorage.setItem(getUserCartKey(userId), JSON.stringify(cartData));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

// Initial empty cart state
const emptyCart = {
  items: [],
  restaurantId: null,
  restaurantName: '',
  total: 0,
  userId: null
};

// Get initial state from localStorage if available
const initialState = emptyCart;

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Initialize cart for a specific user
    initializeCart: (state, action) => {
      const userId = action.payload;
      const savedCart = loadCartFromStorage(userId);
      
      if (savedCart) {
        // Replace the current state with saved cart
        Object.assign(state, savedCart);
      } else {
        // Initialize a new empty cart for this user
        Object.assign(state, { ...emptyCart, userId });
      }
    },
    // Helper action to check if item is from different restaurant
    checkRestaurantConflict: (state, action) => {
      const { restaurantId } = action.payload;
      return state.restaurantId && state.restaurantId !== restaurantId;
    },
    
    addToCart: (state, action) => {
      const { item, restaurantId, restaurantName, confirmed = false } = action.payload;
      
      // If adding from a different restaurant, and not confirmed, don't add
      // The UI will handle prompting the user for confirmation
      if (state.restaurantId && state.restaurantId !== restaurantId && !confirmed) {
        // We'll return early - the UI will handle the confirmation dialog
        return state;
      }
      
      // If confirmed or no conflict, clear the cart when changing restaurants
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
      }
      
      // Set the restaurant info
      state.restaurantId = restaurantId;
      state.restaurantName = restaurantName;
      
      // Standardize the id property for all items
      const standardizedItem = { ...item };
      
      // If it's a custom meal, ensure we have a consistent id format
      if (item.type === 'custom' && item.customMealId) {
        standardizedItem.id = item.customMealId;
        // Keep customMealId for backward compatibility
        standardizedItem.customMealId = item.customMealId;
      }
      
      // Check if the item already exists in the cart using the standardized approach
      const existingItemIndex = state.items.findIndex(
        cartItem => cartItem.type === standardizedItem.type && cartItem.id === standardizedItem.id
      );
      
      if (existingItemIndex >= 0) {
        // If item exists, increase quantity
        state.items[existingItemIndex].quantity += standardizedItem.quantity || 1;
      } else {
        // Otherwise add new item
        state.items.push({
          ...standardizedItem,
          quantity: standardizedItem.quantity || 1,
          cartItemId: Date.now() // Add a unique identifier for each cart item
        });
      }
      
      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      // Save to localStorage if we have a userId
      if (state.userId) {
        saveCartToStorage(state.userId, state);
      }
    },
    
    removeFromCart: (state, action) => {
      const { id, type } = action.payload;
      
      // Use a single consistent filtering approach for both regular and custom meals
      state.items = state.items.filter(item => {
        if (item.type !== type) return true;
        if (type === 'custom') {
          // For custom meals, check both id and customMealId for compatibility
          return item.id !== id && item.customMealId !== id;
        }
        return item.id !== id;
      });
      
      // If cart is empty, reset restaurant info
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = '';
      }
      
      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      // Save to localStorage if we have a userId
      if (state.userId) {
        saveCartToStorage(state.userId, state);
      }
    },
    
    updateQuantity: (state, action) => {
      const { id, type, quantity } = action.payload;
      
      // Use a consistent approach to find items
      const itemIndex = state.items.findIndex(item => {
        if (item.type !== type) return false;
        if (type === 'custom') {
          return item.id === id || item.customMealId === id;
        }
        return item.id === id;
      });
      
      if (itemIndex >= 0) {
        state.items[itemIndex].quantity = quantity;
        
        // Remove item if quantity is 0
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
          
          // If cart is empty, reset restaurant info
          if (state.items.length === 0) {
            state.restaurantId = null;
            state.restaurantName = '';
          }
        }
      }
      
      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      // Save to localStorage if we have a userId
      if (state.userId) {
        saveCartToStorage(state.userId, state);
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = '';
      state.total = 0;
      
      // Also clear from localStorage if we have a userId
      if (state.userId) {
        saveCartToStorage(state.userId, state);
      }
    },
    
    // Handle user logout
    handleLogout: (state) => {
      // Clear cart when user logs out
      Object.assign(state, emptyCart);
      // Remove the cart from localStorage
      if (state.userId) {
        localStorage.removeItem(getUserCartKey(state.userId));
      }
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, initializeCart, handleLogout, checkRestaurantConflict } = cartSlice.actions;
export default cartSlice.reducer;
