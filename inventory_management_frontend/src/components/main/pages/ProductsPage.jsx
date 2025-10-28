import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { FaBoxOpen, FaChevronDown, FaChevronUp, FaEdit, FaListUl, FaPlus, FaTrash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom"; // Add this import
import "./ProductsPage.css";


const ProductsPage = () => {
  const [products, setProducts] = useState([]);
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
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        // First try to get real data
        try {
          const response = await axios.get("http://localhost:5000/api/products", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.data?.data?.length > 0) {
            setProducts(response.data.data);
            setFeaturedProducts(response.data.data.slice(0, 6));
            return;
          }
        } catch (apiError) {
          console.log("API not available, using mock data", apiError);
        }
        // Fallback to mock data if API fails
        const mockProducts = [
          {
            _id: "1",
            name: "Total Quartz 9000",
            description: "Fully synthetic engine oil",
            category: "1",
            unit: "liter",
            piecesPerPack:3,
            imageUrl: "https://via.placeholder.com/150"
          },
          {
            _id: "2",
            name: "Total Transmission Fluid",
            description: "High-performance gear oil",
            category: "2",
            unit: "liter",
            piecesPerPack:3,
            imageUrl: "https://via.placeholder.com/150"
          }
        ];
        setProducts(mockProducts);
        setFeaturedProducts(mockProducts);
      } catch (err) {
        setError("Failed to fetch products");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categories");
        setCategories(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

    const handleProductClick = (productId) => {
    navigate(`/allproducts?productId=${productId}`);
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
  setIsLoading(true);
  setError("");

  try {
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("unit", formData.unit);
    formDataToSend.append("piecesPerPack", formData.piecesPerPack);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    let response;
    const token = localStorage.getItem("token");
    
    if (editingId) {
      response = await axios.put(
        `http://localhost:5000/api/products/${editingId}`,
        formDataToSend,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
    } else {
      response = await axios.post(
        "http://localhost:5000/api/products",
        formDataToSend,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
    }

    // Update products list
    if (editingId) {
      setProducts(products.map(p => 
        p._id === editingId ? response.data.data : p
      ));
    } else {
      setProducts([...products, response.data.data]);
    }
    
    resetForm();
  } catch (err) {
    setError(err.response?.data?.message || "Failed to save product");
    console.error(err);
  } finally {
    setIsLoading(false);
  }
};

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert("Failed to delete product");
      console.error(err);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      unit: product.unit || "piece",
      piecesPerPack: product.piecesPerPack || 1,
      image: null,
      imageUrl: product.imageUrl || ""
    });
  };

  const resetForm = () => {
    // Revoke previous object URL if any
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }
    setFormData({
      name: "",
      description: "",
      category: "",
      unit: "piece",
      piecesPerPack: 1,
      image: null,
      imageUrl: "",
      newCategory: ""
    });
    setEditingId(null);
  };

  // --- Category add ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!formData.newCategory.trim()) return;

    try {
      const res = await axios.post("http://localhost:5000/api/categories", {
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
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
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
      await axios.put(
        `http://localhost:5000/api/categories/${categoryEditId}`,
        { name: categoryEditName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div className="image-placeholder">
                          <FaBoxOpen />
                        </div>
                      )}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="category">{productCategory?.name || "Uncategorized"}</p>
                      <p className="description">{product.description || "No description"}</p>
                    </div>
                    <div className="product-actions">
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
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="page-footer">
        <Link to="/allproducts" className="view-all-button">
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