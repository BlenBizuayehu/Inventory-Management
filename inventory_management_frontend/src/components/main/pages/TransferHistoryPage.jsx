import { useEffect, useState } from 'react';
import {
  FaArrowLeft,
  FaBoxes,
  FaCalendarAlt,
  FaStore,
  FaUser,
  FaWarehouse
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api';
import './TransferHistoryPage.css';

const TransferHistoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        // Get transfer with all details and edit history in one request
        const res = await api.get(`/transfers/${id}?populate=deep,5`);
        setTransfer(res.data.data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.error || 'Failed to fetch transfer history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfer();
  }, [id]);

  // Helper function to calculate total pieces
  const calculateTotalPieces = (product) => {
    const packSize = product.product?.packSize || 1;
    return (product.packs * packSize) + product.pieces;
  };

  if (isLoading) return <div className="loading">Loading transfer history...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!transfer) return <div className="no-records">Transfer not found</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Back to Transfers
        </button>
        <h1 className="page-title">
          Edit History for Transfer #{transfer._id.slice(-6)}
        </h1>
      </div>

      {/* Current Transfer Details */}
      <div className="current-transfer-details">
        <h3>Current Transfer Details</h3>
        
        <div className="detail-grid">
  <div className="detail-item">
    <span className="detail-label">Transfer ID:</span>
    <span>{transfer._id.slice(-6)}</span>
  </div>
  <div className="detail-item">
    <span className="detail-label">Date:</span>
    <span>{new Date(transfer.transferDate).toLocaleString()}</span>
  </div>
  <div className="detail-item">
    <span className="detail-label">
      <FaWarehouse className="icon" /> From:
    </span>
    <span>{transfer.fromLocation?.name || transfer.fromLocation}</span>
  </div>
  <div className="detail-item">
    <span className="detail-label">
      <FaStore className="icon" /> To:
    </span>
    <span>{transfer.toLocation?.name || transfer.toLocation}</span>
  </div>
  <div className="detail-item">
    <span className="detail-label">
      <FaUser className="icon" /> User:
    </span>
    <span>
      {transfer.transferredBy?.name || 'System'}
      {transfer.transferredBy?.email && ` (${transfer.transferredBy.email})`}
    </span>
  </div>
  {transfer.notes && (
    <div className="detail-item notes-item">
      <span className="detail-label">Notes:</span>
      <span>{transfer.notes}</span>
    </div>
  )}
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
                    <span>Packs: {product.packs || 0}</span>
                    <span>Pieces: {product.pieces || 0}</span>
                    <span>Total: {calculateTotalPieces(product)} pieces</span>
                    {product.product?.sku && <span>SKU: {product.product.sku}</span>}
                    {product.batchNumber && <span>Batch: {product.batchNumber}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products">No products in this transfer</div>
          )}
        </div>
      </div>

      {/* Edit History Section */}
      <div className="edit-history-list">
        <h3>Edit History ({transfer.editHistory?.length || 0})</h3>
        {transfer.editHistory?.length > 0 ? (
          transfer.editHistory.map((history, index) => (
            <div key={index} className="history-entry">
              <div className="history-header">
                <div className="history-meta">
                  <span className="history-user">
                    <FaUser /> {history.editedBy?.name || 'System'}
                  </span>
                  <span className="history-date">
                    <FaCalendarAlt /> {new Date(history.editedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="history-details">
                <h4>Before Edit:</h4>
                <div className="transfer-details">
                  <div className="detail-grid">
  <div className="detail-item">
    <span className="detail-label">From:</span>
    <span>{history.previousState?.fromLocation?.name || history.previousState?.fromLocation || 'N/A'}</span>
  </div>
  <div className="detail-item">
    <span className="detail-label">To:</span>
    <span>{history.previousState?.toLocation?.name || history.previousState?.toLocation || 'N/A'}</span>
  </div>
  <div className="detail-item">
    <span className="detail-label">Date:</span>
    <span>
      {history.previousState?.transferDate ? 
        new Date(history.previousState.transferDate).toLocaleString() : 'N/A'}
    </span>
  </div>
  <div className="detail-item">
    <span className="detail-label">By:</span>
    <span>{history.previousState?.transferredBy?.name || 'System'}</span>
  </div>
  {history.previousState?.notes && (
    <div className="detail-item notes-item">
      <span className="detail-label">Notes:</span>
      <span>{history.previousState.notes}</span>
    </div>
  )}
</div>
                  
                  <h5>Products:</h5>
                  <div className="products-grid">
                    {history.previousState?.products?.length > 0 ? (
                      history.previousState.products.map((product, idx) => {
                        const packSize = product.product?.packSize || 1;
                        const totalPieces = (product.packs * packSize) + product.pieces;
                        
                        return (
                          <div key={idx} className="product-item">
                            <div className="product-name">
                              {product.productName || product.product?.name || 'Unknown Product'}
                            </div>
                            <div className="product-info">
                              <span>Packs: {product.packs || 0}</span>
                              <span>Pieces: {product.pieces || 0}</span>
                              <span>Total: {totalPieces} pieces</span>
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.batchNumber && <span>Batch: {product.batchNumber}</span>}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-products">No products</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-history">No edit history available</div>
        )}
      </div>
    </div>
  );
};

export default TransferHistoryPage;