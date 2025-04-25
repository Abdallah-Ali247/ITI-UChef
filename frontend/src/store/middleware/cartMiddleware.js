import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { login, logout, getCurrentUser } from '../slices/authSlice';
import { initializeCart, handleLogout } from '../slices/cartSlice';

// Create the middleware instance
const cartListenerMiddleware = createListenerMiddleware();

// Add a listener for login success
cartListenerMiddleware.startListening({
  matcher: isAnyOf(
    login.fulfilled,
    getCurrentUser.fulfilled
  ),
  effect: (action, { dispatch, getState }) => {
    // Only initialize cart if we have a valid user
    const user = action.payload;
    if (user && user.id) {
      dispatch(initializeCart(user.id.toString()));
    }
  }
});

// Add a listener for logout
cartListenerMiddleware.startListening({
  actionCreator: logout,
  effect: (action, { dispatch }) => {
    // Clear cart data when user logs out
    dispatch(handleLogout());
  }
});

export default cartListenerMiddleware;
