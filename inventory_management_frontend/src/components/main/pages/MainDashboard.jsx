import { Route, Routes } from "react-router-dom";
import InventoryOverview from "../pages/InventoryOverview";
import NewBatchEntry from "../pages/NewBatchEntry";
import ProductsPage from "../pages/ProductsPage";
import ReportsPage from "../pages/ReportsPage";
import SalesOverview from "../pages/SalesOverview";
import TransferToShops from "../pages/TransferToShops";
import UserManagement from "../pages/UserManagement";
import './MainDashboard.css';

const MainDashboard = () => {
  return(
    <div className="MainDashboard">
        <Routes>
            <Route path="overview" element={<InventoryOverview />} />
            <Route path="invoice" element={<NewBatchEntry />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="transfer" element={<TransferToShops />} />
            <Route path="sales" element={<SalesOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<ReportsPage />} />
        </Routes>
    </div>
  )
};

export default MainDashboard;
