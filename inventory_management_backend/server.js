// server.js
const path = require("path");

const multer = require("multer");
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/DB');
const userRoutes = require('./routes/UserRoutes');
const productRoutes=require("./routes/ProductRoutes");
const CategoryRoutes=require("./routes/CategoryRoutes");
const InvoiceRoutes=require("./routes/InvoiceRoutes")
const SupplierRoutes=require("./routes/SupplierRoutes");
const SettingsRoutes=require("./routes/SettingsRoutes");
const ShopRoutes=require("./routes/ShopRoutes");
const StoreRoutes=require("./routes/StoreRoutes");
const TransferRoutes=require("./routes/TransferRoutes");
const SalesRoutes=require("./routes/SalesRoutes");
const PriceRoutes=require('./routes/PriceRoutes');
const UserShopRoutes=require('./routes/UserShopRoutes');
const BatchRoutes= require('./routes/BatchRoutes');
const InventoryRoutes=require('./routes/InventoryRoutes');


const cors = require('cors');
dotenv.config();
const app = express();
app.use(cors());

// app.use(cors({
//   origin: 'http://localhost:5173' to allow access only from this frontend port
// }));
connectDB();
app.use(express.json());

app.use('/api/users', userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/products", productRoutes);
app.use("/api/categories", CategoryRoutes);
app.use("/api/invoices", InvoiceRoutes);
app.use("/api/settings", SettingsRoutes);
app.use("/api/suppliers", SupplierRoutes);
app.use("/api/shops", ShopRoutes);
app.use("/api/stores", StoreRoutes);
app.use("/api/transfers", TransferRoutes);
app.use("/api/sales", SalesRoutes);
app.use("/api/prices", PriceRoutes);
app.use("/api/user-shops", UserShopRoutes);
app.use('/api/batches',BatchRoutes);
app.use('/api/inventory', InventoryRoutes);




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});



const upload = multer({ storage });

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); 
const PORT = process.env.PORT ;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
