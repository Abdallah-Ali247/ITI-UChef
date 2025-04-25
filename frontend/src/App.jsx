import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUser } from './store/slices/authSlice'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './contexts/ThemeContext'

// Layout components
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Pages
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import RestaurantList from './pages/restaurants/RestaurantList'
import RestaurantDetail from './pages/restaurants/RestaurantDetail'
import CreateRestaurant from './pages/restaurants/CreateRestaurant'
import MealDetail from './pages/meals/MealDetail'
import AddMeal from './pages/meals/AddMeal'
import EditMeal from './pages/meals/EditMeal'
import AddIngredient from './pages/ingredients/AddIngredient'
import EditIngredient from './pages/ingredients/EditIngredient'
import CustomMealBuilder from './pages/meals/CustomMealBuilder'
import CustomMealDetail from './pages/meals/CustomMealDetail'
import TopCustomMeals from './pages/meals/TopCustomMeals'
import Cart from './pages/cart/Cart'
import Checkout from './pages/cart/Checkout'
import OrderHistory from './pages/orders/OrderHistory'
import OrderDetail from './pages/orders/OrderDetail'
import Profile from './pages/user/Profile'
import RestaurantDashboard from './pages/dashboard/RestaurantDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import AdminUserForm from './pages/admin/AdminUserForm'
import NotFound from './pages/NotFound'

// CSS
import './assets/styles/main.css'
import './styles/themes.css'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector(state => state.auth)
  
  if (loading) return <div className="loading">Loading...</div>
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return children
}

function App() {
  const dispatch = useDispatch()
  
  useEffect(() => {
    dispatch(getCurrentUser())
  }, [dispatch])

  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          <ToastContainer position="top-right" autoClose={3000} />
          <Header />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/restaurants" element={<RestaurantList />} />
              <Route path="/restaurants/:id" element={<RestaurantDetail />} />
              <Route path="/meals/:id" element={<MealDetail />} />
              <Route path="/meals/custom/:id" element={<CustomMealDetail />} />
              <Route path="/top-custom-meals" element={<TopCustomMeals />} />
            
              {/* Protected routes */}
              <Route path="/custom-meal/:restaurantId" element={
                <ProtectedRoute>
                  <CustomMealBuilder />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            
              {/* Restaurant Routes */}
              <Route path="/restaurant-dashboard" element={
                <ProtectedRoute>
                  <RestaurantDashboard />
                </ProtectedRoute>
              } />
              <Route path="/create-restaurant" element={
                <ProtectedRoute>
                  <CreateRestaurant />
                </ProtectedRoute>
              } />
              <Route path="/add-meal" element={
                <ProtectedRoute>
                  <AddMeal />
                </ProtectedRoute>
              } />
              <Route path="/edit-meal/:mealId" element={
                <ProtectedRoute>
                  <EditMeal />
                </ProtectedRoute>
              } />
              <Route path="/add-ingredient" element={
                <ProtectedRoute>
                  <AddIngredient />
                </ProtectedRoute>
              } />
              <Route path="/edit-ingredient/:ingredientId" element={
                <ProtectedRoute>
                  <EditIngredient />
                </ProtectedRoute>
              } />
            
              {/* Admin Dashboard */}
              <Route path="/admin-dashboard" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/add-user" element={
                <ProtectedRoute>
                  <AdminUserForm />
                </ProtectedRoute>
              } />
              <Route path="/admin/edit-user/:id" element={
                <ProtectedRoute>
                  <AdminUserForm isEdit={true} />
                </ProtectedRoute>
              } />
              <Route path="/admin/add-restaurant" element={
                <ProtectedRoute>
                  <CreateRestaurant isAdmin={true} />
                </ProtectedRoute>
              } />
              <Route path="/admin/edit-restaurant/:id" element={
                <ProtectedRoute>
                  <CreateRestaurant isEdit={true} isAdmin={true} />
                </ProtectedRoute>
              } />
              <Route path="/admin/orders/:id" element={
                <ProtectedRoute>
                  <OrderDetail isAdmin={true} />
                </ProtectedRoute>
              } />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
