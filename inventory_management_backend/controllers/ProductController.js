const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});


// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse(`Invalid product ID: ${req.params.id}`, 400));
  }
  const product = await Product.findById(req.params.id).populate('category');
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, data: product });
});


/**
 * @desc    Create product
 * @route   POST /api/products
 * @access  Private/owner
 */

exports.createProduct = asyncHandler(async (req, res, next) => {
  const productData = { ...req.body, user: req.user.id };
  const product = await Product.create(productData);

  if (req.file) {
    const tempFilePath = req.file.path; // e.g., 'uploads/temp-12345.png'

    const finalFileName = `photo_${product._id}${path.parse(req.file.originalname).ext}`;
    
    // --- THIS IS THE FIX ---
    // We create a path relative to the project root by NOT using a leading slash.
    // This will correctly resolve to 'uploads/photo_685abc.png' inside your project.
    const finalFilePath = path.join('uploads', finalFileName); 

    fs.renameSync(tempFilePath, finalFilePath);
    
    product.imageUrl = finalFileName;
    await product.save();
  }

  res.status(201).json({
    success: true,
    data: product
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = asyncHandler(async (req, res, next) => {
  const updateData = { ...req.body };

  if (req.file) {
    const newFileName = `photo_${req.params.id}${path.parse(req.file.originalname).ext}`;
    
    // --- THIS IS THE FIX ---
    const newFilePath = path.join('uploads', newFileName);

    fs.renameSync(req.file.path, newFilePath);
    updateData.imageUrl = newFileName;

    const product = await Product.findById(req.params.id);
    if (product && product.imageUrl && product.imageUrl !== newFileName) {
      // --- THIS IS THE FIX ---
      const oldImagePath = path.join('uploads', product.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  if (!updatedProduct) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: updatedProduct
  });
});


/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  if (product.imageUrl) {
    // --- THIS IS THE FIX ---
    const filePath = path.join('uploads', product.imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await product.deleteOne();
  res.status(200).json({ success: true, data: {} });
});
// NOTE: The separate `uploadProductPhoto` route is now redundant because the
// `updateProduct` route handles image uploads. You can remove it unless
// you have a specific reason to keep it. For simplicity, I've left it out here.