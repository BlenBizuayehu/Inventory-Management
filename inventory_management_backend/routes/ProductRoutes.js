const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");
const multer = require("multer");
const path = require("path");
const { protect, authorize } = require("../middleware/auth");


// Storage config for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage });




// Routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProduct);

const protectedUpload = (req, res, next) => {
  // First run the standard auth middleware
  protect(req, res, (err) => {
    if (err) return next(err);
    // Then run authorization
    authorize('owner')(req, res, (err) => {
      if (err) return next(err);
      // Finally process the file upload
      upload.single('image')(req, res, next);
    });
  });
};


router.post("/", protectedUpload, productController.createProduct);
router.put("/:id", protectedUpload, productController.updateProduct);

router.delete(
  "/:id",
  protect,
  authorize("owner"),
  productController.deleteProduct
);


module.exports = router;
