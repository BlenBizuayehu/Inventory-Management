// services/excelGenerator.js
const excel = require('excel4node');
const moment = require('moment');

class ExcelGenerator {
  static generateInventoryReport(data) {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Report');

    // Styles
    const headerStyle = workbook.createStyle({
      font: { bold: true, color: '#FFFFFF' },
      fill: { type: 'pattern', patternType: 'solid', fgColor: '#3498DB' }
    });

    const summaryStyle = workbook.createStyle({
      font: { bold: true },
      fill: { type: 'pattern', patternType: 'solid', fgColor: '#F8F9FA' }
    });

    // Title
    worksheet.cell(1, 1, 1, 6, true).string('Inventory Report').style(headerStyle);
    
    // Summary Section
    worksheet.cell(3, 1).string('Summary').style(summaryStyle);
    worksheet.cell(4, 1).string('Total Products:').style({ font: { bold: true } });
    worksheet.cell(4, 2).number(data.summary.totalProducts);
    
    worksheet.cell(5, 1).string('Low Stock Items:').style({ font: { bold: true } });
    worksheet.cell(5, 2).number(data.summary.lowStockItems);
    
    worksheet.cell(6, 1).string('Out of Stock:').style({ font: { bold: true } });
    worksheet.cell(6, 2).number(data.summary.outOfStockItems);
    
    worksheet.cell(7, 1).string('Inventory Value:').style({ font: { bold: true } });
    worksheet.cell(7, 2).number(data.summary.inventoryValue || 0);

    // Shop Inventory Table
    let row = 10;
    if (data.shopInventory.length > 0) {
      worksheet.cell(row, 1).string('Shop Inventory').style(summaryStyle);
      row++;
      
      // Headers
      const shopHeaders = ['Product', 'Shop', 'Quantity', 'Last Updated'];
      shopHeaders.forEach((header, col) => {
        worksheet.cell(row, col + 1).string(header).style(headerStyle);
      });
      row++;

      // Data
      data.shopInventory.forEach(item => {
        worksheet.cell(row, 1).string(item.product);
        worksheet.cell(row, 2).string(item.shop);
        worksheet.cell(row, 3).number(item.quantity);
        worksheet.cell(row, 4).string(moment(item.lastUpdated).format('YYYY-MM-DD'));
        row++;
      });
    }

    // Low Stock Alerts
    if (data.lowStockAlerts.length > 0) {
      row += 2;
      worksheet.cell(row, 1).string('Low Stock Alerts').style(summaryStyle);
      row++;
      
      const alertHeaders = ['Product', 'Location', 'Current Stock', 'Status'];
      alertHeaders.forEach((header, col) => {
        worksheet.cell(row, col + 1).string(header).style(headerStyle);
      });
      row++;

      data.lowStockAlerts.forEach(alert => {
        worksheet.cell(row, 1).string(alert.product);
        worksheet.cell(row, 2).string(alert.location);
        worksheet.cell(row, 3).number(alert.currentStock);
        worksheet.cell(row, 4).string(alert.status);
        row++;
      });
    }

    // Store Inventory (if available and user has access)
    if (data.storeInventory && data.storeInventory.length > 0) {
      row += 2;
      worksheet.cell(row, 1).string('Store Inventory').style(summaryStyle);
      row++;
      
      const storeHeaders = ['Product', 'Store', 'Quantity', 'Batch Count'];
      storeHeaders.forEach((header, col) => {
        worksheet.cell(row, col + 1).string(header).style(headerStyle);
      });
      row++;

      data.storeInventory.forEach(item => {
        worksheet.cell(row, 1).string(item.product);
        worksheet.cell(row, 2).string(item.store);
        worksheet.cell(row, 3).number(item.quantity);
        worksheet.cell(row, 4).number(item.batchCount);
        row++;
      });
    }

    // Auto-adjust column widths
    worksheet.column(1).setWidth(25);
    worksheet.column(2).setWidth(20);
    worksheet.column(3).setWidth(15);
    worksheet.column(4).setWidth(15);

    return workbook;
  }

