import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import './App.css';
import Header from "./components/LandingPage/components/Header";
import AboutPage from "./components/LandingPage/pages/AboutPage";
import Homepage from './components/LandingPage/pages/Homepage';
import Login from "./components/LandingPage/pages/Login";
import ProductsPage from "./components/LandingPage/pages/ProductsPage";
import Navbar from "./components/main/components/Navbar";
import MainDashboard from "./components/main/pages/MainDashboard";

// 1. Import the ShopProvider from your context file
import { ShopProvider } from "./context/shopContext";


function App() {
    return(
      <Router>
        {/* These components are likely present on all pages and don't need the context */}
        <Header/>
        <Navbar/>

        <Routes className="routes">
          {/* Public routes that do NOT need access to shop context */}
          <Route path="/" element={<Homepage/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/about" element={<AboutPage/>} />
          <Route path="/products" element={<ProductsPage/>} />
          
          {/* 
            This is the protected route that contains components needing the shop context.
            We wrap its element with the ShopProvider.
          */}
          <Route 
            path="/owner/dashboard/*" 
            element={
              // 2. Wrap the MainDashboard component with the ShopProvider
              <ShopProvider>
                <MainDashboard/>
              </ShopProvider>
            }
          />
        </Routes>
      </Router>
    )
}

export default App;