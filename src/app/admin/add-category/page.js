'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Button, TextField, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress, Snackbar, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
    try {
      setLoading(true);
      const res = await fetch('/api/category');
      if (!res.ok) {
        throw new Error(`Error fetching categories: ${res.statusText}`);
      }
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
      if (categoryName.trim() === '') {
        throw new Error('Category name cannot be empty.');
      }

      // Step 1: Upload image if a new file is selected
      if (categoryImageFile) {
        const formData = new FormData();
        formData.append('image', categoryImageFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(`Image upload failed: ${errorData.error}`);
        }
        const uploadResult = await uploadRes.json();
        imageUrl = uploadResult.imageUrl;
      } else if (editingId) {
        // If editing and no new image is selected, preserve the existing image URL
        const existingCategory = categories.find(cat => cat.id === editingId);
        if (existingCategory) {
          imageUrl = existingCategory.image;
        }
      }

      // Step 2: Create/update the category with the name and image URL
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
    if (cat.image) {
      setPreviewImage(cat.image);
    } else {
      setPreviewImage(null);
    }
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

  const handleCloseConfirm = () => {
    setOpenConfirm(false);
    setDeleteCandidateId(null);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, margin: 'auto' }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {editingId ? 'Edit Category' : 'Add New Category'}
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 1 }}>
        <TextField
          label="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <Button
          variant="contained"
          component="label"
          sx={{ mt: 1, mb: 1 }}
        >
          {categoryImageFile ? categoryImageFile.name : (previewImage ? 'Change Image' : 'Upload Image')}
          <input type="file" hidden onChange={handleImageChange} accept="image/*" />
        </Button>
        {previewImage && (
          <Box sx={{ mt: 1, mb: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={previewImage} alt="Category Preview" style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                setCategoryImageFile(null);
                setPreviewImage(null);
              }}
              sx={{ ml: 2 }}
            >
              Remove
            </Button>
          </Box>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : (editingId ? 'Update Category' : 'Add Category')}
        </Button>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" component="h2" gutterBottom>Existing Categories</Typography>
        {loading && !categories.length ? (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Image</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Category Name</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={cat.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cat.id}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50/cccccc/000000?text=No+Img'; }}
                        />
                      ) : (
                        <Box sx={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '0.7rem' }}>
                          No Image
                        </Box>
                      )}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cat.name}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <Button onClick={() => handleEdit(cat)} size="small" aria-label="edit" sx={{ minWidth: 'auto', p: 0.5 }}>
                        <EditIcon />
                      </Button>
                      <Button onClick={() => handleDeleteClick(cat.id)} size="small" color="error" aria-label="delete" sx={{ minWidth: 'auto', p: 0.5, ml: 1 }}>
                        <DeleteIcon />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Box>

      <Dialog
        open={openConfirm}
        onClose={handleCloseConfirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this category? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
