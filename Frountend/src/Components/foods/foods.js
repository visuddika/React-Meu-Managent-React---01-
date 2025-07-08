import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./foods.css";

const FoodApp = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Item");
  const [cartItems, setCartItems] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    itemId: null
  });

  const categories = [
    { name: "All Item", icon: "🍽️" },
    { name: "Salad", icon: "🥗" },
    { name: "Burger", icon: "🍔" },
    { name: "Pizza", icon: "🍕" },
    { name: "Pasta", icon: "🍝" },
    { name: "Drinks", icon: "🥤" },
    { name: "Sweet", icon: "🍬" },
    { name: "Healthy Food", icon: "🥑" }
  ];

  useEffect(() => {
    fetchFoodItems();
    const storedCartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    setCartItems(storedCartItems);
  }, []);

  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5001/api/menus", {
        withCredentials: true,
        timeout: 10000,
      });

      if (response.data?.success) {
        const items = response.data.data;
        setFoodItems(items);
        localStorage.setItem("foodItems", JSON.stringify(items));
      } else {
        throw new Error(response.data?.message || "Failed to fetch menu items");
      }
    } catch (error) {
      let errorMessage = "An error occurred while fetching menu items.";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout. Server is not responding.";
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = "No response from server. The backend might be down.";
      } else {
        errorMessage = `Request error: ${error.message}`;
      }
      setError(errorMessage);

      const storedFoodItems = JSON.parse(localStorage.getItem("foodItems")) || [];
      if (storedFoodItems.length) {
        setFoodItems(storedFoodItems);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setSearchQuery("");
  };

  const openDeleteConfirmation = (itemId) => {
    setDeleteConfirmation({
      isOpen: true,
      itemId: itemId
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      itemId: null
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.itemId) {
      const updatedFoodItems = foodItems.filter(item => item.id !== deleteConfirmation.itemId);
      setFoodItems(updatedFoodItems);
      localStorage.setItem("foodItems", JSON.stringify(updatedFoodItems));

      const updatedCart = cartItems.filter(item => item.id !== deleteConfirmation.itemId);
      setCartItems(updatedCart);
      localStorage.setItem("cartItems", JSON.stringify(updatedCart));

      closeDeleteConfirmation();
    }
  };

  const handleAddToCart = (item) => {
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);
    const updatedCartItems = existingItem
      ? cartItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 }
            : cartItem
        )
      : [...cartItems, { ...item, quantity: 1 }];

    setCartItems(updatedCartItems);
    localStorage.setItem("cartItems", JSON.stringify(updatedCartItems));
  };

  const filteredItems =
    selectedCategory === "All Item"
      ? foodItems.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : foodItems.filter(
          (item) =>
            item.category?.toLowerCase() === selectedCategory.toLowerCase() &&
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">F</div>
          <div className="logo-text">Restaurant</div>
        </div>
        <div className="sidebar-menu">
          <Link to="/" className="menu-item active">
            <i className="fas fa-home menu-icon"></i>
            <span className="menu-text">Home</span>
          </Link>
        </div>
        <div className="logout">
          <i className="fas fa-sign-out-alt logout-icon"></i>
          <span className="logout-text">Logout</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="food-page-container">
          {/* Delete Confirmation */}
          {deleteConfirmation.isOpen && (
            <div className="delete-confirmation-overlay">
              <div className="delete-confirmation-dialog">
                <h3>Confirm Delete</h3>
                <p>Are you sure you want to delete this item?</p>
                <div className="delete-confirmation-buttons">
                  <button className="cancel-button" onClick={closeDeleteConfirmation}>Cancel</button>
                  <button className="confirm-delete-button" onClick={confirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          )}

          <div className="search-and-filter">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search for food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-button">
                <i className="fas fa-search"></i>
              </button>
            </div>

            <div className="category-tabs">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className={`category-tab ${selectedCategory === cat.name ? "active" : ""}`}
                  onClick={() => handleCategoryClick(cat.name)}
                >
                  <div className="category-label">
                    {cat.icon} {cat.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading menu items...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">❌ {error}</p>
              <button className="retry-button" onClick={fetchFoodItems}>Try Again</button>
            </div>
          ) : (
            <div className="food-grid">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div className="food-card" key={item._id || item.id}>
                    <div className="food-image">
                      {item.image && (
                        <img
                          src={item.image.startsWith('http')
                            ? item.image
                            : `http://localhost:5001/${item.image}`}
                          alt={item.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/400x320?text=Food+Image";
                          }}
                        />
                      )}
                    </div>
                    <div className="food-details">
                      <h3>{item.name}</h3>
                      <p className="food-description">{item.description}</p>
                      <div className="price-section">
                        <div className="current-price">${item.currentPrice}</div>
                        {item.originalPrice && (
                          <div className="original-price">${item.originalPrice}</div>
                        )}
                      </div>
                      <div className="button-group">
                        <button className="add-to-cart-button" onClick={() => handleAddToCart(item)}>
                          Add to Cart
                        </button>
                        <button className="delete-button" onClick={() => openDeleteConfirmation(item.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-items">
                  <p>No items found for the selected category.</p>
                  {selectedCategory !== "All Item" && (
                    <button className="reset-filter" onClick={() => setSelectedCategory("All Item")}>
                      Show All Items
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodApp;
