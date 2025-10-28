// services/reportService.js
const InventoryStore = require('../models/InventoryStore');
const InventoryShop = require('../models/InventoryShop');
const Sale = require('../models/Sale');
const Transfer = require('../models/Transfer');
const InventoryActivity = require('../models/InventoryActivity');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Shop = require('../models/Shop');
const moment = require('moment');

class ReportService {
  // Inventory Report Data
  static async getInventoryReportData(startDate, endDate, user) {
    try {
      let storeFilter = {};
      let shopFilter = {};

      // Apply shop-based filtering for non-admin users
      if (user.accessibleShopIds && user.accessibleShopIds.length > 0) {
        shopFilter = { shop: { $in: user.accessibleShopIds } };
      }

      const [
        storeInventory,
        shopInventory,
        lowStockItems,
        outOfStockItems,
        totalProducts
      ] = await Promise.all([
        // Store Inventory (only for owners/admins)
        (user.role === 'owner' || user.role === 'admin') 
          ? InventoryStore.find().populate('product').populate('store')
          : [],
        
        // Shop Inventory (filtered by user access)
        InventoryShop.find(shopFilter).populate('product').populate('shop'),
        
        // Low stock items (< 10 pieces)
        InventoryShop.find({ 
          ...shopFilter, 
          totalQuantity: { $lt: 10, $gt: 0 } 
        }).countDocuments(),
        
        // Out of stock items
        InventoryShop.find({ 
          ...shopFilter, 
          totalQuantity: 0 
        }).countDocuments(),
        
        // Total products
        Product.countDocuments()
      ]);

      // Calculate inventory value and summary
      const inventoryValue = shopInventory.reduce((total, item) => {
        const productCost = item.product?.costPrice || 0;
        return total + (item.totalQuantity * productCost);
      }, 0);

      return {
        summary: {
          totalProducts,
          lowStockItems,
          outOfStockItems,
          inventoryValue,
          totalLocations: storeInventory.length + shopInventory.length,
          reportDate: new Date().toISOString(),
          dateRange: { startDate, endDate }
        },
        // In getInventoryReportData method, update the mapping:
storeInventory: storeInventory.map(item => ({
  product: item.product?.name || 'Unknown',
  location: item.store?.name || 'Unknown', // Changed from 'store' to 'location'
  quantity: item.totalQuantity,
  lastUpdated: item.updatedAt, // Add lastUpdated for consistency
  batchCount: item.batchBreakdown?.length || 0
})),
shopInventory: shopInventory.map(item => ({
  product: item.product?.name || 'Unknown',
  location: item.shop?.name || 'Unknown', // Changed from 'shop' to 'location'
  quantity: item.totalQuantity,
  lastUpdated: item.updatedAt
})),
        lowStockAlerts: shopInventory
          .filter(item => item.totalQuantity < 10)
          .map(item => ({
            product: item.product?.name || 'Unknown',
            location: item.shop?.name || 'Unknown',
            currentStock: item.totalQuantity,
            status: item.totalQuantity === 0 ? 'Out of Stock' : 'Low Stock'
          }))
      };
    } catch (error) {
      throw new Error(`Inventory report error: ${error.message}`);
    }
  }

