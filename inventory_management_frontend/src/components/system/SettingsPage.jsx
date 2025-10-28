import { useEffect, useState } from 'react';
import { FaInfoCircle, FaSave, FaSpinner, FaUndo } from 'react-icons/fa';
import api from '../../api';
import './SettingsPage.css';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    vatRate: 15,
    currency: 'ETB',
    language: 'en'
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [exchangeRate, setExchangeRate] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'ETB', name: 'Ethiopian Birr' },
    { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'NGN', name: 'Nigerian Naira' }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'am', name: 'Amharic' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/settings');
      if (response.data?.success) {
        const data = response.data.data;
        const settingsData = {
          vatRate: (data.vatRate * 100).toFixed(2),
          currency: data.currency,
          language: data.language
        };
        setSettings(settingsData);
        setOriginalSettings(settingsData);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setSettings(prev => ({
      ...prev,
      currency: newCurrency
    }));
    // Reset exchange rate when currency changes
    if (originalSettings?.currency !== newCurrency) {
      setExchangeRate('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...settings,
        vatRate: parseFloat(settings.vatRate)
      };

      // Add exchange rate if currency is changing
      if (settings.currency !== originalSettings.currency) {
        if (!exchangeRate || isNaN(parseFloat(exchangeRate))) {
          throw new Error('Please enter a valid exchange rate');
        }
        payload.exchangeRate = parseFloat(exchangeRate);
      }

      const response = await api.put('/settings', payload);

      if (response.data?.success) {
        setSuccess('Settings updated successfully');
        fetchSettings();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setExchangeRate('');
    }
  };

  const hasChanges = () => {
    if (!originalSettings) return false;
    return (
      settings.vatRate !== originalSettings.vatRate ||
      settings.currency !== originalSettings.currency ||
      settings.language !== originalSettings.language
    );
  };

  const isCurrencyChanging = () => {
    return originalSettings && settings.currency !== originalSettings.currency;
  };

  return (
    <div className="settings-page">
      <h1>System Settings</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isLoading && !originalSettings ? (
        <div className="loading">Loading settings...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>VAT Rate (%)</label>
            <input
              type="number"
              name="vatRate"
              value={settings.vatRate}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Currency
              <button 
                type="button" 
                className="help-btn"
                onClick={() => setShowHelp(!showHelp)}
              >
                <FaInfoCircle />
              </button>
            </label>
            <select
              name="currency"
              value={settings.currency}
              onChange={handleCurrencyChange}
              required
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
            {showHelp && (
              <div className="help-text">
                Changing the currency will convert all monetary values in the system.
              </div>
            )}
          </div>

          {isCurrencyChanging() && (
            <div className="form-group">
              <label>
                Exchange Rate (1 {originalSettings.currency} = ? {settings.currency})
              </label>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                min="0.0001"
                step="0.0001"
                required
                placeholder={`Enter conversion rate`}
              />
              <small className="help-text">
                Example: If 1 USD = 55 ETB, enter 55 when changing from ETB to USD
              </small>
            </div>
          )}

          <div className="form-group">
            <label>Language</label>
            <select
              name="language"
              value={settings.language}
              onChange={handleChange}
              required
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={!hasChanges() || isLoading}
            >
              <FaUndo /> Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                (!hasChanges() && !isCurrencyChanging()) || 
                isLoading || 
                (isCurrencyChanging() && !exchangeRate)
              }
            >
              {isLoading ? <FaSpinner className="spin" /> : <FaSave />}
              {isLoading ? ' Saving...' : ' Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsPage;