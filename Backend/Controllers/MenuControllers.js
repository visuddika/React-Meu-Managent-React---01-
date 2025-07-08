const Menu = require("../Model/MenuModel"); // Adjust the model path as needed


const validateMenuData = (name, description, originalPrice, currentPrice, image, category) => {
  const errors = {};

  
  if (!name || !name.trim()) errors.name = "Name is required";
  if (!description || !description.trim()) errors.description = "Description is required";

  // Validate pricing
  if (originalPrice === undefined || originalPrice === null || isNaN(originalPrice)) {
    errors.originalPrice = "Original price is required and must be a number";
  } else if (!isFinite(originalPrice) || originalPrice <= 0) {
    errors.originalPrice = "Original price must be a positive number";
  }

  if (currentPrice === undefined || currentPrice === null || isNaN(currentPrice)) {
    errors.currentPrice = "Current price is required and must be a number";
  } else if (!isFinite(currentPrice) || currentPrice <= 0) {
    errors.currentPrice = "Current price must be a positive number";
  } else if (currentPrice > originalPrice) {
    errors.currentPrice = "Current price cannot be higher than original price";
  }

  // Validate category
  const validCategories = ['pizza', 'burger', 'juice', 'pasta', 'healthy food', 'all'];
  if (!category || !validCategories.includes(category)) {
    errors.category = "Valid category is required (pizza, burger, juice, pasta, healthy food, all)";
  }

  // Validate image (accept both file and url)
  if (image && typeof image !== 'string') {
    errors.image = "Image must be a valid URL string";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// GET all menus with optional filtering by category
const getAllMenus = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category && category !== 'all' ? { category } : {};
    const menus = await Menu.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: menus });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch menus", error: err.message });
  }
};

// GET menu by ID
const getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ success: false, message: "Menu not found" });
    res.status(200).json({ success: true, data: menu });
  } catch (err) {
    const status = err.kind === 'ObjectId' ? 400 : 500;
    const message = err.kind === 'ObjectId' ? "Invalid menu ID format" : "Failed to fetch menu";
    res.status(status).json({ success: false, message, error: err.message });
  }
};

// POST new menu
const addMenu = async (req, res) => {
  try {
    let { name, description, originalPrice, currentPrice, category } = req.body;
    name = name?.trim();
    description = description?.trim();
    originalPrice = parseFloat(originalPrice);
    currentPrice = parseFloat(currentPrice);
    category = category?.toLowerCase();

    // Handle image (file or string)
    let image = req.body.image;
    if (req.file) {
      // Assuming multer is used and file is saved locally or on cloud
      image = req.file.path || req.file.location; // .location if using S3, .path if local
    }

    const { isValid, errors } = validateMenuData(name, description, originalPrice, currentPrice, image, category);
    if (!isValid) return res.status(400).json({ success: false, message: "Validation failed", errors });

    const isOnSale = currentPrice < originalPrice;
    const newMenu = new Menu({ name, description, originalPrice, currentPrice, category, image, isOnSale });
    await newMenu.save();

    res.status(201).json({ success: true, data: newMenu });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update menu
const updateMenu = async (req, res) => {
  try {
    let { name, description, originalPrice, currentPrice, category } = req.body;
    name = name?.trim();
    description = description?.trim();
    originalPrice = parseFloat(originalPrice);
    currentPrice = parseFloat(currentPrice);
    category = category?.toLowerCase();

    // Handle image (file or string)
    let image = req.body.image;
    if (req.file) {
      image = req.file.path || req.file.location;
    }

    const { isValid, errors } = validateMenuData(name, description, originalPrice, currentPrice, image, category);
    if (!isValid) return res.status(400).json({ success: false, message: "Validation failed", errors });

    const existing = await Menu.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Menu not found" });

    const isOnSale = currentPrice < originalPrice;
    const updated = await Menu.findByIdAndUpdate(
      req.params.id,
      { name, description, originalPrice, currentPrice, category, image, isOnSale },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE menu
const deleteMenu = async (req, res) => {
  try {
    const deleted = await Menu.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Menu not found" });

    res.status(200).json({ success: true, message: "Menu deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllMenus,
  getMenuById,
  addMenu,
  updateMenu,
  deleteMenu
};
