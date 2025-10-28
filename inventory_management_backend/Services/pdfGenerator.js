// services/pdfGenerator.js
const PDFDocument = require('pdfkit');
const moment = require('moment');

class PDFGenerator {
  static generateInventoryReport(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this._addHeader(doc, 'Inventory Report', data.summary);

        // Summary Section
        this._addSummarySection(doc, data.summary);

        // Low Stock Alerts
        if (data.lowStockAlerts.length > 0) {
          this._addLowStockSection(doc, data.lowStockAlerts);
        }

        // Shop Inventory
        if (data.shopInventory.length > 0) {
          this._addInventoryTable(doc, data.shopInventory, 'Shop Inventory');
        }

        // Store Inventory (if available)
        if (data.storeInventory.length > 0) {
          this._addInventoryTable(doc, data.storeInventory, 'Store Inventory');
        }

        // Footer
        this._addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static generateSalesReport(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this._addHeader(doc, 'Sales Report', data.summary);
        this._addSalesSummary(doc, data.summary);
        this._addTopProducts(doc, data.topProducts);
        this._addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static generateTransferReport(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this._addHeader(doc, 'Transfer Report', data.summary);
        this._addTransferSummary(doc, data.summary);
        this._addTransfersTable(doc, data.transfers);
        this._addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static generateProductMovementReport(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this._addHeader(doc, 'Product Movement Report', data.summary);
        this._addMovementSummary(doc, data.summary);
        this._addRecentActivities(doc, data.recentActivities);
        this._addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Private helper methods
  static _addHeader(doc, title, summary) {
    // Company Logo/Title
    doc.fontSize(20).font('Helvetica-Bold')
       .text('Inventory Management System', 50, 50);
    
    doc.fontSize(16).font('Helvetica')
       .text(title, 50, 80);
    
    // Date Range
    doc.fontSize(10)
       .text(`Period: ${summary.dateRange.startDate} to ${summary.dateRange.endDate}`, 50, 110)
       .text(`Generated: ${moment().format('YYYY-MM-DD HH:mm')}`, 50, 125);
    
    doc.moveDown(2);
  }

  static _addSummarySection(doc, summary) {
    doc.fontSize(12).font('Helvetica-Bold').text('Summary', 50, doc.y);
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(10);
    doc.text(`Total Products: ${summary.totalProducts}`, 50, doc.y);
    doc.text(`Low Stock Items: ${summary.lowStockItems}`, 50, doc.y + 15);
    doc.text(`Out of Stock: ${summary.outOfStockItems}`, 50, doc.y + 30);
    doc.text(`Inventory Value: $${summary.inventoryValue?.toFixed(2) || '0.00'}`, 50, doc.y + 45);
    doc.text(`Total Locations: ${summary.totalLocations}`, 50, doc.y + 60);
    
    doc.moveDown(2);
  }

  static _addLowStockSection(doc, lowStockAlerts) {
    doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('Low Stock Alerts', 50, 50);
    doc.moveDown(0.5);
    
    lowStockAlerts.forEach((alert, index) => {
      const yPos = 80 + (index * 15);
      if (yPos > 700) {
        doc.addPage();
        doc.text('Low Stock Alerts (continued)', 50, 50);
      }
      
      doc.fontSize(8)
         .text(`${alert.product} - ${alert.location}: ${alert.currentStock} units (${alert.status})`, 50, doc.y);
    });
    
    doc.moveDown(2);
  }

  static _addInventoryTable(doc, inventory, title) {
  doc.addPage();
  doc.fontSize(12).font('Helvetica-Bold').text(title, 50, 50);
  
  // Table headers - adjust based on inventory type
  const isShopInventory = title === 'Shop Inventory';
  const locationHeader = isShopInventory ? 'Shop' : 'Store';
  const headers = ['Product', locationHeader, 'Quantity', 'Last Updated'];
  const columnWidths = [200, 150, 80, 120];
  let yPos = 80;
  
  doc.fontSize(9).font('Helvetica-Bold');
  headers.forEach((header, i) => {
    doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), yPos);
  });
  
  yPos += 20;
  doc.font('Helvetica');
  
  inventory.forEach((item, index) => {
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }
    
    // Safely handle potentially undefined values
    const product = item.product || 'Unknown';
    const location = isShopInventory ? (item.shop || 'Unknown') : (item.store || 'Unknown');
    const quantity = (item.quantity || 0).toString();
    const lastUpdated = item.lastUpdated ? 
      moment(item.lastUpdated).format('MMM DD, YYYY') : 'N/A';
    
    doc.text(product, 50, yPos, { width: columnWidths[0] });
    doc.text(location, 50 + columnWidths[0], yPos, { width: columnWidths[1] });
    doc.text(quantity, 50 + columnWidths[0] + columnWidths[1], yPos, { width: columnWidths[2] });
    doc.text(lastUpdated, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], yPos, { width: columnWidths[3] });
    
    yPos += 15;
  });
  
  doc.moveDown(2);
}
  static _addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .text(`Page ${i + 1} of ${pageCount}`, 50, 800, { align: 'center' });
    }
  }

  // Similar methods for sales, transfers, and movement reports...
  static _addSalesSummary(doc, summary) {
    doc.fontSize(12).font('Helvetica-Bold').text('Sales Summary', 50, doc.y);
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(10);
    doc.text(`Total Sales: $${summary.totalSales.toFixed(2)}`, 50, doc.y);
    doc.text(`Total Transactions: ${summary.totalTransactions}`, 50, doc.y + 15);
    doc.text(`Average Sale: $${summary.averageSale.toFixed(2)}`, 50, doc.y + 30);
    
    doc.moveDown(2);
  }

  static _addTopProducts(doc, topProducts) {
    doc.fontSize(12).font('Helvetica-Bold').text('Top Products by Revenue', 50, doc.y);
    doc.moveDown(0.5);
    
    topProducts.forEach((product, index) => {
      doc.fontSize(9)
         .text(`${index + 1}. ${product.product}: $${product.revenue.toFixed(2)} (${product.quantity} units)`, 50, doc.y);
      doc.moveDown(0.3);
    });
  }

  static _addTransferSummary(doc, summary) {
    doc.fontSize(12).font('Helvetica-Bold').text('Transfer Summary', 50, doc.y);
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(10);
    doc.text(`Total Transfers: ${summary.totalTransfers}`, 50, doc.y);
    doc.text(`Completed: ${summary.completed}`, 50, doc.y + 15);
    doc.text(`Pending: ${summary.pending}`, 50, doc.y + 30);
    doc.text(`Rejected: ${summary.rejected}`, 50, doc.y + 35);
    doc.text(`Total Items: ${summary.totalItemsTransferred}`, 50, doc.y + 50);
    
    doc.moveDown(2);
  }

  static _addTransfersTable(doc, transfers) {
    doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('Recent Transfers', 50, 50);
    
    const headers = ['Date', 'From', 'To', 'Status', 'Items', 'Approved By'];
    const columnWidths = [80, 100, 100, 60, 50, 100];
    let yPos = 80;
    
    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), yPos);
    });
    
    yPos += 20;
    doc.font('Helvetica');
    
    transfers.slice(0, 30).forEach((transfer) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
      
      doc.text(moment(transfer.date).format('MMM DD'), 50, yPos, { width: columnWidths[0] });
      doc.text(transfer.from, 50 + columnWidths[0], yPos, { width: columnWidths[1] });
      doc.text(transfer.to, 50 + columnWidths[0] + columnWidths[1], yPos, { width: columnWidths[2] });
      doc.text(transfer.status, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], yPos, { width: columnWidths[3] });
      doc.text(transfer.totalQuantity.toString(), 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], yPos, { width: columnWidths[4] });
      doc.text(transfer.approvedBy, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], yPos, { width: columnWidths[5] });
      
      yPos += 15;
    });
  }

  static _addMovementSummary(doc, summary) {
    doc.fontSize(12).font('Helvetica-Bold').text('Movement Summary', 50, doc.y);
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(10);
    doc.text(`Total Movements: ${summary.totalMovements}`, 50, doc.y);
    doc.text(`Receipts: ${summary.receipts}`, 50, doc.y + 15);
    doc.text(`Issues: ${summary.issues}`, 50, doc.y + 30);
    doc.text(`Adjustments: ${summary.adjustments}`, 50, doc.y + 45);
    doc.text(`Transfers: ${summary.transfers}`, 50, doc.y + 60);
    
    doc.moveDown(2);
  }

  static _addRecentActivities(doc, activities) {
    doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('Recent Activities', 50, 50);
    
    activities.slice(0, 40).forEach((activity, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }
      
      doc.fontSize(8)
         .text(`${moment(activity.date).format('MMM DD HH:mm')} - ${activity.product} - ${activity.type} - ${activity.quantity} units - ${activity.location}`, 50, doc.y);
      doc.moveDown(0.2);
    });
  }
}

module.exports = PDFGenerator;