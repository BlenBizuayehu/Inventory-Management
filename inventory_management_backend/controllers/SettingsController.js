const SystemSettings = require('../models/SystemSettings');
const Invoice = require('../models/Invoice');
const ProductPrice = require('../models/ProductPrice');
const Product = require('../models/Product');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/Admin
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res, next) => {
  try {
    const currentSettings = await SystemSettings.getSettings();
    const newCurrency = req.body.currency || currentSettings.currency;
    const isCurrencyChanging = newCurrency !== currentSettings.currency;

    // Validate exchange rate if currency is changing
    if (isCurrencyChanging) {
      if (!req.body.exchangeRate) {
        return res.status(400).json({
          success: false,
          error: 'Exchange rate is required when changing currency'
        });
      }
    }

    // Prepare update data
    const updateData = {
      vatRate: req.body.vatRate ? parseFloat(req.body.vatRate) / 100 : currentSettings.vatRate,
      currency: newCurrency,
      language: req.body.language || currentSettings.language
    };

    // Update exchange rates if provided
    if (req.body.exchangeRate) {
      updateData.$set = {
        [`exchangeRates.${currentSettings.currency}`]: parseFloat(req.body.exchangeRate)
      };
    }

    // Update settings
    const updatedSettings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      updateData,
      { new: true, runValidators: true }
    );

    // Convert all monetary values if currency changed
    if (isCurrencyChanging) {
      await convertSystemCurrency(
        currentSettings.currency,
        newCurrency,
        parseFloat(req.body.exchangeRate)
      );
    }

    res.status(200).json({
      success: true,
      data: updatedSettings
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to convert all monetary values in the system
async function convertSystemCurrency(oldCurrency, newCurrency, exchangeRate) {
  try {
    // Convert invoices
    await Invoice.updateMany(
      {},
      [
        {
          $set: {
            subtotal: { $divide: ["$subtotal", exchangeRate] },
            vatAmount: { $divide: ["$vatAmount", exchangeRate] },
            total: { $divide: ["$total", exchangeRate] }
          }
        }
      ]
    );

    // Convert product prices
    await ProductPrice.updateMany(
      {},
      [
        {
          $set: {
            buyPrice: { $divide: ["$buyPrice", exchangeRate] },
            sellPrice: { $divide: ["$sellPrice", exchangeRate] }
          }
        }
      ]
    );

    // Convert product cost prices
    await Product.updateMany(
      {},
      [
        {
          $set: {
            costPrice: { $divide: ["$costPrice", exchangeRate] }
          }
        }
      ]
    );

    console.log(`Successfully converted all monetary values from ${oldCurrency} to ${newCurrency}`);
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw error;
  }
}