  static generateSalesReport(data) {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    const headerStyle = workbook.createStyle({
      font: { bold: true, color: '#FFFFFF' },
      fill: { type: 'pattern', patternType: 'solid', fgColor: '#27AE60' }
    });

    const currencyStyle = workbook.createStyle({
      numberFormat: '$#,##0.00'
    });

    // Title and Summary
    worksheet.cell(1, 1, 1, 4, true).string('Sales Report').style(headerStyle);
    
    worksheet.cell(3, 1).string('Report Summary').style({ font: { bold: true, size: 12 } });
    worksheet.cell(4, 1).string('Total Sales:').style({ font: { bold: true } });
    worksheet.cell(4, 2).number(data.summary.totalSales).style(currencyStyle);
    
    worksheet.cell(5, 1).string('Total Transactions:').style({ font: { bold: true } });
    worksheet.cell(5, 2).number(data.summary.totalTransactions);
    
    worksheet.cell(6, 1).string('Average Sale:').style({ font: { bold: true } });
    worksheet.cell(6, 2).number(data.summary.averageSale).style(currencyStyle);
    
    worksheet.cell(7, 1).string('Date Range:').style({ font: { bold: true } });
    worksheet.cell(7, 2).string(`${data.summary.dateRange.startDate} to ${data.summary.dateRange.endDate}`);

    // Daily Sales Breakdown
    let row = 10;
    worksheet.cell(row, 1).string('Daily Sales Breakdown').style({ font: { bold: true, size: 12 } });
    row++;
    
    const dailyHeaders = ['Date', 'Total Sales', 'Transactions', 'Average Sale'];
    dailyHeaders.forEach((header, col) => {
      worksheet.cell(row, col + 1).string(header).style(headerStyle);
    });
    row++;

    if (data.dailySales) {
      Object.entries(data.dailySales).forEach(([date, dailyData]) => {
        worksheet.cell(row, 1).string(date);
        worksheet.cell(row, 2).number(dailyData.total).style(currencyStyle);
        worksheet.cell(row, 3).number(dailyData.transactions);
        worksheet.cell(row, 4).number(dailyData.total / dailyData.transactions).style(currencyStyle);
        row++;
      });
    }

    // Top Products by Revenue
    row += 2;
    worksheet.cell(row, 1).string('Top Products by Revenue').style({ font: { bold: true, size: 12 } });
    row++;
    
    const productHeaders = ['Rank', 'Product', 'Revenue', 'Quantity Sold', 'Average Price'];
    productHeaders.forEach((header, col) => {
      worksheet.cell(row, col + 1).string(header).style(headerStyle);
    });
    row++;

    data.topProducts.forEach((product, index) => {
      worksheet.cell(row, 1).number(index + 1);
      worksheet.cell(row, 2).string(product.product);
      worksheet.cell(row, 3).number(product.revenue).style(currencyStyle);
      worksheet.cell(row, 4).number(product.quantity);
      worksheet.cell(row, 5).number(product.revenue / product.quantity).style(currencyStyle);
      row++;
    });

    // Sales by Shop
    if (data.salesByShop) {
      row += 2;
      worksheet.cell(row, 1).string('Sales by Shop').style({ font: { bold: true, size: 12 } });
      row++;
      
      const shopHeaders = ['Shop', 'Total Sales', 'Transactions', 'Average Sale'];
      shopHeaders.forEach((header, col) => {
        worksheet.cell(row, col + 1).string(header).style(headerStyle);
      });
      row++;

      Object.entries(data.salesByShop).forEach(([shop, shopData]) => {
        worksheet.cell(row, 1).string(shop);
        worksheet.cell(row, 2).number(shopData.total).style(currencyStyle);
        worksheet.cell(row, 3).number(shopData.transactions);
        worksheet.cell(row, 4).number(shopData.total / shopData.transactions).style(currencyStyle);
        row++;
      });
    }

    // Auto-adjust column widths
    worksheet.column(1).setWidth(20);
    worksheet.column(2).setWidth(15);
    worksheet.column(3).setWidth(15);
    worksheet.column(4).setWidth(15);
    worksheet.column(5).setWidth(15);

    return workbook;
  }

