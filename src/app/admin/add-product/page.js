'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, FormControl, InputLabel, Select, MenuItem, Typography
} from '@mui/material';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import './AddProductPage.css';

// Initial state for the form
const initialFormState = {
  id: null,
  name: '',
  slug: '',
  categoryId: '',
  pricePerKg: '',
  pricePerUnit: '',
  unitLabel: '',
  image: null, // Will hold the File object or existing image URL string
  description: '',
  isAvailable: true,
};

export default function AddProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialFormState);

  // Fetch categories and products on load
  const fetchProducts = () => {
    fetch('/api/product')
      .then(res => res.json())
      .then(data => setProducts(data.map(p => ({...p, price: p.pricePerKg ?? p.pricePerUnit})))); // Normalize price field
  };
  
  const fetchCategories = () => {
    fetch('/api/category')
      .then(res => res.json())
      .then(data => setCategories(data));
  };
  
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "image") {
      setForm(prev => ({ ...prev, image: files[0] }));
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.categoryId) {
      return alert('Name, Slug, and Category are required.');
    }

    // Use FormData to handle file uploads
    const formData = new FormData();
    // Append all form fields to formData
    for (const key in form) {
      if (form[key] !== null) {
        formData.append(key, form[key]);
      }
    }

    const res = await fetch('/api/product', {
      method: isEditing ? 'PUT' : 'POST',
      body: formData, // Browser will set Content-Type to multipart/form-data
    });

    if (res.ok) {
      alert(isEditing ? 'Product Updated' : 'Product Added');
      setModalOpen(false);
      fetchProducts(); // Refetch products to show the new/updated one
    } else {
      const data = await res.json();
      alert(`Error: ${data.message || 'Something went wrong'}`);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      // Editing existing product
      setForm({
        ...product,
        categoryId: product.category.id, // Ensure categoryId is set correctly
      });
      setIsEditing(true);
    } else {
      // Adding new product
      setForm(initialFormState);
      setIsEditing(false);
    }
    setModalOpen(true);
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    await fetch(`/api/product?id=${id}`, { method: 'DELETE' });
    setProducts(products.filter(p => p.id !== id));
    alert('Product deleted');
  };

  return (
    <Box className="products-container">
      <Box className="products-header">
        <Typography variant="h5">Products ({products.length})</Typography>
        <Button startIcon={<FaPlus />} onClick={() => handleOpenModal()}>Add Product</Button>
      </Box>

      <table className="products-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>
                {p.image ? (
                  <img src={p.image} alt={p.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                ) : 'No Image'}
              </td>
              <td>{p.name}</td>
              <td>{p.category?.name || '-'}</td>
              <td>₹{p.price}</td>
              <td className="products-actions">
                <Button size="small" onClick={() => handleOpenModal(p)}><FaEdit /></Button>
                <Button size="small" onClick={() => handleDelete(p.id)}><FaTrash /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" name="name" value={form.name || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Slug" name="slug" value={form.slug || ''} onChange={handleChange} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select name="categoryId" value={form.categoryId || ''} onChange={handleChange} label="Category">
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Price Per Kg" name="pricePerKg" type="number" value={form.pricePerKg || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Price Per Unit" name="pricePerUnit" type="number" value={form.pricePerUnit || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Unit Label" name="unitLabel" value={form.unitLabel || ''} onChange={handleChange} margin="normal" />
          
          {/* File Input for Image */}
          <Button variant="contained" component="label" fullWidth sx={{ mt: 2, mb: 1 }}>
            Upload Image
            <input type="file" hidden name="image" onChange={handleChange} accept="image/*" />
          </Button>
          {/* Image Preview */}
          {form.image && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img 
                src={typeof form.image === 'string' ? form.image : URL.createObjectURL(form.image)}
                alt="Preview"
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
            </Box>
          )}

          <TextField fullWidth label="Description" name="description" value={form.description || ''} onChange={handleChange} multiline minRows={3} margin="normal" />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setModalOpen(false)} className="cancel-btn" variant="outlined">Cancel</Button>
          <Button onClick={handleSave} className="save-btn" variant="contained">{isEditing ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}