const SystemSettings = require('../models/SystemSettings');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/Admin
// controllers/settings.js
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
// controllers/settings.js

// @desc    Update system settings with currency conversion
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await SystemSettings.getSettings();
    const oldCurrency = settings.currency;
    const newCurrency = req.body.currency;
    
    // Convert percentage to decimal for VAT
    if (req.body.vatRate) {
      req.body.vatRate = parseFloat(req.body.vatRate) / 100;
    }

    // If currency is changing, require exchange rates
    if (newCurrency && newCurrency !== oldCurrency) {
      if (!req.body.exchangeRates || !req.body.exchangeRates[oldCurrency]) {
        return res.status(400).json({
          success: false,
          error: 'Exchange rate for current currency is required when changing currency'
        });
      }
    }

    // Update settings
    const updatedSettings = await SystemSettings.findByIdAndUpdate(
      settings._id, 
      req.body, 
      { new: true, runValidators: true }
    );

    // If currency changed, convert all monetary values in the system
    if (newCurrency && newCurrency !== oldCurrency) {
      const conversionRate = req.body.exchangeRates[oldCurrency];
      await convertSystemCurrency(oldCurrency, newCurrency, conversionRate);
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
async function convertSystemCurrency(oldCurrency, newCurrency, conversionRate) {
  // Example conversion for invoices - add similar for other models
  await Invoice.updateMany(
    {},
    [
      {
        $set: {
          subtotal: { $divide: ["$subtotal", conversionRate] },
          vatAmount: { $divide: ["$vatAmount", conversionRate] },
          total: { $divide: ["$total", conversionRate] }
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
          buyPrice: { $divide: ["$buyPrice", conversionRate] },
          sellPrice: { $divide: ["$sellPrice", conversionRate] }
        }
      }
    ]
  );

  // Add conversions for other monetary fields as needed
}