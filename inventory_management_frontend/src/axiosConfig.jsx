import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000", // Backend server URL
  withCredentials: true, // If you use cookies/session auth
});

export default instance;
