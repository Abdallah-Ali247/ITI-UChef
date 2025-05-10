import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { clearCart } from './cartSlice';

const API_URL = 'http://localhost:8000/api';

// Async thunks
export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/orders/orders/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/orders/orders/${id}/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async ({ orderData, cartItems, restaurantId }, { dispatch, rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      // Get the current user ID from auth state
      const { user } = getState().auth;
      if (!user || !user.id) {
        return rejectWithValue('User information is missing. Please log in again.');
      }
      
      // Process order items differently - we'll handle them in the backend
      // The backend expects the items to be passed in the context, not directly in the payload
      const orderItems = [];
      
      // Format the items for the API
      cartItems.forEach(item => {
        if (item.type === 'regular') {
          orderItems.push({
            meal: item.id,
            quantity: item.quantity,
            price: item.price,
            special_instructions: item.specialInstructions || ''
          });
        } else if (item.type === 'custom') {
          orderItems.push({
            custom_meal: item.customMealId,
            quantity: item.quantity,
            price: item.price,
            special_instructions: item.specialInstructions || ''
          });
        }
      });
      
      // Create order payload without items (they'll be handled separately)
      const payload = {
        ...orderData,
        restaurant: restaurantId,
        user: user.id  // Add the user ID to the payload
      };
      
      // Create payment data if provided
      const paymentData = orderData.payment_method ? {
        payment_method: orderData.payment_method,
        amount: orderData.total_price
      } : null;
      
      console.log('Order payload:', payload);
      console.log('Order items:', orderItems);
      
      // Send the order with items in the request body
      const response = await axios.post(
        `${API_URL}/orders/orders/`, 
        {
          ...payload,
          items: orderItems,
          payment: paymentData
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Clear the cart after successful order
      dispatch(clearCart());
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status, reason }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      // Create request payload with or without reason based on status
      const payload = { status };
      if (status === 'cancelled' && reason) {
        payload.reason = reason;
      }
      
      const response = await axios.post(
        `${API_URL}/orders/orders/${orderId}/update_status/`,
        payload,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch orders';
      })
      
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch order';
      })
      
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create order';
      })
      
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update order in orders list
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update order status';
      });
  },
});

export const { clearOrderError, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
