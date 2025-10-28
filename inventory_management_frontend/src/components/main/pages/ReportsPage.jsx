import { useState } from 'react';
import { FaCalendarAlt, FaChartBar, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import './ReportsPage.css';
const ReportsPage = () => {
  const reportTypes = [
    { id: 1, name: 'Inventory Report', description: 'Current stock levels across all locations' },
    { id: 2, name: 'Sales Report', description: 'Daily, weekly or monthly sales figures' },
    { id: 3, name: 'Transfer Report', description: 'All stock transfers between locations' },
    { id: 4, name: 'Product Movement', description: 'Product in/out movement analysis' }
  ];

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const generateReport = (reportId) => {
    console.log(`Generating ${reportTypes.find(r => r.id === reportId).name} for ${dateRange.start} to ${dateRange.end}`);
    // Add report generation logic here
  };

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Reports</h1>
      
      <div className="date-range-selector">
        <div className="form-group">
          <label>From Date</label>
          <div className="date-input">
            <FaCalendarAlt className="calendar-icon" />
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>To Date</label>
          <div className="date-input">
            <FaCalendarAlt className="calendar-icon" />
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
            />
          </div>
        </div>
      </div>

      <div className="reports-grid">
        {reportTypes.map(report => (
          <div key={report.id} className="report-card">
            <div className="report-icon">
              <FaChartBar />
            </div>
            <h3>{report.name}</h3>
            <p>{report.description}</p>
            <div className="report-actions">
              <button 
                onClick={() => generateReport(report.id)}
                className="report-button pdf"
              >
                <FaFilePdf /> PDF
              </button>
              <button 
                onClick={() => generateReport(report.id)}
                className="report-button excel"
              >
                <FaFileExcel /> Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;