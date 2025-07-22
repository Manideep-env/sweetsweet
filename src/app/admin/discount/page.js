'use client';

import { useEffect, useState } from 'react';
import './discount.css';

export default function DiscountPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [mode, setMode] = useState('product'); // Toggle between product/category
  const [form, setForm] = useState({
    productId: '',
    categoryId: '',
    percentage: '',
    startDate: '',
    endDate: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    fetch('/api/product/basic').then(res => res.json()).then(setProducts).catch(console.error);
    fetch('/api/category').then(res => res.json()).then(setCategories).catch(console.error);
    fetchDiscounts();
  }, []);

  const fetchDiscounts = () => {
    fetch('/api/discounts').then(res => res.json()).then(setDiscounts).catch(console.error);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProductSearch = (e) => {
    const value = e.target.value;
    setProductSearch(value);
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(value.toLowerCase()) &&
      (!form.categoryId || p.categoryId == form.categoryId)
    );
    setSuggestions(filtered);
  };

  const handleSuggestionClick = (product) => {
    setForm(prev => ({ ...prev, productId: product.id }));
    setProductSearch(product.name);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      percentage: form.percentage,
      startDate: form.startDate,
      endDate: form.endDate,
      ...(mode === 'product' ? { productId: form.productId } : { categoryId: form.categoryId }),
    };

    const url = editingId ? `/api/discounts/${editingId}` : '/api/discounts';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert(editingId ? 'Discount updated.' : 'Discount added.');
      resetForm();
      fetchDiscounts();
    }
  };

  const handleEdit = (discount) => {
    setMode(discount.productId ? 'product' : 'category');
    setForm({
      productId: discount.productId || '',
      categoryId: discount.categoryId || '',
      percentage: discount.percentage,
      startDate: discount.startDate.slice(0, 10),
      endDate: discount.endDate.slice(0, 10),
    });
    setEditingId(discount.id);

    const product = products.find(p => p.id === discount.productId);
    setProductSearch(product?.name || '');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
    if (res.ok) fetchDiscounts();
  };

  const resetForm = () => {
    setForm({ productId: '', categoryId: '', percentage: '', startDate: '', endDate: '' });
    setProductSearch('');
    setSuggestions([]);
    setEditingId(null);
  };

  const getProductName = (id) => products.find(p => p.id === id)?.name || 'Unknown';
  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || 'Unknown';

  return (
    <div className="discount-container">
      <h2>{editingId ? 'Edit Discount' : 'Add Discount'}</h2>

      <div className="mode-switch">
        <label>
          <input type="radio" name="mode" value="product" checked={mode === 'product'} onChange={() => setMode('product')} />
          By Product
        </label>
        <label>
          <input type="radio" name="mode" value="category" checked={mode === 'category'} onChange={() => setMode('category')} />
          By Category
        </label>
      </div>

      <form onSubmit={handleSubmit} className="discount-form">
        {mode === 'product' && (
          <>
            <select name="categoryId" value={form.categoryId} onChange={handleChange}>
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search Product"
              value={productSearch}
              onChange={handleProductSearch}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="suggestions">
                {suggestions.map(p => (
                  <li key={p.id} onClick={() => handleSuggestionClick(p)}>
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {mode === 'category' && (
          <select name="categoryId" value={form.categoryId} onChange={handleChange} required>
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        )}

        <input
          type="number"
          name="percentage"
          placeholder="Discount %"
          value={form.percentage}
          onChange={handleChange}
          required
          min="1"
          max="100"
        />
        <input
          type="date"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={handleChange}
          required
        />
        <button type="submit">{editingId ? 'Update' : 'Create'} Discount</button>
      </form>

      <h3>Existing Discounts</h3>
      <table className="discount-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Target</th>
            <th>Percentage</th>
            <th>Start</th>
            <th>End</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {discounts.map(d => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.productId ? getProductName(d.productId) : `Category: ${getCategoryName(d.categoryId)}`}</td>
              <td>{d.percentage}%</td>
              <td>{d.startDate.slice(0, 10)}</td>
              <td>{d.endDate.slice(0, 10)}</td>
              <td>
                <button onClick={() => handleEdit(d)}>Edit</button>
                <button onClick={() => handleDelete(d.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
