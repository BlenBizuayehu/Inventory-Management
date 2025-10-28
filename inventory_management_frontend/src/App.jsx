import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import './App.css';
import Header from "./components/LandingPage/components/Header";
import AboutPage from "./components/LandingPage/pages/AboutPage";
import Homepage from './components/LandingPage/pages/Homepage';
import Login from "./components/LandingPage/pages/Login";
import ProductsPage from "./components/LandingPage/pages/ProductsPage";
import Navbar from "./components/main/components/Navbar";
import Profile from "./components/main/components/Profile";
import AllProductsPage from "./components/main/pages/AllProductsPage";
import BatchPlacement from "./components/main/pages/BatchPlacement";
import InvoicesPage from './components/main/pages/InvoicesPage';
import MainDashboard from "./components/main/pages/MainDashboard";
import NewBatchEntry from "./components/main/pages/NewBatchEntry";
import TransferHistoryPage from "./components/main/pages/TransferHistoryPage";
import TransferRecords from './components/main/pages/TransferRecords';
import PricesListPage from "./components/system/PricesListPage";
import ProductPrice from "./components/system/ProductPrice";
import SettingsPage from "./components/system/SettingsPage";
import ShopsPage from "./components/system/ShopsPage";
import StoresPage from "./components/system/StoresPage";
import SuppliersPage from "./components/system/SuppliersPage";
import UserShopAssignment from "./components/system/UserShopAssignment";

function App() {
    return(
      <Router>
        <Header/>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Homepage/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/about" element={<AboutPage/>} />
          <Route path="/products" element={<ProductsPage/>} />
          <Route path="/owner/dashboard/*" element={<MainDashboard/>}/>
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/product-prices" element={<ProductPrice/>} />
          <Route path="/invoices/new" element={<NewBatchEntry />} />
          <Route path="/invoices/edit/:invoiceId" element={<NewBatchEntry />} />
          <Route path="/shops" element={<ShopsPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/user-shop" element={<UserShopAssignment />} />
          <Route path="/dashboard/transfers/records" element={<TransferRecords />} />
          <Route path="/allproducts" element={<AllProductsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/prices/list" element={<PricesListPage />} />
          <Route 
            path="/owner/dashboard/transfers/history/:id" 
            element={<TransferHistoryPage />} 
          />
          <Route 
            path="/batch-placement/:invoiceId" 
            element={<BatchPlacement />} 
          />
        </Routes>
      </Router>
    )
}

export default App;
