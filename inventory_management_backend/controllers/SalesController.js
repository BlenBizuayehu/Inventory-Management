const Sale = require('../models/Sale');
const Product = require('../models/Product');

exports.createSale = async (req, res, next) => {
  try {
    const { shop, items } = req.body;

    // Validate stock and calculate total
    let totalAmount = 0;
    const productsToUpdate = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }
      totalAmount += item.price * item.quantity;
      productsToUpdate.push({
        productId: product._id,
        quantity: item.quantity
      });
    }

    // Create sale
    const sale = await Sale.create({
      shop,
      items,
      totalAmount,
      soldBy: req.user.id
    });

    // Update product stocks
    for (const item of productsToUpdate) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({
      success: true,
      data: sale
    });
  } catch (err) {
    next(err);
  }
};

exports.getSales = async (req, res, next) => {
  try {
    const sales = await Sale.find()
      .populate('shop', 'name')
      .populate('soldBy', 'name')
      .populate('items.product', 'name sellingPrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sales
    });
  } catch (err) {
    next(err);
  }
};