'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Button, TextField, Typography
} from '@mui/material';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './AddCategoryPage.css';

export default function AddCategoryPage() {
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    const res = await fetch('/api/category');
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/category/${editingId}` : '/api/category';

    const res = await fetch(url, {
      method,
      body: JSON.stringify({ name: categoryName }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      setCategoryName('');
      setEditingId(null);
      fetchCategories();
    }
  };

  const handleEdit = (cat) => {
    setCategoryName(cat.name);
    setEditingId(cat.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    const res = await fetch(`/api/category/${id}`, { method: 'DELETE' });
    if (res.ok) fetchCategories();
  };

  return (
    <Box className="products-container">
      <Box className="products-header">
        <Typography variant="h5">
          {editingId ? 'Edit Category' : 'Add New Category'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit} className="add-category-form">
        <TextField
          label="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <Button type="submit" variant="contained" className="save-btn">
          {editingId ? 'Update' : 'Add'}
        </Button>
      </form>

      <Box mt={4}>
        <Typography variant="h6">Existing Categories</Typography>
        <table className="products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td>{cat.name}</td>
                <td className="products-actions">
                  <Button onClick={() => handleEdit(cat)} size="small">
                    <FaEdit />
                  </Button>
                  <Button onClick={() => handleDelete(cat.id)} size="small">
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}