  static generateTransferReport(data) {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Transfer Report');

    const headerStyle = workbook.createStyle({
      font: { bold: true, color: '#FFFFFF' },
      fill: { type: 'pattern', patternType: 'solid', fgColor: '#E74C3C' }
    });

    const statusStyle = workbook.createStyle({
      font: { color: '#FFFFFF' },
      fill: { type: 'pattern', patternType: 'solid', fgColor: '#27AE60' }
    });

    // Title and Summary
    worksheet.cell(1, 1, 1, 6, true).string('Transfer Report').style(headerStyle);
    
    worksheet.cell(3, 1).string('Transfer Summary').style({ font: { bold: true, size: 12 } });
    worksheet.cell(4, 1).string('Total Transfers:').style({ font: { bold: true } });
    worksheet.cell(4, 2).number(data.summary.totalTransfers);
    
    worksheet.cell(5, 1).string('Completed:').style({ font: { bold: true } });
    worksheet.cell(5, 2).number(data.summary.completed);
    
    worksheet.cell(6, 1).string('Pending:').style({ font: { bold: true } });
    worksheet.cell(6, 2).number(data.summary.pending);
    
    worksheet.cell(7, 1).string('Rejected:').style({ font: { bold: true } });
    worksheet.cell(7, 2).number(data.summary.rejected);
    
    worksheet.cell(8, 1).string('Total Items Transferred:').style({ font: { bold: true } });
    worksheet.cell(8, 2).number(data.summary.totalItemsTransferred);

    // Transfers Table
    let row = 11;
    worksheet.cell(row, 1).string('Transfer Details').style({ font: { bold: true, size: 12 } });
    row++;
    
    const headers = ['Date', 'From', 'To', 'Status', 'Items', 'Quantity', 'Approved By'];
    headers.forEach((header, col) => {
      worksheet.cell(row, col + 1).string(header).style(headerStyle);
    });
    row++;

    data.transfers.forEach(transfer => {
      // Status color coding
      let statusStyle = workbook.createStyle({});
      if (transfer.status === 'completed') {
        statusStyle = workbook.createStyle({
          font: { color: '#FFFFFF' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: '#27AE60' }
        });
      } else if (transfer.status === 'pending') {
        statusStyle = workbook.createStyle({
          font: { color: '#000000' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: '#F39C12' }
        });
      } else if (transfer.status === 'rejected') {
        statusStyle = workbook.createStyle({
          font: { color: '#FFFFFF' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: '#E74C3C' }
        });
      }

      worksheet.cell(row, 1).string(moment(transfer.date).format('YYYY-MM-DD'));
      worksheet.cell(row, 2).string(transfer.from);
      worksheet.cell(row, 3).string(transfer.to);
      worksheet.cell(row, 4).string(transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)).style(statusStyle);
      worksheet.cell(row, 5).number(transfer.items);
      worksheet.cell(row, 6).number(transfer.totalQuantity);
      worksheet.cell(row, 7).string(transfer.approvedBy);
      row++;
    });

    // Frequent Transfers
    if (data.frequentTransfers && data.frequentTransfers.length > 0) {
      row += 2;
      worksheet.cell(row, 1).string('Most Frequently Transferred Products').style({ font: { bold: true, size: 12 } });
      row++;
      
      const freqHeaders = ['Product', 'Transfer Count'];
      freqHeaders.forEach((header, col) => {
        worksheet.cell(row, col + 1).string(header).style(headerStyle);
      });
      row++;

      data.frequentTransfers.forEach(item => {
        worksheet.cell(row, 1).string(item.product);
        worksheet.cell(row, 2).number(item.count);
        row++;
      });
    }

