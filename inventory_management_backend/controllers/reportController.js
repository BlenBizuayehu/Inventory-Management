// controllers/reportController.js
const ReportService = require('../services/reportService');
const PDFGenerator = require('../services/pdfGenerator');
const ExcelGenerator = require('../services/excelGenerator');
const asyncHandler = require('../middleware/async');

// @desc    Generate inventory report
// @route   GET /api/reports/inventory
// @access  Private
exports.generateInventoryReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;

  console.log('=== REPORT GENERATION STARTED ===');
  console.log('Parameters:', { startDate, endDate, format });
  console.log('User:', { id: req.user.id, role: req.user.role });

  // Validate date parameters
  if (!startDate || !endDate) {
    console.log('ERROR: Missing date parameters');
    return res.status(400).json({
      success: false,
      error: 'Start date and end date are required'
    });
  }

  try {
    console.log('Fetching report data...');
    const data = await ReportService.getInventoryReportData(startDate, endDate, req.user);
    console.log('Data fetched successfully, records:', {
      shopInventory: data.shopInventory?.length,
      storeInventory: data.storeInventory?.length,
      lowStockAlerts: data.lowStockAlerts?.length
    });

    if (format === 'pdf') {
      console.log('Generating PDF...');
      const pdfBuffer = await PDFGenerator.generateInventoryReport(data);
      console.log('PDF generated, size:', pdfBuffer.length);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=inventory_report_${Date.now()}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      console.log('Headers set, sending PDF...');
      res.send(pdfBuffer);

    } else if (format === 'excel') {
      console.log('Generating Excel...');
      const workbook = ExcelGenerator.generateInventoryReport(data);
      console.log('Excel workbook created');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=inventory_report_${Date.now()}.xlsx`);
      console.log('Headers set, writing Excel...');
      workbook.write(res);
      console.log('Excel sent successfully');

    } else {
      // Return JSON data
      console.log('Returning JSON data');
      res.status(200).json({
        success: true,
        data: data
      });
    }

    console.log('=== REPORT GENERATION COMPLETED ===');

  } catch (error) {
    console.error('!!! REPORT GENERATION ERROR:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Generate sales report
// @route   GET /api/reports/sales
// @access  Private
exports.generateSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Start date and end date are required'
    });
  }

  try {
    const data = await ReportService.getSalesReportData(startDate, endDate, req.user);

    if (format === 'pdf') {
      const pdfBuffer = await PDFGenerator.generateSalesReport(data);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=sales_report_${Date.now()}.pdf`);
      res.send(pdfBuffer);

    } else if (format === 'excel') {
      const workbook = ExcelGenerator.generateSalesReport(data);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=sales_report_${Date.now()}.xlsx`);
      workbook.write(res);

    } else {
      res.status(200).json({
        success: true,
        data: data
      });
    }

  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Generate transfer report
// @route   GET /api/reports/transfers
// @access  Private
exports.generateTransferReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Start date and end date are required'
    });
  }

  try {
    const data = await ReportService.getTransferReportData(startDate, endDate, req.user);

    if (format === 'pdf') {
      const pdfBuffer = await PDFGenerator.generateTransferReport(data);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=transfer_report_${Date.now()}.pdf`);
      res.send(pdfBuffer);

    } else if (format === 'excel') {
      const workbook = ExcelGenerator.generateTransferReport(data);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=transfer_report_${Date.now()}.xlsx`);
      workbook.write(res);

    } else {
      res.status(200).json({
        success: true,
        data: data
      });
    }

  } catch (error) {
    console.error('Transfer report error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Generate product movement report
// @route   GET /api/reports/product-movement
// @access  Private
exports.generateProductMovementReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Start date and end date are required'
    });
  }

  try {
    const data = await ReportService.getProductMovementData(startDate, endDate, req.user);

    if (format === 'pdf') {
      const pdfBuffer = await PDFGenerator.generateProductMovementReport(data);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=product_movement_report_${Date.now()}.pdf`);
      res.send(pdfBuffer);

    } else if (format === 'excel') {
      const workbook = ExcelGenerator.generateProductMovementReport(data);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=product_movement_report_${Date.now()}.xlsx`);
      workbook.write(res);

    } else {
      res.status(200).json({
        success: true,
        data: data
      });
    }

  } catch (error) {
    console.error('Product movement report error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get available report types
// @route   GET /api/reports/types
// @access  Private
exports.getReportTypes = asyncHandler(async (req, res) => {
  const reportTypes = [
    {
      id: 'inventory',
      name: 'Inventory Report',
      description: 'Current stock levels across all locations',
      requiredParams: ['startDate', 'endDate']
    },
    {
      id: 'sales',
      name: 'Sales Report',
      description: 'Daily, weekly or monthly sales figures',
      requiredParams: ['startDate', 'endDate']
    },
    {
      id: 'transfers',
      name: 'Transfer Report',
      description: 'All stock transfers between locations',
      requiredParams: ['startDate', 'endDate']
    },
    {
      id: 'product-movement',
      name: 'Product Movement Report',
      description: 'Product in/out movement analysis',
      requiredParams: ['startDate', 'endDate']
    }
  ];

  res.status(200).json({
    success: true,
    data: reportTypes
  });
});