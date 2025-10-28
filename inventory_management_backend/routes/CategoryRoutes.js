
const { createCategory, getCategories, updateCategory,  deleteCategory} =require("../controllers/CategoryController") ;
const express=require("express");

const router = express.Router();

router.get('/', getCategories);   // Get all categories
router.post('/', createCategory);    // Create new category
router.put('/:id', updateCategory);  // Update category
router.delete('/:id', deleteCategory); // Delete category

module.exports = router;