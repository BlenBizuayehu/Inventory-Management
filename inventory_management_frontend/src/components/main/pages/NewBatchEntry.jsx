import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Add this at the top

import { FaMinus, FaPlus, FaSave, FaSpinner, FaTrash } from 'react-icons/fa';
import './NewBatchEntry.css';

const NewBatchEntry = () => {
  const { invoiceId } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalInvoiceData, setOriginalInvoiceData] = useState(null);
  const [formData, setFormData] = useState({
    supplierName: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    items: [{
      product: '',
      buyPrice: '',
      quantityBought: 1,
      unitMode: 'pack', // 'pack' or 'piece'
      piecesPerPack: 1 
    }]
  });
  const [systemSettings, setSystemSettings] = useState({ vatRate: 0, currency: '' });
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [vatRate, setVatRate] = useState(0.15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const navigate = useNavigate();

  // Fetch products and suppliers
useEffect(() => {
  const fetchData = async () => {
    try {
      const [productsRes, suppliersRes, settingsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/products'),
        axios.get('http://localhost:5000/api/suppliers'),
        axios.get('http://localhost:5000/api/settings')
      ]);
      
      setProducts(productsRes.data?.data || []);
      setSuppliers(suppliersRes.data?.data || []);
      if (settingsRes.data?.success) {
          setSystemSettings(settingsRes.data.data);
      }
      
      if (invoiceId) {
        try {
          const invoiceRes = await axios.get(`http://localhost:5000/api/invoices/${invoiceId}`);
          const invoice = invoiceRes.data?.data;
          
          if (invoice) {
            setOriginalInvoiceData(invoice);
            setIsEditMode(true);

            // Handle supplier data properly
            const supplierValue = invoice.supplier?._id || 
                                invoice.supplier || 
                                invoice.supplierName || 
                                '';

                                // Transform items data to include unitMode and piecesPerPack
              const transformedItems = invoice.items?.map(item => ({
                product: item.product?._id || item.product || '',
                buyPrice: item.buyPrice?.toString() || '',
                quantityBought: item.quantityBought || 1,
                unitMode: item.unitMode || 'pack',
                piecesPerPack: item.piecesPerPack || 1
              })) || [{
                product: '',
                buyPrice: '',
                quantityBought: 1,
                unitMode: 'pack',
                piecesPerPack: 1
              }];
            
            setFormData({
                supplierName: supplierValue,
                invoiceNumber: invoice.invoiceNumber || '',
                invoiceDate: invoice.invoiceDate 
                  ? new Date(invoice.invoiceDate).toISOString().split('T')[0] 
                  : new Date().toISOString().split('T')[0],
                items: transformedItems
              });
            }
          } catch (error) {
            console.error('Error fetching invoice:', error);
            setSubmitError('Failed to load invoice data');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setSubmitError('Failed to load initial data');
      }
    };
  
  fetchData();
}, [invoiceId]);

const validateForm = () => {
  // Check required fields
  if (!formData.supplierName || !formData.invoiceNumber || !formData.invoiceDate) {
    return 'Please fill all required fields';
  }

  // Check items
  for (const item of formData.items) {
    if (!item.product || !item.buyPrice || !item.quantityBought) {
      return 'Please fill all fields for all items';
    }
    
    if (isNaN(item.buyPrice)) {
      return 'Buy price must be a valid number';
    }
    
    if (isNaN(item.quantityBought) || item.quantityBought < 1) {
      return 'Quantity must be at least 1';
    }
  }

  if (hasDuplicateProducts()) {
    return 'Duplicate products detected. Each product can only appear once.';
  }

  return null;
};

  const hasDuplicateProducts = () => {
  const productIds = formData.items.map(item => item.product);
  return new Set(productIds).size !== productIds.length;
  };

   // Calculate item totals and invoice totals
  const calculateTotals = () => {
    const vatRate = systemSettings.vatRate; 

    const itemsWithTotals = formData.items.map(item => {
    const isPack = item.unitMode === 'pack';
    const quantityInPieces = isPack 
      ? item.quantityBought * (item.piecesPerPack || 1)
      : item.quantityBought;
    
    const pricePerUnit = parseFloat(item.buyPrice || 0);
    const itemTotal = pricePerUnit * quantityInPieces;
    
    return {
      ...item,
      // Store both the entered quantity and calculated pieces
      enteredQuantity: item.quantityBought,
      calculatedPieces: quantityInPieces,
      itemTotal,
      itemTotalWithVat: itemTotal * (1 + vatRate),
      displayQuantity: item.quantityBought,
      displayUnit: item.unitMode
    };
  });

  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.itemTotal, 0);
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  return { itemsWithTotals, subtotal, vatAmount, total };
};

  const { itemsWithTotals, subtotal, vatAmount, total } = calculateTotals();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError(null);
  };

  const handleItemChange = (index, e) => {
  const { name, value } = e.target;
  const updatedItems = [...formData.items];
  
  if (name === 'product') {
    // Find the selected product
    const selectedProduct = products.find(p => p._id === value);
    updatedItems[index] = { 
      ...updatedItems[index],
      [name]: value,
      piecesPerPack: selectedProduct?.piecesPerPack || 1
    };
  } else {
    updatedItems[index] = { ...updatedItems[index], [name]: value };
  }
  
  setFormData(prev => ({ ...prev, items: updatedItems }));
};

  const addNewItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { product: '', buyPrice: '', quantityBought: 1 }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

