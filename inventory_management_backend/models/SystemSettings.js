const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  vatRate: { type: Number, default: 0.15 },
  currency: { type: String, default: 'ETB' },
  language: { type: String, default: 'en' },
  exchangeRates: {
    type: Map,
    of: Number,
    default: () => new Map([['ETB', 1]])
  },
  lastCurrencyUpdate: { type: Date }
}, { timestamps: true });

// Static method to get current settings
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to convert currency
systemSettingsSchema.methods.convertAmount = function(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = this.exchangeRates.get(fromCurrency);
  const toRate = this.exchangeRates.get(toCurrency);
  
  if (!fromRate || !toRate) {
    throw new Error(`Missing exchange rates for conversion`);
  }
  
  // Convert to base currency first, then to target currency
  return (amount / fromRate) * toRate;
};

// Static method to update exchange rates
systemSettingsSchema.statics.updateExchangeRates = async function(rates) {
  const settings = await this.getSettings();
  for (const [currency, rate] of Object.entries(rates)) {
    settings.exchangeRates.set(currency, rate);
  }
  settings.lastCurrencyUpdate = new Date();
  return settings.save();
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);