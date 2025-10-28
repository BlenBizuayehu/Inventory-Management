// components/Sidebar.jsx
import { useEffect, useRef, useState } from 'react';
import { FaSignOutAlt, FaTimes, FaUser, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ isOpen, onClose, position = "right" }) {
  const navigate = useNavigate();

   const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };
 
    useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      

    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
     <>
      <div className={`sidebar ${isOpen ? 'open' : ''} ${position}`}>
        <div className="sidebar-header">
          <button className="close-btn" onClick={onClose}>
            <FaTimes size={24} />
          </button>
        </div>
        <div className="nav-right" ref={profileRef}>
          <div className="profile-section">
  <button 
    className="profile-btn" 
    onClick={() => setIsProfileOpen(!isProfileOpen)}
    aria-label="User profile"
  >
    <FaUserCircle size={24} />
  </button>

  {isProfileOpen && (
    <div className="profile-options">
      <button
  className="dropdown-item"
  onClick={() => {
    navigate("/profile");
    setIsProfileOpen(false);
    onClose(); // Optional: closes the sidebar
  }}
>
  <FaUser className="dropdown-icon" />
  <span>Profile</span>
</button>
      <button 
        className="dropdown-item" 
        onClick={handleLogout}
      >
        <FaSignOutAlt className="dropdown-icon" />
        <span>Logout</span>
      </button>
    </div>
  )}
</div>

        </div>
        <div className="sidebar-content">
          <h3>Dashboard</h3>
          <div className="sidebar-links">
            <button onClick={() => handleNavigation("/owner/dashboard/overview")}>Home</button>
          </div>
          
          <h3>More Options</h3>
          <div className="sidebar-links">
            <button onClick={() => handleNavigation("/suppliers")}>Suppliers</button>
            <button onClick={() => handleNavigation("/settings")}>Settings</button>
            <button onClick={() => handleNavigation("/product-prices")}>Prices</button>
            <button onClick={() => handleNavigation("/shops")}>Shops</button>
            <button onClick={() => handleNavigation("/stores")}>Stores</button>
            <button onClick={() => handleNavigation("/user-shop")}>Assign shop to user</button>

          </div>
        </div>
      </div>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
}