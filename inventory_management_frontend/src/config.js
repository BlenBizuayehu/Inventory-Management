// src/config.js
const dev = "http://localhost:5000";
const prod = "https://inventory-management-yaij.onrender.com";

export const API_BASE_URL =
  process.env.NODE_ENV === "production" ? prod : dev;
