import { useState } from 'react';
import { FaCalendarAlt, FaChartBar, FaFileExcel, FaFilePdf, FaSpinner } from 'react-icons/fa';
import './ReportsPage.css';

// Make sure you have this api service
import api from '../../../api';

const ReportsPage = () => {
  const reportTypes = [
    { 
      id: 1, 
      name: 'Inventory Report', 
      description: 'Current stock levels across all locations',
      endpoint: '/reports/inventory'
    },
    { 
      id: 2, 
      name: 'Sales Report', 
      description: 'Daily, weekly or monthly sales figures',
      endpoint: '/reports/sales'
    },
    { 
      id: 3, 
      name: 'Transfer Report', 
      description: 'All stock transfers between locations',
      endpoint: '/reports/transfers'
    },
    { 
      id: 4, 
      name: 'Product Movement', 
      description: 'Product in/out movement analysis',
      endpoint: '/reports/product-movement'
    }
  ];

  // STATE VARIABLES - ADD THESE
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // FIXED GENERATE REPORT FUNCTION
  const generateReport = async (reportId, format = 'pdf') => {
    const report = reportTypes.find(r => r.id === reportId);
    if (!report) return;

    console.log('Frontend: Starting report generation', { reportId, format, dateRange });

    // SET LOADING STATE
    setLoading(true);
    setSelectedReport(reportId);
    setError(null);
    setSuccess(null);

    try {
      // Validate dates
      if (!dateRange.start || !dateRange.end) {
        throw new Error('Please select both start and end dates');
      }

      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        format: format
      });

      console.log('Frontend: Making API call to', `${report.endpoint}?${params}`);

      const response = await api.get(`${report.endpoint}?${params}`, {
        responseType: format === 'pdf' || format === 'excel' ? 'blob' : 'json',
        timeout: 30000
      });

      console.log('Frontend: API response received', response.status);

      if (format === 'pdf' || format === 'excel') {
        // Handle file download
        const blob = new Blob([response.data], {
          type: format === 'pdf' 
            ? 'application/pdf' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `${report.name.replace(/\s+/g, '_')}_${timestamp}.${format}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setSuccess(`${report.name} downloaded successfully!`);
        
      } else {
        // Handle JSON response
        console.log('JSON data:', response.data);
        setSuccess(`${report.name} data loaded successfully!`);
      }

    } catch (error) {
      console.error('Frontend: Report generation failed', error);
      
      // Enhanced error handling
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout - please try again');
      } else if (error.response?.status === 413) {
        setError('Report too large - try a smaller date range');
      } else if (error.response?.status === 500) {
        setError('Server error - please contact administrator');
      } else if (error.response?.data) {
        // Try to read error message from blob if it's a file response
        if (error.response.data instanceof Blob) {
          try {
            const errorText = await error.response.data.text();
            const errorData = JSON.parse(errorText);
            setError(errorData.error || 'Failed to generate report');
          } catch {
            setError('Failed to generate report file');
          }
        } else {
          setError(error.response.data.error || 'Failed to generate report');
        }
      } else if (error.request) {
        setError('Network error - please check your connection');
      } else {
        setError(error.message || 'Failed to generate report');
      }
    } finally {
      setLoading(false);
      setSelectedReport(null);
      console.log('Frontend: Report generation process completed');
    }
  };

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Reports</h1>
      
      {/* ERROR AND SUCCESS MESSAGES */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)} className="alert-close">×</button>
        </div>
      )}

      {/* LOADING INDICATOR */}
      {loading && (
        <div className="loading-overlay">
          <FaSpinner className="spinner" />
          <span>Generating {reportTypes.find(r => r.id === selectedReport)?.name}...</span>
        </div>
      )}
      
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
                onClick={() => generateReport(report.id, 'pdf')}
                className="report-button pdf"
                disabled={loading}
              >
                <FaFilePdf /> PDF
              </button>
              <button 
                onClick={() => generateReport(report.id, 'excel')}
                className="report-button excel"
                disabled={loading}
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