import axios from "axios";

// Environment-aware base URL
const dev = "http://localhost:5000";
const prod = "https://inventory-management-yaij.onrender.com";

const instance = axios.create({
  baseURL: process.env.NODE_ENV === "production" ? prod : dev,
  withCredentials: true, // keep if using cookies/session auth
});

export default instance;
