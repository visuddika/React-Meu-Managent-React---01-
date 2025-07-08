const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer");
const menuRoutes = require("./Routes/MenuRoutes"); // Ensure the correct route file path

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// CORS Configuration
const corsOptions = {
  origin: "http://localhost:3000", // Adjust this if using a different frontend port
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Serve static files (images) from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Set up body parser to handle JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up file upload using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify folder to save uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage: storage });

// Routes with file upload middleware
app.use("/api/menus", upload.single("image"), menuRoutes); // Ensure menuRoutes exists

// MongoDB Connection
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://admin:Upadya*25@cluster0.gleae.mongodb.net/"; // Replace with your Mongo URI if needed

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
