import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Menu.css';

const AddMenuForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    currentPrice: '',
    originalPrice: '',
    category: '',
    image: null,
  });

  const categories = [
    'Salad',
    'Burger',
    'Pizza',
    'Pasta',
    'Drinks',
    'Sweet',
    'Healthy Food'
  ];

  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Name validation
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters long';
      isValid = false;
    }

    // Description validation
    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
      isValid = false;
    }

    // Current price validation
    if (!formData.currentPrice || formData.currentPrice.toString().trim() === '') {
      newErrors.currentPrice = 'Current price is required';
      isValid = false;
    } else {
      const currentPriceNum = parseFloat(formData.currentPrice);
      if (isNaN(currentPriceNum)) {
        newErrors.currentPrice = 'Current price must be a valid number';
        isValid = false;
      } else if (currentPriceNum <= 0) {
        newErrors.currentPrice = 'Current price must be greater than 0';
        isValid = false;
      }
    }

    // Original price validation (optional)
    if (formData.originalPrice && formData.originalPrice.toString().trim() !== '') {
      const originalPriceNum = parseFloat(formData.originalPrice);
      if (isNaN(originalPriceNum)) {
        newErrors.originalPrice = 'Original price must be a valid number';
        isValid = false;
      } else if (originalPriceNum <= 0) {
        newErrors.originalPrice = 'Original price must be greater than 0';
        isValid = false;
      } else if (formData.currentPrice && originalPriceNum <= parseFloat(formData.currentPrice)) {
        newErrors.originalPrice = 'Original price must be greater than current price';
        isValid = false;
      }
    }

    // Category validation
    if (!formData.category || formData.category.trim() === '') {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    // Image validation
    if (formData.image) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(formData.image.type)) {
        newErrors.image = 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
        isValid = false;
      } else if (formData.image.size > maxSize) {
        newErrors.image = 'Image size must be less than 5MB';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any existing image errors
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    // Clear the file input
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setError(null);
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Create FormData for multipart/form-data
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('currentPrice', formData.currentPrice.toString());
      submitData.append('originalPrice', formData.originalPrice || '');
      submitData.append('category', formData.category);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (let [key, value] of submitData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post(
        'http://localhost:5001/api/menus',
        submitData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true,
          timeout: 30000 // Increased timeout for image upload
        }
      );

      // Log the response to debug
      console.log(response);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Invalid server response');
      }

      // Set success message and reset form
      setSuccessMessage(response.data.message || '🎉 Menu item added successfully!');
      setFormData({
        name: '',
        description: '',
        currentPrice: '',
        originalPrice: '',
        category: '',
        image: null,
      });
      setImagePreview(null);

      // Clear the file input
      const fileInput = document.getElementById('image');
      if (fileInput) fileInput.value = '';

      // Directly navigate after successful submission
      navigate("/menudetails"); // Direct navigation without delay

    } catch (error) {
      console.error('Full error:', error);
      let errorMessage = 'An error occurred while adding the menu.';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Server is not responding.';
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = `No response from server. Possible issues:
          1. Backend server is not running
          2. Incorrect API endpoint
          3. Network connectivity issues
          4. CORS policy blocking the request`;
      } else {
        errorMessage = `Request error: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="menu-form-container">
      <h2 className="menu-form-title">Add New Menu</h2>

      {successMessage && (
        <div className="success-message">✅ {successMessage}</div>
      )}

      {error && (
        <div className="error-message">
          ❌ {error.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="menu-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? 'input-error' : ''}`}
            placeholder="Enter menu item name"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`form-input ${errors.description ? 'input-error' : ''}`}
            placeholder="Enter menu item description"
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="currentPrice">Current Price ($)</label>
          <input
            id="currentPrice"
            name="currentPrice"
            type="number"
            value={formData.currentPrice}
            onChange={handleChange}
            className={`form-input ${errors.currentPrice ? 'input-error' : ''}`}
            placeholder="Enter current price"
            min="0.01"
            step="0.01"
          />
          {errors.currentPrice && <span className="error-text">{errors.currentPrice}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="originalPrice">
            Original Price ($) <span className="optional-text">(optional)</span>
          </label>
          <input
            id="originalPrice"
            name="originalPrice"
            type="number"
            value={formData.originalPrice}
            onChange={handleChange}
            className={`form-input ${errors.originalPrice ? 'input-error' : ''}`}
            placeholder="Enter original price"
            min="0.01"
            step="0.01"
          />
          {errors.originalPrice && <span className="error-text">{errors.originalPrice}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`form-input ${errors.category ? 'input-error' : ''}`}
          >
            <option value="">Select a category</option>
            {categories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <span className="error-text">{errors.category}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="image">
            Menu Image <span className="optional-text">(optional)</span>
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={`form-input ${errors.image ? 'input-error' : ''}`}
          />
          {errors.image && <span className="error-text">{errors.image}</span>}
          
          {imagePreview && (
            <div className="image-preview-container">
              <img 
                src={imagePreview} 
                alt="Menu item preview" 
                className="image-preview"
              />
              <button 
                type="button" 
                onClick={removeImage}
                className="remove-image-button"
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              Adding...
            </>
          ) : (
            'Add Menu'
          )}
        </button>
      </form>
    </div>
  );
};

export default AddMenuForm;