  // Sales Report Data
  static async getSalesReportData(startDate, endDate, user) {
    try {
      let saleFilter = {
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };

      // Apply shop-based filtering for non-admin users
      if (user.accessibleShopIds && user.accessibleShopIds.length > 0) {
        saleFilter.shop = { $in: user.accessibleShopIds };
      }

      const sales = await Sale.find(saleFilter)
        .populate('shop', 'name location')
        .populate('items.product', 'name sku costPrice sellingPrice')
        .sort({ saleDate: -1 });

      // Calculate sales metrics
      const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalTransactions = sales.length;
      const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Top products by revenue
      const productSales = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const productName = item.product?.name || 'Unknown';
          const revenue = item.quantity * (item.unitPrice || 0);
          
          if (!productSales[productName]) {
            productSales[productName] = { revenue: 0, quantity: 0 };
          }
          productSales[productName].revenue += revenue;
          productSales[productName].quantity += item.quantity;
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([product, data]) => ({
          product,
          revenue: data.revenue,
          quantity: data.quantity
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        summary: {
          totalSales,
          totalTransactions,
          averageSale: Math.round(averageSale * 100) / 100,
          dateRange: { startDate, endDate },
          reportDate: new Date().toISOString()
        },
        dailySales: this._groupSalesByDay(sales),
        topProducts,
        salesByShop: this._groupSalesByShop(sales)
      };
    } catch (error) {
      throw new Error(`Sales report error: ${error.message}`);
    }
  }

  // Transfer Report Data
  static async getTransferReportData(startDate, endDate, user) {
    try {
      let transferFilter = {
        transferDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };

      const transfers = await Transfer.find(transferFilter)
        .populate('fromLocation', 'name type')
        .populate('toLocation', 'name type')
        .populate('items.product', 'name sku')
        .populate('approvedBy', 'name')
        .sort({ transferDate: -1 });

      const summary = {
        totalTransfers: transfers.length,
        completed: transfers.filter(t => t.status === 'completed').length,
        pending: transfers.filter(t => t.status === 'pending').length,
        rejected: transfers.filter(t => t.status === 'rejected').length,
        totalItemsTransferred: transfers.reduce((sum, t) => 
          sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        )
      };

      return {
        summary: {
          ...summary,
          dateRange: { startDate, endDate },
          reportDate: new Date().toISOString()
        },
        transfers: transfers.map(transfer => ({
          id: transfer._id,
          date: transfer.transferDate,
          from: transfer.fromLocation?.name || 'Unknown',
          to: transfer.toLocation?.name || 'Unknown',
          status: transfer.status,
          items: transfer.items.length,
          totalQuantity: transfer.items.reduce((sum, item) => sum + item.quantity, 0),
          approvedBy: transfer.approvedBy?.name || 'N/A'
        })),
        frequentTransfers: this._getFrequentTransfers(transfers)
      };
    } catch (error) {
      throw new Error(`Transfer report error: ${error.message}`);
    }
  }

  // Product Movement Report Data
  static async getProductMovementData(startDate, endDate, user) {
    try {
      let activityFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };

      // Apply shop-based filtering for non-admin users
      if (user.accessibleShopIds && user.accessibleShopIds.length > 0) {
        activityFilter.$or = [
          { shop: { $in: user.accessibleShopIds } },
          { store: { $exists: true } }
        ];
      }

      const activities = await InventoryActivity.find(activityFilter)
        .populate('product', 'name sku')
        .populate('shop', 'name')
        .populate('store', 'name')
        .populate('user', 'name')
        .sort({ date: -1 });

      const movementSummary = {
        totalMovements: activities.length,
        receipts: activities.filter(a => a.activityType === 'receipt').length,
        issues: activities.filter(a => a.activityType === 'issue').length,
        adjustments: activities.filter(a => a.activityType === 'adjustment').length,
        transfers: activities.filter(a => a.activityType === 'transfer').length
      };

      // Product movement analysis
      const productMovement = {};
      activities.forEach(activity => {
        const productName = activity.product?.name || 'Unknown';
        if (!productMovement[productName]) {
          productMovement[productName] = {
            incoming: 0,
            outgoing: 0,
            adjustments: 0,
            movements: []
          };
        }

        const quantity = (activity.packs || 0) * (activity.packSize || 1) + (activity.pieces || 0);
        
        if (['receipt', 'transfer_in'].includes(activity.activityType)) {
          productMovement[productName].incoming += quantity;
        } else if (['issue', 'sale', 'transfer_out'].includes(activity.activityType)) {
          productMovement[productName].outgoing += quantity;
        } else if (activity.activityType === 'adjustment') {
          productMovement[productName].adjustments += quantity;
        }

        productMovement[productName].movements.push({
          date: activity.date,
          type: activity.activityType,
          quantity,
          location: activity.shop?.name || activity.store?.name || 'Unknown',
          user: activity.user?.name || 'Unknown'
        });
      });

      return {
        summary: {
          ...movementSummary,
          dateRange: { startDate, endDate },
          reportDate: new Date().toISOString()
        },
        productMovement,
        recentActivities: activities.slice(0, 50).map(activity => ({
          date: activity.date,
          product: activity.product?.name || 'Unknown',
          type: activity.activityType,
          quantity: (activity.packs || 0) * (activity.packSize || 1) + (activity.pieces || 0),
          location: activity.shop?.name || activity.store?.name || 'Unknown',
          user: activity.user?.name || 'Unknown',
          reference: activity.referenceNumber || 'N/A'
        }))
      };
    } catch (error) {
      throw new Error(`Product movement report error: ${error.message}`);
    }
  }

  // Helper methods
  static _groupSalesByDay(sales) {
    const dailySales = {};
    sales.forEach(sale => {
      const date = moment(sale.saleDate).format('YYYY-MM-DD');
      if (!dailySales[date]) {
        dailySales[date] = { total: 0, transactions: 0 };
      }
      dailySales[date].total += sale.totalAmount;
      dailySales[date].transactions += 1;
    });
    return dailySales;
  }

  static _groupSalesByShop(sales) {
    const shopSales = {};
    sales.forEach(sale => {
      const shopName = sale.shop?.name || 'Unknown';
      if (!shopSales[shopName]) {
        shopSales[shopName] = { total: 0, transactions: 0 };
      }
      shopSales[shopName].total += sale.totalAmount;
      shopSales[shopName].transactions += 1;
    });
    return shopSales;
  }

  static _getFrequentTransfers(transfers) {
    const productTransferCount = {};
    transfers.forEach(transfer => {
      transfer.items.forEach(item => {
        const productName = item.product?.name || 'Unknown';
        productTransferCount[productName] = (productTransferCount[productName] || 0) + 1;
      });
    });
    
    return Object.entries(productTransferCount)
      .map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

module.exports = ReportService;