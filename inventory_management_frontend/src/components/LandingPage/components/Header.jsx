import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const isLoginPage = location.pathname === "/login";

  // Don't show header when logged in
  if (isLoggedIn) return null;

  return (
    <div className="header">
      <div className="right-header">
        <div className="logo-container">
          <img src="/total-logo.png" alt="Logo" />
          <div>
            <span>BIRHANE TEFERI TOTAL LUBRICANTS DISTRIBUTOR</span>
          </div>
        </div>
      </div>

      <div className="left-header">
        <div className="links-container">
          {!isLoggedIn && (
            <>
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/products">Products</Link>
            </>
          )}
          
          {!isLoginPage && !isLoggedIn && (
            <Link to="/login">
              <button className="btn-login">Login</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;