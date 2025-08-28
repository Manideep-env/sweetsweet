'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, FormControl, InputLabel, Select, MenuItem, Typography,
  Switch, FormControlLabel, CircularProgress, Snackbar, Alert, DialogContentText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Initial state for the form
const initialFormState = {
  id: null,
  name: '',
  slug: '',
  categoryId: '',
  pricePerKg: '',
  pricePerUnit: '',
  unitLabel: '',
  image: '', // Will hold the image URL string
  description: '',
  isAvailable: true,
};

export default function AddProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [productImageFile, setProductImageFile] = useState(null); // To store the actual file object
  const [previewImage, setPreviewImage] = useState(null); // To display image preview

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState(null);


  // Fetch categories and products on load
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/product');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.map(p => ({ ...p, price: p.pricePerKg ?? p.pricePerUnit })));
    } catch (error) {
      console.error('Error fetching products:', error);
      setSnackbarMessage(`Error fetching products: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/category');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setSnackbarMessage(`Error fetching categories: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setProductImageFile(null);
      setPreviewImage(null);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.categoryId) {
      setSnackbarMessage('Name, Slug, and Category are required.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    let finalImageUrl = form.image; // Start with existing image URL if editing

    try {
      // Step 1: Upload image if a new file is selected
      if (productImageFile) {
        const formData = new FormData();
        formData.append('image', productImageFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(`Image upload failed: ${errorData.error || 'Unknown error'}`);
        }
        const uploadResult = await uploadRes.json();
        finalImageUrl = uploadResult.imageUrl; // Use the new uploaded image URL
      }

      // Step 2: Create/update the product with all data including the (new or old) image URL
      const method = isEditing ? 'PUT' : 'POST';
      const url = '/api/product'; // Both POST and PUT go to /api/product

      const productDataToSave = {
        ...form,
        image: finalImageUrl, // Ensure the image URL is part of the form data
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productDataToSave),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(`Operation failed: ${data.error || 'Something went wrong'}`);
      }

      setSnackbarMessage(isEditing ? 'Product Updated' : 'Product Added');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setModalOpen(false);
      setProductImageFile(null);
      setPreviewImage(null);
      setForm(initialFormState); // Reset form after saving
      fetchProducts(); // Refetch products to show the new/updated one
    } catch (error) {
      console.error('Error saving product:', error);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setIsEditing(true);
      setForm({
        ...product,
        categoryId: product.category?.id || '', // Ensure categoryId is set correctly, handle null category
        image: product.image || '', // Existing image URL
      });
      setPreviewImage(product.image || null); // Display existing image as preview
    } else {
      setIsEditing(false);
      setForm(initialFormState); // Reset form for new product
      setPreviewImage(null);
    }
    setProductImageFile(null); // Clear any previously selected file
    setModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setProductToDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/product?id=${productToDeleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(`Deletion failed: ${data.message || 'Something went wrong'}`);
      }
      setSnackbarMessage('Product deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchProducts(); // Refetch products
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setProductToDeleteId(null);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" component="h1">Products ({products.length})</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => handleOpenModal()}>Add Product</Button>
      </Box>

      {loading && products.length === 0 ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Image</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Price</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Available</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, index) => (
                <tr key={p.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.id}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/60x60/cccccc/000000?text=No+Img'; }}
                      />
                    ) : (
                      <Box sx={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: '6px', fontSize: '0.7rem' }}>
                        No Image
                      </Box>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.name}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.category?.name || '-'}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>₹{p.price}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.isAvailable ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <Button size="small" onClick={() => handleOpenModal(p)} sx={{ minWidth: 'auto', p: 0.5 }}>
                      <EditIcon />
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDeleteClick(p.id)} sx={{ minWidth: 'auto', p: 0.5, ml: 1 }}>
                      <DeleteIcon />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {/* Product Add/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth label="Name" name="name" value={form.name || ''} onChange={handleChange} margin="normal" required />
          <TextField fullWidth label="Slug" name="slug" value={form.slug || ''} onChange={handleChange} margin="normal" required />
          <FormControl fullWidth margin="normal" required>
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
            {productImageFile ? productImageFile.name : (previewImage ? 'Change Image' : 'Upload Image')}
            <input type="file" hidden name="image" onChange={handleImageFileChange} accept="image/*" />
          </Button>
          {/* Image Preview */}
          {previewImage && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img
                src={previewImage}
                alt="Product Preview"
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px' }}
              />
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => {
                  setProductImageFile(null);
                  setPreviewImage(null);
                  setForm(prev => ({ ...prev, image: '' })); // Clear image URL in form
                }}
                sx={{ ml: 2 }}
              >
                Remove
              </Button>
            </Box>
          )}

          <TextField fullWidth label="Description" name="description" value={form.description || ''} onChange={handleChange} multiline minRows={3} margin="normal" />
          <FormControlLabel
            control={<Switch checked={form.isAvailable} onChange={handleChange} name="isAvailable" />}
            label="Is Available"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (isEditing ? 'Update Product' : 'Save Product')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="confirm-delete-dialog-title"
        aria-describedby="confirm-delete-dialog-description"
      >
        <DialogTitle id="confirm-delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-dialog-description">
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="primary">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>


      {/* Snackbar for feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
