import { useEffect, useState } from 'react';
import { FaArrowLeft, FaBoxes, FaCalendarAlt, FaChevronDown, FaChevronUp, FaEdit, FaExclamationTriangle, FaHistory, FaSearch, FaStore, FaTrash, FaUser, FaWarehouse } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import './TransferRecords.css';

const TransferRecords = () => {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTransfer, setExpandedTransfer] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    transferId: null,
    transferDetails: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const res = await api.get('/transfers?populate=deep');
        setTransfers(res.data.data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.error || 'Failed to fetch transfers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  const handleEditTransfer = (transfer) => {
    const editData = {
      id: transfer._id,
      fromLocation: transfer.fromLocation,
      toLocation: transfer.toLocation,
      transferDate: transfer.transferDate,
      transferredBy: transfer.transferredBy?._id,
      products: transfer.products.map(product => ({
        product: product.product?._id || null,
        productName: product.productName || product.product?.name || '',
        packs: product.packs,
        pieces: product.pieces,
        batchNumber: product.batchNumber || ''
      }))
    };
    
    navigate('/owner/dashboard/transfer', { state: { editData } });
  };

  const handleDeleteClick = (transfer) => {
    setDeleteModal({
      isOpen: true,
      transferId: transfer._id,
      transferDetails: `Transfer #${transfer._id.slice(-6)} (${transfer.products?.length || 0} items)`
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsLoading(true);
      await api.delete(`/transfers/${deleteModal.transferId}`);
      
      setTransfers(prev => prev.filter(t => t._id !== deleteModal.transferId));
      setSuccess(`Transfer ${deleteModal.transferId.slice(-6)} deleted successfully`);
      setDeleteModal({ isOpen: false, transferId: null, transferDetails: null });
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const DeleteConfirmationModal = () => (
    <div className={`modal ${deleteModal.isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <FaExclamationTriangle className="warning-icon" />
          <h3>Confirm Deletion</h3>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete this transfer?</p>
          <p><strong>{deleteModal.transferDetails}</strong></p>
          <p className="warning-text">This action cannot be undone!</p>
        </div>
        <div className="modal-actions">
          <button 
            className="cancel-button"
            onClick={() => setDeleteModal({ isOpen: false, transferId: null, transferDetails: null })}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="delete-button"
            onClick={handleDeleteConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );

  const filteredTransfers = transfers.filter(transfer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      transfer.fromLocation?.toLowerCase().includes(searchLower) ||
      transfer.toLocation?.toLowerCase().includes(searchLower) ||
      transfer.transferredBy?.name?.toLowerCase().includes(searchLower) ||
      transfer.products?.some(p => 
        p.productName?.toLowerCase().includes(searchLower) ||
        p.product?.name?.toLowerCase().includes(searchLower)
    ));
  });

  const toggleExpand = (transferId) => {
    setExpandedTransfer(expandedTransfer === transferId ? null : transferId);
  };

  const calculateTotalPieces = (product) => {
    const packSize = product.product?.packSize || 1;
    return (product.packs * packSize) + product.pieces;
  };

  if (isLoading) return <div className="loading">Loading transfers...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="dashboard-page">
      <DeleteConfirmationModal />
      <div className="page-header">
        <h1 className="page-title">Transfer Records</h1>
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search transfers by location, product or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredTransfers.length === 0 ? (
        <div className="no-records">No transfer records found</div>
      ) : (
        <div className="transfers-list">
          {filteredTransfers.map((transfer) => (
            <div key={transfer._id} className="transfer-item">
              <div 
                className="transfer-summary" 
                onClick={() => toggleExpand(transfer._id)}
              >
                <div className="summary-col date-col">
                  <FaCalendarAlt className="icon" />
                  {new Date(transfer.transferDate).toLocaleDateString()}
                </div>
                <div className="summary-col from-col">
                  <FaWarehouse className="icon" />
                  {transfer.fromLocation}
                </div>
                <div className="summary-col to-col">
                  <FaStore className="icon" />
                  {transfer.toLocation}
                </div>
                <div className="summary-col user-col">
                  <FaUser className="icon" />
                  {transfer.transferredBy?.name || 'System'}
                </div>
                <div className="summary-col toggle-col">
                  {expandedTransfer === transfer._id ? (
                    <FaChevronUp className="toggle-icon" />
                  ) : (
                    <FaChevronDown className="toggle-icon" />
                  )}
                </div>
              </div>

              {expandedTransfer === transfer._id && (
                <div className="transfer-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Transfer ID:</span>
                      <span>{transfer._id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span>{new Date(transfer.transferDate).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">From:</span>
                      <span>{transfer.fromLocation}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">To:</span>
                      <span>{transfer.toLocation}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">User:</span>
                      <span>
                        {transfer.transferredBy?.name || 'System'}
                        {transfer.transferredBy?.email && ` (${transfer.transferredBy.email})`}
                      </span>
                    </div>
                  </div>

                  <div className="products-section">
                    <h3>
                      <FaBoxes /> Products Transferred ({transfer.products?.length || 0})
                    </h3>
                    {transfer.products?.length > 0 ? (
                      <div className="products-grid">
                        {transfer.products.map((product, index) => (
                          <div key={index} className="product-item">
                            <div className="product-name">
                              {product.productName || product.product?.name || 'Unknown Product'}
                            </div>
                            <div className="product-info">
                              <span>Packs: {product.packs}</span>
                              <span>Pieces: {product.pieces}</span>
                              <span>Total: {calculateTotalPieces(product)} pieces</span>
                              {product.batchNumber && <span>Batch: {product.batchNumber}</span>}
                              {product.product?.sku && <span>SKU: {product.product.sku}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-products">No products in this transfer</div>
                    )}
                  </div>

                  <div className="transfer-actions">
                    <button 
                      className="edit-button" 
                      onClick={() => handleEditTransfer(transfer)}
                    >
                      <FaEdit/> Edit Transfer
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteClick(transfer)}
                      disabled={isLoading}
                    >
                      <FaTrash /> Delete
                    </button>
                    {transfer.editHistory?.length > 0 && (
                      <button 
                        className="history-button"  
                        onClick={() => navigate(`/owner/dashboard/transfers/history/${transfer._id}`)}
                      >
                        <FaHistory /> View Edit History
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransferRecords;