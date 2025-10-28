import axios from "axios";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaBoxOpen } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./AllProductsPage.css";

const ProductsListPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // Fetch products
        const productsRes = await axios.get("http://localhost:5000/api/products");
        setProducts(productsRes.data?.data || []);
        
        // Fetch categories
        const categoriesRes = await axios.get("http://localhost:5000/api/categories");
        setCategories(categoriesRes.data?.data || []);
        
      } catch (err) {
        setError("Failed to fetch data. " + (err.response?.data?.message || err.message));
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

    useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const productId = searchParams.get('productId');
    
    if (productId && products.length > 0) {
      const product = products.find(p => p._id === productId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [location.search, products]);

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Scroll to top to see the details
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="products-list-page">
      <div className="page-header">
        <h1>
          <FaBoxOpen /> All Products
        </h1>
        <Link to="/owner/dashboard/products" className="back-button">
          <FaArrowLeft /> Back to Management
        </Link>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError("")} className="close-error">
            ×
          </button>
        </div>
      )}

      {/* Product Details Section - Only shown when a product is selected */}
    {selectedProduct && (
    <div className="product-details-section">
        <h2>Product Details</h2>
        <div className="product-details-card">
        <div className="product-image-container">
            {selectedProduct.imageUrl ? (
            <img 
                src={selectedProduct.imageUrl} 
                alt={selectedProduct.name} 
                className="product-detail-image"
            />
            ) : (
            <div className="image-placeholder">No Image</div>
            )}
        </div>
        <div className="product-info">
            <h3>{selectedProduct.name}</h3>
            <div className="detail-row">
            <span className="detail-label">Category:</span>
            <span>{getCategoryName(selectedProduct.category)}</span>
            </div>
            <div className="detail-row">
            <span className="detail-label">Description:</span>
            <p>{selectedProduct.description || "No description available"}</p>
            </div>
            <div className="detail-row">
            <span className="detail-label">Product ID:</span>
            <span>{selectedProduct._id}</span>
            </div>
        </div>
        </div>
    </div>
    )}

      {/* Products Table */}
      <div className="products-table-container">
        <h2>Products List ({products.length})</h2>
        
        {isLoading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="no-products">No products available</div>
        ) : (
          <div className="table-responsive">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr 
                    key={product._id} 
                    className={selectedProduct?._id === product._id ? "selected-row" : ""}
                    onClick={() => handleProductSelect(product)}
                  >
                    <td>{product.name}</td>
                    <td className="description-cell">
                      {product.description || "-"}
                    </td>
                    <td>{getCategoryName(product.category)}</td>
                    
                    <td className="actions-cell">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductSelect(product);
                        }} 
                        className="view-button"
                        title="View Details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsListPage;