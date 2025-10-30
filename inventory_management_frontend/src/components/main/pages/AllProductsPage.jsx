import { useEffect, useState } from "react";
import { FaArrowLeft, FaBoxOpen, FaEdit, FaTrash } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { API_BASE_URL } from "../../../api";
import "./AllProductsPage.css";

const ProductsListPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
   const navigate = useNavigate();
     const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // Fetch products
        const productsRes = await api.get("/products");
        setProducts(productsRes.data?.data || []);
        
        // Fetch categories
        const categoriesRes = await api.get("/categories");
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
        // Scroll to top to see the details
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [location.search, products]);



   const handleEdit = (product) => {
    // Navigate to the management page and pass the product state
    // The management page will need to be updated to receive this state
    navigate('/owner/dashboard/products', { state: { productToEdit: product } });
  };




   const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure? This will permanently delete the product.")) return;
    try {
        await api.delete(`/products/${productId}`);
        // Refetch the data to show the updated list
        fetchData(); 
    } catch (err) {
        setError(err.response?.data?.error || "Failed to delete product.");
    }
  };

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
                src={`${API_BASE_URL}/uploads/${selectedProduct.imageUrl}`} 
                alt={selectedProduct.name} 
                className="product-detail-image"
            />
            ) : (
            <div className="detail-image-placeholder">No Image</div>
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
            <div className="actions-cell">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(selectedProduct);
                        }} 
                        className="edit-btn"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(selectedProduct._id);
                        }}
                        className="delete-btn"
                      >
                        <FaTrash />
                      </button>
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
                          handleEdit(product);
                        }} 
                        className="edit-btn"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product._id);
                        }}
                        className="delete-btn"
                      >
                        <FaTrash />
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