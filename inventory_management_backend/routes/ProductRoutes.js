const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
} = require("../controllers/ProductController"); // Adjust path if needed

const { protect, authorize } = require("../middleware/auth"); // Adjust path if needed

// --- Multer Configuration (This part is good) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // IMPORTANT: Make sure this path is relative to your project's root directory.
    // It's safer to use an absolute path or ensure your FILE_UPLOAD_PATH from .env is used.
    // For now, 'public/uploads/' is a common and good choice.
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // We give it a temporary name; the controller will give it its final name.
    const tempName = `temp-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, tempName);
  },
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        // Reject file
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: process.env.MAX_FILE_UPLOAD || 5000000 } // e.g., 5MB limit
});
// --- End of Multer Configuration ---


// --- Route Definitions ---

// Public routes - no protection needed
router.get("/", getAllProducts);
router.get("/:id", getProduct);

// REMOVED: The complex `protectedUpload` function is no longer needed.

// --- THIS IS THE FIX ---
// We apply the middleware as a simple, sequential list.
// Express will run them in order: protect -> authorize -> upload -> createProduct
router.post(
    "/",
    protect,
    authorize("owner", "admin"), // Allow both roles
    upload.single("image"), // Multer parses the form and uploads the file
    createProduct // Finally, the controller runs with req.body and req.file available
);

router.put(
    "/:id",
    protect,
    authorize("owner", "admin"),
    upload.single("image"),
    updateProduct
);
// --- END OF FIX ---


router.delete(
  "/:id",
  protect,
  authorize("owner", "admin"), // Also good to allow admin here
  deleteProduct
);

module.exports = router;