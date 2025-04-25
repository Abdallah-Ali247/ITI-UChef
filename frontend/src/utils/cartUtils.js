/**
 * Utility functions for cart operations
 */
import Swal from 'sweetalert2';
import { store } from '../store';
import { checkRestaurantConflict, addToCart } from '../store/slices/cartSlice';

/**
 * Add an item to cart with restaurant conflict check
 * @param {Object} item - The meal/item to add
 * @param {number} restaurantId - The restaurant ID
 * @param {string} restaurantName - The restaurant name
 * @returns {Promise<boolean>} - Whether the item was added
 */
export const addToCartWithConfirmation = async (item, restaurantId, restaurantName) => {
  // Check if there's a restaurant conflict
  const hasConflict = store.dispatch(checkRestaurantConflict({ restaurantId }));
  const state = store.getState();
  
  // If there's a restaurant conflict, show confirmation
  if (hasConflict && state.cart.items.length > 0) {
    const currentRestaurantName = state.cart.restaurantName;
    
    const result = await Swal.fire({
      title: 'Different Restaurant',
      text: `Your cart already has items from "${currentRestaurantName}". Adding items from "${restaurantName}" will clear your current cart. Do you want to continue?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, change restaurant',
      cancelButtonText: 'No, keep my cart',
      confirmButtonColor: 'var(--primary-color)',
      cancelButtonColor: 'var(--secondary-color)',
    });
    
    if (result.isConfirmed) {
      // User confirmed, dispatch with confirmed flag
      store.dispatch(addToCart({
        item,
        restaurantId,
        restaurantName,
        confirmed: true
      }));
      return true;
    } else {
      // User canceled
      return false;
    }
  } else {
    // No conflict, add normally
    store.dispatch(addToCart({
      item,
      restaurantId,
      restaurantName
    }));
    return true;
  }
};