// Update your handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();

      console.log("Submitting invoice data:", {
    ...formData,
    items: formData.items.map(item => ({
      ...item,
      quantityBought: item.quantityBought,
      unitMode: item.unitMode,
      piecesPerPack: item.piecesPerPack
    }))
  });

  const validationError = validateForm();
  if (validationError) {
    setSubmitError(validationError);
    return;
  }

  setIsSubmitting(true);
  setSubmitError(null);
  
 try {
    const invoiceData = {
      supplier: formData.supplierName,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
      items: formData.items.map(item => ({
        product: item.product,
        buyPrice: parseFloat(item.buyPrice),
        // Store the quantity as entered (pack count or piece count)
        quantityBought: parseInt(item.quantityBought),
        unitMode: item.unitMode || 'piece',
        piecesPerPack: item.piecesPerPack || 1,
        // Add calculated total pieces for reference
        totalPieces: item.unitMode === 'pack' 
          ? parseInt(item.quantityBought) * (item.piecesPerPack || 1)
          : parseInt(item.quantityBought)
      }))
    };
    const apiUrl = isEditMode 
      ? `http://localhost:5000/api/invoices/${invoiceId}`
      : 'http://localhost:5000/api/invoices';

    const response = await axios({
      method: isEditMode ? 'put' : 'post',
      url: apiUrl,
      data: invoiceData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Operation failed');
    }

    setSubmitSuccess(true);
    setTimeout(() => {
      navigate(isEditMode ? `/invoices/edit/${invoiceId}` : '/invoices');
    }, 1500);
    
    } catch (error) {
      console.error('Error:', error);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        `Failed to ${isEditMode ? 'update' : 'save'} invoice. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

    const UnitToggle = ({ index, unitMode, onChange }) => (
    <div className="unit-toggle">
      <button
        type="button"
        className={`toggle-btn ${unitMode === 'pack' ? 'active' : ''}`}
        onClick={() => onChange(index, 'pack')}
      >
        Pack
      </button>
      <button
        type="button"
        className={`toggle-btn ${unitMode === 'piece' ? 'active' : ''}`}
        onClick={() => onChange(index, 'piece')}
      >
        Piece
      </button>
    </div>
  );

    const handleUnitToggle = (index, newMode) => {
      const updatedItems = [...formData.items];
      updatedItems[index].unitMode = newMode;
      setFormData(prev => ({ ...prev, items: updatedItems }));
    };

      return (
        <div className="dashboard-page">
          <h1 className="page-title">
            {isEditMode ? 'Edit Invoice' : 'New Invoice (Purchase) Entry'}
          </h1>
          
          {submitError && <div className="alert alert-error">{submitError}</div>}
          {submitSuccess && (
    <div className="alert alert-success">
              Invoice {isEditMode ? 'updated' : 'saved'} successfully!
            </div>      )}
          
          <form onSubmit={handleSubmit} className="entry-form">
            <div className="form-row">
              <div className="form-group">
                <label>Supplier</label>
                <select
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Invoice Date</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <h3>Invoice Items</h3>
            {formData.items.map((item, index) => (
              <div key={index} className="invoice-item">
                <div className="form-row">
                  <div className="form-group">
                    <label>Product</label>
                    <select
                      name="product"
                      value={item.product}
                      onChange={(e) => handleItemChange(index, e)}
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Unit</label>
                    <UnitToggle 
                      index={index}
                      unitMode={item.unitMode}
                      onChange={handleUnitToggle}
                    />
                  </div>

                  <div className="form-group">
                    <label>Buy Price</label>
                    <input
                      type="number"
                      name="buyPrice"
                      value={item.buyPrice}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        handleItemChange(index, {
                          target: {
                            name: 'buyPrice',
                            value: isNaN(value) ? '' : value.toFixed(2)
                          }
                        });
                      }}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Quantity</label>
                    <div className="quantity-control">
                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() => {
                          const updatedItems = [...formData.items];
                          updatedItems[index].quantityBought = Math.max(
                            1,
                            parseInt(updatedItems[index].quantityBought || 1) - 1
                          );
                          setFormData(prev => ({ ...prev, items: updatedItems }));
                        }}
                      >
                        <FaMinus />
                      </button>
                      <input
                        type="number"
                        name="quantityBought"
                        value={item.quantityBought}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          handleItemChange(index, {
                            target: {
                              name: 'quantityBought',
                              value: isNaN(value) ? '' : Math.max(1, value)
                            }
                          });
                        }}
                        min="1"
                        required
                      />
                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() => {
                          const updatedItems = [...formData.items];
                          updatedItems[index].quantityBought = 
                            parseInt(updatedItems[index].quantityBought || 1) + 1;
                          setFormData(prev => ({ ...prev, items: updatedItems }));
                        }}
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>

                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => removeItem(index)}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
                <div className="item-totals">
              {/* ... */}
              {/* --- MODIFIED: Display fetched currency --- */}
              <span>Item Total: {systemSettings.currency} {itemsWithTotals[index]?.itemTotal?.toFixed(2)}</span>
              <span>With VAT: {systemSettings.currency} {itemsWithTotals[index]?.itemTotalWithVat?.toFixed(2)}</span>
            </div>
          </div>
            ))}

            <button
              type="button"
              className="add-item-btn"
              onClick={addNewItem}
            >
              + Add Another Item
            </button>

            <div className="invoice-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{systemSettings.currency} {subtotal.toFixed(2)}</span>              </div>
              <div className="total-row">
                <span>VAT ({(systemSettings.vatRate * 100).toFixed(0)}%):</span>
                <span>{vatAmount.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>{systemSettings.currency} {total.toFixed(2)}</span>
              </div>
            </div>
            <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><FaSpinner className="spin" /> Saving Invoice...</>
              ) : (
                <><FaSave /> Save Invoice</>
              )}
            </button>
            </div>
          </form>
          <div className="invoice-actions">
            <button
              type="button"
              className="view-invoices-btn"
              onClick={() => navigate('/owner/dashboard/invoices')}
            >
              📄 View Invoices
            </button>
            
          </div>
          
        </div>
      );
    };

    export default NewBatchEntry;
