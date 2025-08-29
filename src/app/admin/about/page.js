'use client';

import { useEffect, useState } from 'react';
import './about.css'; // New CSS file

export default function AdminAboutPage() {
  const [formData, setFormData] = useState({ title: '', content: '', imageUrl: '' });
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/about')
      .then(res => res.json())
      .then(data => {
        if (data) setFormData(data);
        setIsLoading(false);
      });
  }, []);

  const handleFileChange = (e) => setImageFile(e.target.files[0]);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    let imageUrl = formData.imageUrl;

    if (imageFile) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);
      const uploadRes = await fetch('/api/admin/upload-banner', {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        imageUrl = uploadData.url;
      } else {
        alert('Image upload failed!');
        return;
      }
    }

    const res = await fetch('/api/admin/about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, imageUrl }),
    });

    if (res.ok) {
      alert('About page saved successfully!');
    } else {
      alert('Failed to save.');
    }
  };

  if (isLoading) return <div className="loading-state">Loading...</div>;

  return (
    <div className="page-container">
        <div className="form-container">
            <h2>Edit Your "About Us" Page</h2>
            <form onSubmit={handleSave} className="about-form">
                <div className="form-group">
                    <label htmlFor="title">Page Title</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="content">Content / Story</label>
                    <textarea id="content" name="content" value={formData.content || ''} onChange={handleChange} rows="10"></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="image">Header Image</label>
                    <input type="file" id="image" name="image" onChange={handleFileChange} />
                    {formData.imageUrl && <img src={formData.imageUrl} alt="Current" className="image-preview" />}
                </div>
                <button type="submit" className="save-btn">Save Changes</button>
            </form>
        </div>
    </div>
  );
}