    // Auto-adjust column widths
    worksheet.column(1).setWidth(12);
    worksheet.column(2).setWidth(20);
    worksheet.column(3).setWidth(20);
    worksheet.column(4).setWidth(12);
    worksheet.column(5).setWidth(10);
    worksheet.column(6).setWidth(12);
    worksheet.column(7).setWidth(15);

    return workbook;
  }

  static generateProductMovementReport(data) {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Product Movement');

    const headerStyle = workbook.createStyle({
      font: { bold: true, color: '#FFFFFF' },
      fill: { type: 'pattern', patternType: 'solid', fgColor: '#9B59B6' }
    });

    // Title and Summary
    worksheet.cell(1, 1, 1, 5, true).string('Product Movement Report').style(headerStyle);
    
    worksheet.cell(3, 1).string('Movement Summary').style({ font: { bold: true, size: 12 } });
    worksheet.cell(4, 1).string('Total Movements:').style({ font: { bold: true } });
    worksheet.cell(4, 2).number(data.summary.totalMovements);
    
    worksheet.cell(5, 1).string('Receipts:').style({ font: { bold: true } });
    worksheet.cell(5, 2).number(data.summary.receipts);
    
    worksheet.cell(6, 1).string('Issues:').style({ font: { bold: true } });
    worksheet.cell(6, 2).number(data.summary.issues);
    
    worksheet.cell(7, 1).string('Adjustments:').style({ font: { bold: true } });
    worksheet.cell(7, 2).number(data.summary.adjustments);
    
    worksheet.cell(8, 1).string('Transfers:').style({ font: { bold: true } });
    worksheet.cell(8, 2).number(data.summary.transfers);

    // Recent Activities
    let row = 11;
    worksheet.cell(row, 1).string('Recent Activities').style({ font: { bold: true, size: 12 } });
    row++;
    
    const headers = ['Date', 'Product', 'Type', 'Quantity', 'Location', 'User', 'Reference'];
    headers.forEach((header, col) => {
      worksheet.cell(row, col + 1).string(header).style(headerStyle);
    });
    row++;

    data.recentActivities.forEach(activity => {
      worksheet.cell(row, 1).string(moment(activity.date).format('YYYY-MM-DD HH:mm'));
      worksheet.cell(row, 2).string(activity.product);
      worksheet.cell(row, 3).string(activity.type.charAt(0).toUpperCase() + activity.type.slice(1));
      worksheet.cell(row, 4).number(activity.quantity);
      worksheet.cell(row, 5).string(activity.location);
      worksheet.cell(row, 6).string(activity.user);
      worksheet.cell(row, 7).string(activity.reference);
      row++;
    });

    // Product Movement Summary
    if (data.productMovement) {
      row += 2;
      worksheet.cell(row, 1).string('Product Movement Summary').style({ font: { bold: true, size: 12 } });
      row++;
      
      const summaryHeaders = ['Product', 'Incoming', 'Outgoing', 'Net Movement', 'Adjustments'];
      summaryHeaders.forEach((header, col) => {
        worksheet.cell(row, col + 1).string(header).style(headerStyle);
      });
      row++;

      Object.entries(data.productMovement).forEach(([product, movement]) => {
        const netMovement = movement.incoming - movement.outgoing;
        worksheet.cell(row, 1).string(product);
        worksheet.cell(row, 2).number(movement.incoming);
        worksheet.cell(row, 3).number(movement.outgoing);
        worksheet.cell(row, 4).number(netMovement);
        worksheet.cell(row, 5).number(movement.adjustments);
        row++;
      });
    }

    // Auto-adjust column widths
    worksheet.column(1).setWidth(18);
    worksheet.column(2).setWidth(25);
    worksheet.column(3).setWidth(12);
    worksheet.column(4).setWidth(10);
    worksheet.column(5).setWidth(15);
    worksheet.column(6).setWidth(15);
    worksheet.column(7).setWidth(15);

    return workbook;
  }
}

module.exports = ExcelGenerator;