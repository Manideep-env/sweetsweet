'use client';

import React, { useEffect, useState } from 'react';
import {
Dialog, DialogActions, DialogContent, DialogTitle,
TextField, Button, DialogContentText, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './add-category.css'; // New CSS file

export default function AddCategoryPage() {
const [categoryName, setCategoryName] = useState('');
const [categoryImageFile, setCategoryImageFile] = useState(null);
const [previewImage, setPreviewImage] = useState(null);
const [categories, setCategories] = useState([]);
const [editingId, setEditingId] = useState(null);
const [openConfirm, setOpenConfirm] = useState(false);
const [deleteCandidateId, setDeleteCandidateId] = useState(null);
const [loading, setLoading] = useState(false);
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');
const [snackbarSeverity, setSnackbarSeverity] = useState('success');

const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/category');
      if (!res.ok) throw new Error(`Error fetching categories: ${res.statusText}`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setSnackbarMessage(`Failed to fetch categories: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
fetchCategories();
}, []);

const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCategoryImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setCategoryImageFile(null);
      setPreviewImage(null);
    }
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let imageUrl = '';

    try {
      if (categoryName.trim() === '') throw new Error('Category name cannot be empty.');

      if (categoryImageFile) {
        const formData = new FormData();
        formData.append('image', categoryImageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(`Image upload failed: ${errorData.error}`);
        }
        const uploadResult = await uploadRes.json();
        imageUrl = uploadResult.imageUrl;
      } else if (editingId) {
        const existingCategory = categories.find(cat => cat.id === editingId);
        if (existingCategory) imageUrl = existingCategory.image;
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/category/${editingId}` : '/api/category';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName, image: imageUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Operation failed: ${errorData.error}`);
      }

      setCategoryName('');
      setCategoryImageFile(null);
      setPreviewImage(null);
      setEditingId(null);
      fetchCategories();
      setSnackbarMessage(`Category ${editingId ? 'updated' : 'added'} successfully!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error submitting category:', error);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

const handleEdit = (cat) => {
    setCategoryName(cat.name);
    setEditingId(cat.id);
    setPreviewImage(cat.image || null);
    setCategoryImageFile(null);
  };

const handleDeleteClick = (id) => {
    setDeleteCandidateId(id);
    setOpenConfirm(true);
  };

const handleConfirmDelete = async () => {
    setOpenConfirm(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/category/${deleteCandidateId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Deletion failed: ${errorData.error}`);
      }
      fetchCategories();
      setSnackbarMessage('Category deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting category:', error);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDeleteCandidateId(null);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

return (
<div className="page-container">
      <div className="form-and-list-layout">
        <div className="form-container">
            <h2>{editingId ? 'Edit Category' : 'Add New Category'}</h2>
            <form onSubmit={handleSubmit} className="category-form">
                <TextField
                    label="Category Name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    fullWidth
                    required
                />
                <Button variant="contained" component="label">
                    {categoryImageFile ? categoryImageFile.name : (previewImage ? 'Change Image' : 'Upload Image')}
                    <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                </Button>
                {previewImage && (
                    <div className="image-preview-wrapper">
                        <img src={previewImage} alt="Preview" className="image-preview" />
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => {
                                setCategoryImageFile(null);
                                setPreviewImage(null);
                            }}
                        >
                            Remove
                        </Button>
                    </div>
                )}
                <button type="submit" className="submit-btn" disabled={loading}>
                    {editingId ? 'Update Category' : 'Add Category'}
                </button>
            </form>
        </div>

        <div className="list-container">
            <div className="list-header">
                <h2>Existing Categories</h2>
            </div>
            <table className="categories-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((cat) => (
                        <tr key={cat.id}>
                            <td>{cat.id}</td>
                            <td>
                                <img
                                    src={cat.image || 'https://placehold.co/50x50/cccccc/000000?text=No+Img'}
                                    alt={cat.name}
                                    className="category-list-image"
                                />
                            </td>
                            <td>{cat.name}</td>
                            <td className="actions-cell">
                                <button onClick={() => handleEdit(cat)}><EditIcon fontSize="small" /></button>
                                <button onClick={() => handleDeleteClick(cat.id)}><DeleteIcon fontSize="small" /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

<Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
<DialogTitle>Confirm Deletion</DialogTitle>
<DialogContent>
<DialogContentText>
Are you sure you want to delete this category? This action cannot be undone.
</DialogContentText>
</DialogContent>
<DialogActions>
<Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
<Button onClick={handleConfirmDelete} color="error">Delete</Button>
</DialogActions>
</Dialog>

<Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
<Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
{snackbarMessage}
</Alert>
</Snackbar>
</div>
);
}

