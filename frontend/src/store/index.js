import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import restaurantReducer from './slices/restaurantSlice';
import mealReducer from './slices/mealSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import cartListenerMiddleware from './middleware/cartMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurants: restaurantReducer,
    meals: mealReducer,
    cart: cartReducer,
    orders: orderReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware()
      .prepend(cartListenerMiddleware.middleware)
});

export default store;
