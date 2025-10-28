import axios from 'axios';
import { useEffect, useState } from 'react';
import { FaEdit, FaPlus, FaSpinner, FaTrash } from 'react-icons/fa';
import './SuppliersPage.css';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    vatNumber: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/suppliers');
      setSuppliers(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/suppliers/${currentId}`, formData);
        setSuccess('Supplier updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/suppliers', formData);
        setSuccess('Supplier added successfully');
      }

      fetchSuppliers();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const editSupplier = (supplier) => {
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      vatNumber: supplier.vatNumber
    });
    setIsEditing(true);
    setCurrentId(supplier._id);
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    setIsLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/suppliers/${id}`);
      setSuccess('Supplier deleted successfully');
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      vatNumber: ''
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Manage Suppliers</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-container">
        <h2>{isEditing ? 'Edit Supplier' : 'Add New Supplier'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Supplier Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Person</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>VAT Number</label>
            <input
              type="text"
              name="vatNumber"
              value={formData.vatNumber}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <><FaSpinner className="spin" /> Processing...</>
            ) : (
              <>{isEditing ? <FaEdit /> : <FaPlus />} {isEditing ? 'Update' : 'Add'} Supplier</>
            )}
          </button>

          {isEditing && (
            <button
              type="button"
              className="cancel-button"
              onClick={resetForm}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="list-container">
        <h2>Supplier List</h2>
        {isLoading && suppliers.length === 0 ? (
          <div className="loading">Loading suppliers...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>VAT Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier._id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.contactPerson || '-'}</td>
                  <td>{supplier.phone || '-'}</td>
                  <td>{supplier.vatNumber || '-'}</td>
                  <td className="actions">
                    <button
                      onClick={() => editSupplier(supplier)}
                      className="edit-btn"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteSupplier(supplier._id)}
                      className="delete-btn"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SuppliersPage;