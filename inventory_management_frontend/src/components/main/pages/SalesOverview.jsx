import { FaFileExport, FaFilter } from 'react-icons/fa';
import './DashboardPage.css';

const SalesOverview = () => {
  const salesData = [
    { date: '2023-05-01', product: 'Engine Oil 10W-40', quantity: 15, amount: 389.85 },
    { date: '2023-05-02', product: 'Gear Oil 75W-90', quantity: 8, amount: 260.00 },
    { date: '2023-05-03', product: 'Brake Fluid DOT4', quantity: 22, amount: 285.78 },
    { date: '2023-05-04', product: 'Engine Oil 10W-40', quantity: 10, amount: 259.90 },
    { date: '2023-05-05', product: 'Coolant Concentrate', quantity: 5, amount: 74.95 }
  ];

  const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
  const totalItems = salesData.reduce((sum, sale) => sum + sale.quantity, 0);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Sales Overview</h1>
        <div className="action-buttons">
          <button className="action-button">
            <FaFilter /> Filter
          </button>
          <button className="action-button">
            <FaFileExport /> Export
          </button>
        </div>
      </div>

      <div className="sales-stats">
        <div className="stat-card bg-blue-500">
          <h3>Total Sales</h3>
          <p>${totalSales.toFixed(2)}</p>
        </div>
        <div className="stat-card bg-green-500">
          <h3>Items Sold</h3>
          <p>{totalItems}</p>
        </div>
        <div className="stat-card bg-orange-500">
          <h3>Avg. Sale</h3>
          <p>${(totalSales / salesData.length).toFixed(2)}</p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((sale, index) => (
              <tr key={index}>
                <td>{sale.date}</td>
                <td>{sale.product}</td>
                <td>{sale.quantity}</td>
                <td>${sale.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesOverview;