import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { validateField, validateForm, isFormValid } from '../../utils/validation';

const API_URL = 'http://localhost:8000/api';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useSelector(state => state.auth);
  
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    bio: '',
    favorite_cuisine: '',
    password: '',
    password2: '',
    current_password: ''
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Initialize form data when user data is available
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        bio: user.profile?.bio || '',
        favorite_cuisine: user.profile?.favorite_cuisine || '',
        password: '',
        password2: '',
        current_password: ''
      });
    }
  }, [user, isAuthenticated, navigate]);
  
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate the field as it changes
    let error = null;
    
    switch (name) {
      case 'email':
        error = validateField('Email', value, { required: true, email: true });
        break;
      case 'phone_number':
        error = validateField('Phone Number', value, { phone: true });
        break;
      case 'first_name':
      case 'last_name':
        error = validateField(name === 'first_name' ? 'First Name' : 'Last Name', value, { 
          required: true, 
          minLength: 2 
        });
        break;
      case 'bio':
        error = validateField('Bio', value, { maxLength: 500 });
        break;
      case 'password':
        // Only validate if there's a value
        if (value) {
          error = validateField('Password', value, { minLength: 8 });
          
          // If password2 has a value, check if they match
          if (profileForm.password2 && value !== profileForm.password2) {
            setFormErrors(prev => ({
              ...prev,
              password2: "Passwords do not match"
            }));
          } else if (profileForm.password2) {
            // Clear the error if they now match
            setFormErrors(prev => ({
              ...prev,
              password2: null
            }));
          }
        }
        break;
      case 'password2':
        // Only validate if there's a value
        if (value) {
          // Check if passwords match
          if (profileForm.password && value !== profileForm.password) {
            error = "Passwords do not match";
          }
        }
        break;
      case 'current_password':
        // No client-side validation needed for current password
        break;
      default:
        // No validation for other fields
        break;
    }
    
    // Update the errors state
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    // Create validation rules for the profile form
    const profileValidationRules = {
      email: { required: true, email: true },
      first_name: { required: true, minLength: 2 },
      last_name: { required: true, minLength: 2 },
      phone_number: { phone: true },
      bio: { maxLength: 500 }
    };
    
    // Only add password validation rules if the user is trying to change their password
    const isChangingPassword = profileForm.password || profileForm.password2 || profileForm.current_password;
    
    if (isChangingPassword) {
      // If any password field has a value, all password fields are required
      profileValidationRules.password = { required: true, minLength: 8 };
      profileValidationRules.password2 = { required: true };
      profileValidationRules.current_password = { required: true };
    }
    
    // Validate all fields
    const errors = validateForm(profileForm, profileValidationRules);
    
    // Custom validation for password matching
    if (profileForm.password && profileForm.password2 && profileForm.password !== profileForm.password2) {
      errors.password2 = "Passwords do not match";
    }
    
    setFormErrors(errors);
    
    // Only proceed if there are no validation errors
    if (!isFormValid(errors)) {
      // Scroll to the first error field
      const firstErrorField = document.querySelector('.is-invalid');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setProfileUpdateLoading(true);
    setProfileUpdateError(null);
    
    try {
      // Use the custom update-profile endpoint we created in the backend
      const response = await axios.post(`${API_URL}/users/update-profile/`, {
        // User data
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        phone_number: profileForm.phone_number,
        address: profileForm.address,
        
        // Profile data
        bio: profileForm.bio,
        favorite_cuisine: profileForm.favorite_cuisine,
        
        // Password change data (only include if password fields are filled)
        ...(profileForm.password && profileForm.current_password ? {
          current_password: profileForm.current_password,
          password: profileForm.password,
          password2: profileForm.password2
        } : {})
      }, {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Profile updated successfully:', response.data);
      
      // Navigate back to profile page
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileUpdateError('An error occurred while updating your profile');
    } finally {
      setProfileUpdateLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="alert alert-warning">
        User not found. Please log in again.
      </div>
    );
  }
  
  return (
    <div className="edit-profile-page">
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <h1>Edit Profile</h1>
            
            {profileUpdateError && (
              <div className="alert alert-danger">
                {profileUpdateError}
              </div>
            )}
            
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label htmlFor="first_name" className="form-label">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={profileForm.first_name}
                  onChange={handleProfileFormChange}
                  className={`form-control ${formErrors.first_name ? 'is-invalid' : ''}`}
                  required
                />
                {formErrors.first_name && (
                  <div className="invalid-feedback">
                    {formErrors.first_name}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="last_name" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={profileForm.last_name}
                  onChange={handleProfileFormChange}
                  className={`form-control ${formErrors.last_name ? 'is-invalid' : ''}`}
                  required
                />
                {formErrors.last_name && (
                  <div className="invalid-feedback">
                    {formErrors.last_name}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileFormChange}
                  className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                  required
                />
                {formErrors.email && (
                  <div className="invalid-feedback">
                    {formErrors.email}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="phone_number" className="form-label">Phone Number</label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={profileForm.phone_number}
                  onChange={handleProfileFormChange}
                  className={`form-control ${formErrors.phone_number ? 'is-invalid' : ''}`}
                  placeholder="+1234567890"
                />
                {formErrors.phone_number && (
                  <div className="invalid-feedback">
                    {formErrors.phone_number}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="address" className="form-label">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={profileForm.address}
                  onChange={handleProfileFormChange}
                  className="form-control"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="bio" className="form-label">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleProfileFormChange}
                  className="form-control"
                  rows="3"
                  placeholder="Tell us about yourself"
                ></textarea>
                {formErrors.bio && (
                  <div className="invalid-feedback">
                    {formErrors.bio}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="favorite_cuisine" className="form-label">Favorite Cuisine</label>
                <input
                  type="text"
                  id="favorite_cuisine"
                  name="favorite_cuisine"
                  value={profileForm.favorite_cuisine}
                  onChange={handleProfileFormChange}
                  className="form-control"
                  placeholder="e.g., Italian, Japanese, Mexican"
                />
              </div>
              
              <hr style={{ margin: '2rem 0' }} />
              
              <h3>Change Password</h3>
              <p className="text-muted">Leave these fields blank if you don't want to change your password.</p>
              
              <div className="form-group">
                <label htmlFor="current_password" className="form-label">Current Password</label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={profileForm.current_password}
                  onChange={handleProfileFormChange}
                  className={`form-control ${formErrors.current_password ? 'is-invalid' : ''}`}
                />
                {formErrors.current_password && (
                  <div className="invalid-feedback">
                    {formErrors.current_password}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={profileForm.password}
                  onChange={handleProfileFormChange}
                  className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                />
                {formErrors.password && (
                  <div className="invalid-feedback">
                    {formErrors.password}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="password2" className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  id="password2"
                  name="password2"
                  value={profileForm.password2}
                  onChange={handleProfileFormChange}
                  className={`form-control ${formErrors.password2 ? 'is-invalid' : ''}`}
                />
                {formErrors.password2 && (
                  <div className="invalid-feedback">
                    {formErrors.password2}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => navigate('/profile')}
                  disabled={profileUpdateLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={profileUpdateLoading}
                >
                  {profileUpdateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
