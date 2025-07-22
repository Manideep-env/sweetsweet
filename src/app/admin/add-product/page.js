'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, FormControl, InputLabel, Select, MenuItem, Typography
} from '@mui/material';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import './AddProductPage.css';


export default function AddProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    categoryId: '',
    pricePerKg: '',
    pricePerUnit: '',
    unitLabel: '',
    image: '',
    description: '',
    isAvailable: true,
  });

  // Fetch categories on load
  useEffect(() => {
    fetch('/api/category')
      .then(res => res.json())
      .then(data => setCategories(data));
  }, []);

  // Fetch products on load
  useEffect(() => {
    fetch('/api/product')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.categoryId) return alert('Required fields missing.');

    const res = await fetch('/api/product', {
      method: editIndex !== null ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      alert(editIndex !== null ? 'Updated' : 'Added');
      setModalOpen(false);
      setForm({ name: '', slug: '', categoryId: '', pricePerKg: '', pricePerUnit: '', unitLabel: '', image: '', description: '', isAvailable: true });
      setEditIndex(null);
      // Refetch products
      fetch('/api/product')
        .then(res => res.json())
        .then(setProducts);
    } else {
      alert(data.message || 'Something went wrong');
    }
  };

  const handleEdit = (index) => {
    setForm(products[index]);
    setEditIndex(index);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/product?id=${id}`, { method: 'DELETE' });
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <Box className="products-container">
  <Box className="products-header">
    <Typography variant="h5">Products ({products.length})</Typography>
    <Button startIcon={<FaPlus />} onClick={() => { setForm({}); setModalOpen(true); }}>Add Product</Button>
  </Box>

  <table className="products-table">
  <thead>
    <tr>
      <th>Sweet ID</th>
      <th>Sweet Name</th>
      <th>Category</th>
      <th>Price/kg</th>
      <th>Image</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {products.map((p, i) => (
      <tr key={p.id}>
        <td>{p.id}</td>
        <td>{p.name}</td>
        <td>{p.category?.name || '-'}</td>
        <td>₹{p.pricePerKg}</td>
        <td>
          {p.image ? (
            <img src={p.image} alt={p.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
          ) : 'No Image'}
        </td>
        <td className="products-actions">
          <Button size="small" onClick={() => handleEdit(i)}><FaEdit /></Button>
          <Button size="small" onClick={() => handleDelete(p.id)}><FaTrash /></Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>


      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editIndex !== null ? 'Edit Product' : 'Add Product'}</DialogTitle>
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
          <TextField fullWidth label="Image URL" name="image" value={form.image || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Description" name="description" value={form.description || ''} onChange={handleChange} multiline minRows={3} margin="normal" />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setModalOpen(false)} className="cancel-btn" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSave} className="save-btn" variant="contained">
            {editIndex !== null ? 'Update' : 'Save'}
          </Button>
        </DialogActions>

      </Dialog>
    </Box>
  );
}
