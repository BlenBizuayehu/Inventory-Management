import { Route, Routes } from "react-router-dom";
import PricesListPage from "../../system/PricesListPage";
import ProductPrice from "../../system/ProductPrice";
import SettingsPage from "../../system/SettingsPage";
import ShopsPage from "../../system/ShopsPage";
import StoresPage from "../../system/StoresPage";
import SuppliersPage from "../../system/SuppliersPage";
import UserShopAssignment from "../../system/UserShopAssignment";
import Profile from "../components/Profile";
import AllProductsPage from "../pages/AllProductsPage";
import AllSalesPage from "../pages/AllSalesPage";
import BatchPlacement from "../pages/BatchPlacement";
import InventoryOverview from "../pages/InventoryOverview";
import InvoicesPage from '../pages/InvoicesPage';
import NewBatchEntry from "../pages/NewBatchEntry";
import ProductsPage from "../pages/ProductsPage";
import ReceivablesPage from "../pages/ReceivablesPage";
import ReportsPage from "../pages/ReportsPage";
import ShopHistory from "../pages/ShopHistory";
import StoreHistory from "../pages/StoreHistory";
import TransferHistoryPage from "../pages/TransferHistoryPage";
import TransferRecords from '../pages/TransferRecords';
import TransferToShops from "../pages/TransferToShops";
import UserManagement from "../pages/UserManagement";

import './MainDashboard.css';
import SalesRegister from "./SalesRegister";

const MainDashboard = () => {
  return(
    <div className="MainDashboard">
        <Routes>
            <Route path="overview" element={<InventoryOverview />} />
            <Route path="invoice" element={<NewBatchEntry />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="transfer" element={<TransferToShops />} />
            <Route path="sales" element={<SalesRegister />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/product-prices" element={<ProductPrice/>} />
          <Route path="/credits" element={<ReceivablesPage/>} />
          <Route path="/invoices/new" element={<NewBatchEntry />} />
          <Route path="/invoices/edit/:invoiceId" element={<NewBatchEntry />} />
          <Route path="/shops" element={<ShopsPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/user-shop" element={<UserShopAssignment />} />
          <Route path="/transfers/records" element={<TransferRecords />} />
          <Route path="/allproducts" element={<AllProductsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/prices/list" element={<PricesListPage />} />
          <Route 
            path="/transfers/history/:id" 
            element={<TransferHistoryPage />} 
          />
          <Route 
            path="/inventory/store-history/:id" 
            element={<StoreHistory />} 
          />
          <Route 
            path="/inventory/shop-history/:id" 
            element={<ShopHistory />} 
          />
          <Route 
            path="/batch-placement/:invoiceId" 
            element={<BatchPlacement />} 
          />
          <Route path="/sales/all" element={<AllSalesPage />} /> 
        </Routes>
    </div>
  )
};

export default MainDashboard;
