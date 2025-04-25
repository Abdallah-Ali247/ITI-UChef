import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/token/`, { username, password });
      localStorage.setItem('token', response.data.token);
      
      // Get user details
      const userResponse = await axios.get(`${API_URL}/users/me/`, {
        headers: {
          Authorization: `Token ${response.data.token}`
        }
      });
      
      return userResponse.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/users/register/`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await axios.get(`${API_URL}/users/me/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'auth/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/users/`, {
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

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      // Get the current user ID from the state
      const { user } = getState().auth;
      if (!user || !user.id) {
        return rejectWithValue('User information is missing');
      }
      
      // First, update the user data (name, email, etc.)
      const userResponse = await axios.put(`${API_URL}/users/${user.id}/`, {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone_number: userData.phone_number,
        address: userData.address
      }, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // If user has a profile and profile data was provided, update the profile
      if (userData.profile && user.profile) {
        await axios.put(`${API_URL}/profiles/${user.profile.id}/`, {
          bio: userData.profile.bio,
          favorite_cuisine: userData.profile.favorite_cuisine
        }, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Fetch the updated user data
      const updatedUserResponse = await axios.get(`${API_URL}/users/me/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      
      return updatedUserResponse.data;
    } catch (error) {
      console.error('Profile update error:', error.response?.data);
      return rejectWithValue(error.response?.data || 'Failed to update profile');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'auth/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      // Delete the user
      await axios.delete(`${API_URL}/users/users/${userId}/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      
      // Return the deleted user ID for state updates
      return userId;
    } catch (error) {
      console.error('Delete user error:', error.response?.data);
      return rejectWithValue(error.response?.data || 'Failed to delete user');
    }
  }
);

const initialState = {
  user: null,
  users: [],
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      // Note: Cart handling is done in middleware/listeners
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      })
      
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch users';
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
      })
      
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        // If we have users array in state, remove the deleted user
        if (state.users) {
          state.users = state.users.filter(user => user.id !== action.payload);
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete user';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
