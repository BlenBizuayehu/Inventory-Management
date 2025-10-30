import { useEffect, useRef, useState } from "react";
import { FaBoxOpen, FaChevronDown, FaChevronUp, FaEdit, FaListUl, FaPlus, FaTrash } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Add this import
import api, { API_BASE_URL } from '../../../api';
import "./ProductsPage.css";


const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const location = useLocation();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    unit: "piece",
    piecesPerPack: 1,
    image: null,
    imageUrl: "",
    newCategory: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);  // Add this
const [submitError, setSubmitError] = useState(null);    // Add this
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryEditId, setCategoryEditId] = useState(null);
  const [categoryEditName, setCategoryEditName] = useState("");
  const [showCategories, setShowCategories] = useState(false);
   const navigate = useNavigate();

  // Keep track of object URLs to revoke later
  const imageUrlRef = useRef(null);

  // Fetch products only
   const fetchAllData = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Use your 'api' instance for clean, authorized requests
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories")
      ]);

      const fetchedProducts = productsRes.data?.data || [];
      setProducts(fetchedProducts);
      setFeaturedProducts(fetchedProducts.slice(0, 6));
      setCategories(categoriesRes.data?.data || []);
    } catch (err) {
      setError("Failed to fetch page data. The server may be offline.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);


   useEffect(() => {
    const productToEdit = location.state?.productToEdit;
    if (productToEdit) {
      setEditingId(productToEdit._id);
      setFormData({
        name: productToEdit.name,
        description: productToEdit.description || "",
        category: productToEdit.category,
        unit: productToEdit.unit || "piece",
        piecesPerPack: productToEdit.piecesPerPack || 1,
        image: null,
        imageUrl: productToEdit.imageUrl ? `${API_BASE_URL}/uploads/${productToEdit.imageUrl}` : ""
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.state]); 


  const handleProductClick = (productId) => {
  // Change this line - use the correct route path
  navigate(`/owner/dashboard/allproducts?productId=${productId}`);
};

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If unit changes to/from pack/box, reset piecesPerPack

    if (name === 'unit') {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      piecesPerPack: (value === 'pack' || value === 'box') ? prev.piecesPerPack : 1
    }));
  } else {
    setFormData(prev => ({ ...prev, [name]: value }));
  }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous object URL to avoid memory leaks
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
      const newUrl = URL.createObjectURL(file);
      imageUrlRef.current = newUrl;
      setFormData((prev) => ({
        ...prev,
        image: file,
        imageUrl: newUrl
      }));
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("unit", formData.unit);
      formDataToSend.append("piecesPerPack", formData.piecesPerPack);
      if (formData.image) formDataToSend.append("image", formData.image);
      
      if (editingId) {
        await api.put(`/products/${editingId}`, formDataToSend, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/products", formDataToSend, { headers: { "Content-Type": "multipart-form-data" } });
      }
      resetForm();
      fetchAllData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };
  


  const resetForm = () => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
    setFormData({
      name: "", description: "", category: "", unit: "piece",
      piecesPerPack: 1, image: null, imageUrl: "", newCategory: ""
    });
    setEditingId(null);
  };


  // --- Category add ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!formData.newCategory.trim()) return;

    try {
      const res = await api.post("/categories", {
        name: formData.newCategory.trim()
      });
      setCategories((prev) => [...prev, res.data.data]);
      setFormData((prev) => ({ ...prev, newCategory: "" }));
    } catch (err) {
      alert("Failed to add category");
    }
  };

  // --- Category delete ---
  const handleCategoryDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await api.delete(`/categories/${id}`);

      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert("Failed to delete category");
      console.error(err);
    }
  };

  // --- Category edit ---
  const startEditingCategory = (category) => {
    setCategoryEditId(category._id);
    setCategoryEditName(category.name);
  };

  const cancelEditingCategory = () => {
    setCategoryEditId(null);
    setCategoryEditName("");
  };

  const saveCategoryEdit = async () => {
    if (!categoryEditName.trim()) return alert("Category name cannot be empty");
    try {
      const token = localStorage.getItem("token");
      await api.put(`/categories/${categoryEditId}`, {
        name: categoryEditName.trim()
      });

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === categoryEditId ? { ...cat, name: categoryEditName.trim() } : cat
        )
      );
      cancelEditingCategory();
    } catch (err) {
      alert("Failed to update category");
      console.error(err);
    }
  };

  return (
    <div className="dashboard-page">
      <h1 className="page-title">
        <FaBoxOpen /> Products Management
      </h1>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError("")} className="close-error">
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="form-group">
          <label>Product Name*</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Category*</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Unit of Measurement*</label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
          >
            <option value="piece">Piece</option>
            <option value="kg">Kilogram</option>
            <option value="liter">Liter</option>
            <option value="gallon">Gallon</option>
            <option value="box">Box</option>
            <option value="pack">Pack</option>
            <option value="set">Set</option>
            <option value="pair">Pair</option>
            <option value="meter">Meter</option>
            <option value="gram">Gram</option>
          </select>
        </div>
        <div className="form-group">
          <label>Pieces per Pack*</label>
          <input
            type="number"
            name="piecesPerPack"
            min="1"
            value={formData.piecesPerPack}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Product Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {formData.imageUrl && (
            <img src={formData.imageUrl} alt="Preview" className="image-preview" />
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                {editingId ? <FaEdit /> : <FaPlus />}
                {editingId ? "Update" : "Add"} Product
              </>
            )}
          </button>
          {editingId && (
            <button
              type="button"
              className="cancel-button"
              onClick={resetForm}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      

      <div className="products-grid-section">
        <h2>Featured Products</h2>
        {isLoading && featuredProducts.length === 0 ? (
          <div className="loading">Loading products...</div>
        ) : (
          <div className="products-grid">
            {featuredProducts.length === 0 ? (
              <div className="no-products">No featured products available</div>
            ) : (
              featuredProducts.map((product) => {
                const productCategory = categories.find((c) => c._id === product.category);
                return (
                  <div 
                    key={product._id} 
                    className="product-card"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <div className="product-image">
                    {product.imageUrl ? (
                      // --- THIS IS THE FIX ---
                      // Construct the full URL for display
                      <img src={`${API_BASE_URL}/uploads/${product.imageUrl}`} alt={product.name} />
                    ) : (
                      <div className="image-placeholder"><FaBoxOpen /></div>
                    )}
                  </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="category">{productCategory?.name || "Uncategorized"}</p>
                      <p className="description">{product.description || "No description"}</p>
                    </div>
                    
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="page-footer">
        <Link to="/owner/dashboard/allproducts" className="view-all-button">
          View All Products
        </Link>
      </div>

    <div className="categories-section">
        <button 
          className="toggle-categories-btn"
          onClick={() => setShowCategories(!showCategories)}
        >
          <FaListUl /> {showCategories ? 'Hide' : 'Show'} Categories Management
          {showCategories ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {showCategories && (
          <>
            <form
              onSubmit={handleAddCategory}
              className="category-form"
            >
              <div className="form-group">
                <label>Add New Category</label>
                <div className="category-input-group">
                  <input
                    type="text"
                    name="newCategory"
                    value={formData.newCategory || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, newCategory: e.target.value }))}
                    placeholder="Enter category name"
                  />
                  <button 
                    type="submit" 
                    className="submit-button" 
                    disabled={!formData.newCategory?.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            <div className="table-container">
              <h2>Category List</h2>
              {categories.length === 0 ? (
                <p>No categories available</p>
              ) : (
                <table className="categories-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category._id}>
                        <td>
                          {categoryEditId === category._id ? (
                            <input
                              type="text"
                              value={categoryEditName}
                              onChange={(e) => setCategoryEditName(e.target.value)}
                              className="category-edit-input"
                            />
                          ) : (
                            category.name
                          )}
                        </td>
                        <td>
                          {categoryEditId === category._id ? (
                            <>
                              <button
                                onClick={saveCategoryEdit}
                                className="save-button"
                                title="Save"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditingCategory}
                                className="cancel-button"
                                title="Cancel"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditingCategory(category)}
                                className="edit-btn"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleCategoryDelete(category._id)}
                                className="delete-btn"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;