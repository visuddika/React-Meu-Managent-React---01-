import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./UpdateMenu.css";

function UpdateMenu() {
  const [inputs, setInputs] = useState({
    name: "",
    description: "",
    currentPrice: "",
    originalPrice: "",
    category: "",
  });

  const [imageFile, setImageFile] = useState(null); // selected new image file
  const [imagePreview, setImagePreview] = useState(null); // preview URL of new image
  const [currentImageUrl, setCurrentImageUrl] = useState(null); // existing image URL from backend

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const imageInputRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const categories = [
    "Salad",
    "Burger",
    "Pizza",
    "Pasta",
    "Drinks",
    "Rice or Curry",
    "Healthy Food",
  ];

  // Helper function to construct proper image URL - same as MenuDetails
  const constructImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Use the same format as MenuDetails component
    return `http://localhost:5001/${imagePath}`;
  };

  useEffect(() => {
    // fetch menu item details by id
    async function fetchMenu() {
      try {
        console.log("Fetching menu with ID:", id);
        const res = await axios.get(`http://localhost:5001/api/menus/${id}`);
        console.log("Menu data received:", res.data);
        
        if (res.data && res.data.data) {
          const menu = res.data.data;
          console.log("Menu item:", menu);
          
          setInputs({
            name: menu.name || "",
            description: menu.description || "",
            currentPrice: menu.currentPrice?.toString() || "",
            originalPrice: menu.originalPrice?.toString() || "",
            category: menu.category || "",
          });

          // Debug image path
          console.log("Image path from backend:", menu.image);
          
          // Use the same URL construction as MenuDetails
          const imageUrl = menu.image ? `http://localhost:5001/${menu.image}` : null;
          console.log("Constructed image URL:", imageUrl);
          
          setCurrentImageUrl(imageUrl);
          setImagePreview(null);
          setImageFile(null);
        } else {
          setMessage("Menu item not found.");
        }
      } catch (err) {
        console.error("Error fetching menu:", err);
        setMessage("Failed to load menu item.");
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, [id]);

  // Validate form fields
  const validateForm = () => {
    const errs = {};
    if (!inputs.name.trim()) errs.name = "Name is required!";
    else if (inputs.name.trim().length < 3) errs.name = "Name must be at least 3 characters!";

    if (!inputs.description.trim()) errs.description = "Description is required!";
    else if (inputs.description.trim().length < 10) errs.description = "Description must be at least 10 characters!";

    if (!inputs.currentPrice || isNaN(inputs.currentPrice) || Number(inputs.currentPrice) <= 0) {
      errs.currentPrice = "Enter a valid current price!";
    }

    if (inputs.originalPrice) {
      if (isNaN(inputs.originalPrice) || Number(inputs.originalPrice) <= 0) {
        errs.originalPrice = "Original price must be greater than 0!";
      } else if (parseFloat(inputs.originalPrice) <= parseFloat(inputs.currentPrice)) {
        errs.originalPrice = "Original price must be greater than current price!";
      }
    }

    if (!inputs.category.trim()) errs.category = "Category is required!";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", inputs.name.trim());
      formData.append("description", inputs.description.trim());
      formData.append("currentPrice", Number(inputs.currentPrice));
      if (inputs.originalPrice && inputs.originalPrice.trim() !== "") {
        formData.append("originalPrice", Number(inputs.originalPrice));
      }
      formData.append("category", inputs.category.trim());

      if (imageFile) {
        formData.append("image", imageFile);
      }

      await axios.put(`http://localhost:5001/api/menus/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
        timeout: 10000,
      });

      setMessage("✅ Menu updated successfully!");
      setTimeout(() => navigate("/menudetails"), 1500);
    } catch (error) {
      console.error("Update error:", error);
      if (error.response) {
        setMessage(`❌ Failed to update menu. ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setMessage("❌ No response from server. Please try again.");
      } else {
        setMessage("❌ Failed to update menu due to an error.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle inputs change
  const handleInputChange = (e) => {
    setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear specific field error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  // Handle image input change + create preview url
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage("❌ Please select a valid image file.");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ Image size should be less than 5MB.");
        return;
      }

      setImageFile(file);

      // Clean up previous preview URL to avoid memory leaks
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      // create object URL for preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setMessage(""); // Clear any error messages
    } else {
      setImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    }
  };

  // Cleanup function to revoke object URLs
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Handle image load error
  const handleImageError = (e) => {
    console.error("Image failed to load:", e.target.src);
    console.log("Trying to load image from:", e.target.src);
    e.target.style.display = 'none';
    const errorDiv = e.target.parentElement.querySelector('.image-error');
    if (errorDiv) {
      errorDiv.style.display = 'block';
    }
  };

  return (
    <div className="update-menu-container">
      <h2>Update Menu Item</h2>
      {loading ? (
        <div className="loading-spinner">
          <p>Loading...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={inputs.name}
              onChange={handleInputChange}
              disabled={submitting}
              placeholder="Enter menu item name"
            />
            {errors.name && <small className="error">{errors.name}</small>}
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={inputs.description}
              onChange={handleInputChange}
              disabled={submitting}
              placeholder="Enter description"
              rows="4"
            />
            {errors.description && <small className="error">{errors.description}</small>}
          </div>

          <div className="form-group">
            <label>Current Price:</label>
            <input
              type="text"
              name="currentPrice"
              value={inputs.currentPrice}
              onChange={handleInputChange}
              disabled={submitting}
              placeholder="0.00"
            />
            {errors.currentPrice && <small className="error">{errors.currentPrice}</small>}
          </div>

          <div className="form-group">
            <label>Original Price (optional):</label>
            <input
              type="text"
              name="originalPrice"
              value={inputs.originalPrice}
              onChange={handleInputChange}
              disabled={submitting}
              placeholder="0.00"
            />
            {errors.originalPrice && <small className="error">{errors.originalPrice}</small>}
          </div>

          <div className="form-group">
            <label>Category:</label>
            <select
              name="category"
              value={inputs.category}
              onChange={handleInputChange}
              disabled={submitting}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <small className="error">{errors.category}</small>}
          </div>

          <div className="form-group">
            <label>Current Image:</label>
            <br />
            <div className="image-preview-container">
              {imagePreview ? (
                <div className="image-wrapper">
                  <img 
                    src={imagePreview} 
                    alt="New Preview" 
                    width="120" 
                    height="100" 
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                    onError={handleImageError}
                  />
                  <span className="image-label">New Image Preview</span>
                </div>
              ) : currentImageUrl ? (
                <div className="image-wrapper">
                  <img 
                    src={currentImageUrl} 
                    alt="Current" 
                    width="120" 
                    height="100" 
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                    onError={handleImageError}
                    onLoad={() => console.log("Image loaded successfully:", currentImageUrl)}
                  />
                  <span className="image-label">Current Image</span>
                  <div className="image-error" style={{ display: 'none', color: 'red' }}>
                    ❌ Image failed to load: {currentImageUrl}
                  </div>
                </div>
              ) : (
                <div className="no-image">
                  <p>No image available</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Upload New Image (optional):</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={imageInputRef}
              disabled={submitting}
            />
            <small className="file-hint">Accepted formats: JPG, PNG, GIF. Max size: 5MB</small>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Menu"}
            </button>
            <button 
              type="button" 
              onClick={() => navigate("/menudetails")}
              disabled={submitting}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>

          {message && (
            <div className={`form-message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default UpdateMenu;