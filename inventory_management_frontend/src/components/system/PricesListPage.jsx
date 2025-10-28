import { useEffect, useState } from 'react';
import { FaArrowRight, FaFileInvoice, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../api';
import './PricesListPage.css';

const PricesListPage = () => {
  const [groupedPrices, setGroupedPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await api.get('/prices/grouped-by-invoice');
        setGroupedPrices(response.data.data);
      } catch (err) {
        console.error('Failed to fetch prices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const filteredInvoices = Object.entries(groupedPrices).filter(([invoiceId, items]) => {
    const invoiceNumber = items[0]?.invoice?.invoiceNumber || '';
    const supplierName = items[0]?.invoice?.supplierName || '';
    const search = searchTerm.toLowerCase();
    return invoiceNumber.toLowerCase().includes(search) || 
           supplierName.toLowerCase().includes(search);
  });

  if (loading) return <div className="loading">Loading prices...</div>;

  return (
    <div className="prices-list-container">
      <div className="page-header">
        <h1><FaFileInvoice /> Product Prices by Batch</h1>
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="invoice-groups">
        {filteredInvoices.map(([invoiceId, items]) => (
          <div key={invoiceId} className="invoice-group">
            <div className="invoice-header">
              <h3>Invoice #{items[0].invoice.invoiceNumber}</h3>
              <span className="supplier">{items[0].invoice.supplierName}</span>
              <span className="date">
                {new Date(items[0].invoice.invoiceDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="batch-prices">
              {items.map(item => (
                <div key={item._id} className="price-item">
                  <div className="product-info">
                    <span className="product-name">{item.product?.name || 'Unknown Product'}</span>
                    <span className="batch-number">{item.batchNumber}</span>
                  </div>
                  <div className="price-info">
                    <span className="buy-price">Buy: ${item.buyPrice?.toFixed(2) || '0.00'}</span>
                    <span className="sell-price">Sell: ${item.sellPrice?.toFixed(2)}</span>
                    <span className="margin">
                      Margin: {((item.sellPrice - item.buyPrice) / item.buyPrice * 100).toFixed(2)}%
                    </span>
                  </div>
                  <Link 
                    to={`/batches/${item.batchId}`} 
                    className="details-link"
                  >
                    <FaArrowRight />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricesListPage;