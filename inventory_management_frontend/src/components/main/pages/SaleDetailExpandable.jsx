import './SaleDetailExpandable.css'; // We will create this CSS file

function SaleDetailExpandable({ sale, settings }) {
    if (!sale) return null;

    const currency = sale.currency || settings.currency || '';

    return (
        <div className="sale-detail-expandable">
            <h4>Sale Details</h4>
            <div className="detail-grid">
                <div className="detail-section">
                    <strong>Payment Info:</strong>
                    <p>Method: {sale.paymentMethod}</p>
                    <p>Sold By: {sale.createdBy?.name || 'N/A'}</p>
                    <p>Shop: {sale.shop?.name || 'N/A'}</p>
                </div>
                <div className="detail-section">
                    <strong>Totals:</strong>
                    <p>Subtotal: {currency} {sale.subtotal.toFixed(2)}</p>
                    <p>VAT: {currency} {sale.totalVAT.toFixed(2)}</p>
                    <p>Discount: {currency} {sale.discount.toFixed(2)}</p>
                    <p><strong>Total: {currency} {sale.total.toFixed(2)}</strong></p>
                </div>
            </div>
            
            <h4>Items in this Sale ({sale.items.length})</h4>
            <table className="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price (VAT incl.)</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.productName || item.product?.name || 'N/A'}</td>
                            <td>
                                {item.packs > 0 ? `${item.packs} packs, ${item.pieces} pieces` : `${item.pieces} pieces`}
                            </td>
                            <td>{currency} {item.unitPrice.toFixed(2)}</td>
                            <td>{currency} {item.totalPrice.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SaleDetailExpandable;