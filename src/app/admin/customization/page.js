'use client';

import { useEffect, useState } from 'react';
import './customization.css';

export default function CustomizationPage() {
  const [settings, setSettings] = useState({
    primaryColor: '#4F46E5',
    backgroundColor: '#F9FAFB',
    bannerImageUrl: '',
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/customization')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setIsLoading(false);
      });
  }, []);

  const handleFileChange = (e) => {
    setBannerFile(e.target.files[0]);
  };

  const handleBannerUpload = async () => {
    if (!bannerFile) {
        alert("Please select a file first.");
        return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', bannerFile);

    const res = await fetch('/api/admin/upload-banner', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setIsUploading(false);

    if (data.success) {
      setSettings({ ...settings, bannerImageUrl: data.url });
      alert("Banner uploaded! Don't forget to save your changes.");
    } else {
      alert('Upload failed.');
    }
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    if (res.ok) {
      alert('Customization saved successfully!');
    } else {
      alert('Failed to save settings.');
    }
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className="page-container">
      <div className="form-and-preview-layout">
        <div className="form-container">
          <h2>Store Customization</h2>
          <p>Design how your storefront looks to customers.</p>
          <form onSubmit={handleSubmit} className="customization-form">
            
            {/* Primary Color */}
            <div className="form-group">
              <label htmlFor="primaryColor">Primary Color</label>
              <div className="color-input-wrapper">
                <input 
                  type="color" 
                  id="primaryColor" 
                  name="primaryColor" 
                  value={settings.primaryColor} 
                  onChange={handleChange} 
                />
                <input 
                  type="text" 
                  value={settings.primaryColor} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(val) || val === '') {
                      setSettings({ ...settings, primaryColor: val });
                    }
                  }}
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Background Color */}
            <div className="form-group">
              <label htmlFor="backgroundColor">Background Color</label>
              <div className="color-input-wrapper">
                <input 
                  type="color" 
                  id="backgroundColor" 
                  name="backgroundColor" 
                  value={settings.backgroundColor} 
                  onChange={handleChange} 
                />
                <input 
                  type="text" 
                  value={settings.backgroundColor} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(val) || val === '') {
                      setSettings({ ...settings, backgroundColor: val });
                    }
                  }}
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Banner Upload */}
            <div className="form-group">
              <label htmlFor="bannerImage">Banner Image</label>
              <div className="file-upload-wrapper">
                <input type="file" id="bannerImage" name="bannerImage" onChange={handleFileChange} />
                <button type="button" onClick={handleBannerUpload} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {settings.bannerImageUrl && <p className="image-path">Current: {settings.bannerImageUrl}</p>}
            </div>

            <button type="submit" className="save-btn">Save All Changes</button>
          </form>
        </div>

        {/* Live Preview */}
        <div className="preview-container">
          <h2>Live Preview</h2>
          <div className="preview-box" style={{ backgroundColor: settings.backgroundColor }}>
            {settings.bannerImageUrl && (
              <img 
                src={settings.bannerImageUrl} 
                alt="Banner Preview" 
                className="preview-banner" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="preview-content">
              <h3>Welcome to Your Store</h3>
              <button style={{ backgroundColor: settings.primaryColor }} className="preview-button">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
