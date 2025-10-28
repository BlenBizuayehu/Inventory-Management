import { useState } from 'react';
import {
  FaBars,
  FaBoxes,
  FaChartLine,
  FaClipboardList,
  FaFileAlt,
  FaOilCan,
  FaTruckMoving,
  FaUsersCog
} from 'react-icons/fa';
import { Link, useLocation, useNavigate } from "react-router-dom";
import './Navbar.css';
import Sidebar from "./Sidebar";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


     const isLoggedIn = Boolean(localStorage.getItem('token'));
  const isLoginPage = location.pathname === "/login";
   const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
   if (!isLoggedIn || isLoginPage) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="nav-left">
          <button 
            className="hamburger-menu" 
            onClick={toggleSidebar}            
            aria-label="Toggle menu"
          >
            <FaBars size={20} />
          </button>
        </div>

        <div className="nav-links">
          <NavLink to="/owner/dashboard/overview" icon={<FaOilCan />} label="Inventory" currentPath={location.pathname} />
          <NavLink to="/owner/dashboard/products" icon={<FaBoxes />} label="Products" currentPath={location.pathname} />
          <NavLink to="/owner/dashboard/invoice" icon={<FaClipboardList />} label="Purchases" currentPath={location.pathname} />
          <NavLink to="/owner/dashboard/transfer" icon={<FaTruckMoving />} label="Transfers" currentPath={location.pathname} />
          <NavLink to="/owner/dashboard/sales" icon={<FaChartLine />} label="Sales" currentPath={location.pathname} />
          <NavLink to="/owner/dashboard/users" icon={<FaUsersCog />} label="Users" currentPath={location.pathname} />
          <NavLink to="/owner/dashboard/reports" icon={<FaFileAlt />} label="Reports" currentPath={location.pathname} />
        </div>

        
      </div>
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

    </nav>
  );
}

const NavLink = ({ to, icon, label, currentPath }) => {
  const isActive = currentPath.includes(to);
  return (
    <Link 
      to={to} 
      className={`nav-link ${isActive ? 'active' : ''}`}
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
      <span className="nav-indicator"></span>
    </Link>
  );
};

export default Navbar;