const  Category =require ("../models/Category.js");

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = new Category({ name });
    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Update category by ID
exports.updateCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const updatedData = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(categoryId, updatedData, {
      new: true,       // return the updated document
      runValidators: true  // run model validators on update
    });

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, data: updatedCategory });
  } catch (error) {
    next(error);
  }
};

// Delete category by ID
exports.deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
