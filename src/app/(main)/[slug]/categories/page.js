'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import './categories.css';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customization, setCustomization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = useParams();
  const searchParams = useSearchParams();
  
  const storeSlug = params.slug;
  const categoryFromQuery = searchParams.get('category');

  useEffect(() => {
    if (!storeSlug) return;

    async function fetchStoreData() {
      // ... (data fetching logic remains the same)
      try {
        const [categoryRes, productRes, customRes] = await Promise.all([
          fetch(`/api/store/${storeSlug}/categories`),
          fetch(`/api/store/${storeSlug}/products`),
          fetch(`/api/store/${storeSlug}/customization`),
        ]);
        if (!productRes.ok || !categoryRes.ok) throw new Error(`Store data not found.`);
        const categoryData = await categoryRes.json();
        const productData = await productRes.json();
        const customData = await customRes.json();
        setCategories(categoryData);
        setProducts(productData);
        setCustomization(customData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStoreData();
  }, [storeSlug]);

  // --- FIX: This useEffect applies the theme to the entire page body ---
  useEffect(() => {
    if (customization) {
      document.body.style.backgroundColor = customization.backgroundColor;
    }
    // Cleanup function to reset the background when leaving the page
    return () => {
      document.body.style.backgroundColor = ''; // Resets to default
    };
  }, [customization]);

  useEffect(() => {
    setSelectedCategory(categoryFromQuery || 'All');
  }, [categoryFromQuery]);

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((prod) => prod.category?.name === selectedCategory);

  if (loading) return <div className="loading-state">Loading...</div>;
  if (error) return <div className="error-state">{error}</div>;

  const pageStyles = customization ? {
    '--store-primary-color': customization.primaryColor,
  } : {};

  return (
    // The main container no longer needs a background color
    <div className="page-container" style={pageStyles}>
      <div className="categories-layout">
        <aside className="sidebar">
          {/* ... sidebar content ... */}
          <h2 className="sidebar-title">Categories</h2>
          <ul className="category-list">
            <li
              onClick={() => setSelectedCategory('All')}
              className={selectedCategory === 'All' ? 'active' : ''}
            >
              All
            </li>
            {categories.map((cat) => (
              <li
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={selectedCategory === cat.name ? 'active' : ''}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        </aside>
        <section className="product-section">
          {/* ... product grid content ... */}
          

          {filteredProducts.length === 0 ? (
            <p>No products found in this category.</p>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const basePrice = parseFloat(product.pricePerKg ?? product.pricePerUnit ?? 0);
                const discountedPrice = product.discountedPrice ? parseFloat(product.discountedPrice) : null;

                return (
                  <Link key={product.id} href={`/${storeSlug}/product/${product.slug}`} className="product-link">
                    <div className="product-card">
                      <img
                        src={product.image || '/no-image.jpg'}
                        alt={product.name}
                        className="product-image"
                      />
                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-price">
                          {discountedPrice && discountedPrice < basePrice ? (
                            <>
                              <span className="original-price">₹{basePrice.toFixed(2)}</span>
                              <span className="sale-price">₹{discountedPrice.toFixed(2)}</span>
                            </>
                          ) : (
                            `₹${basePrice.toFixed(2)}`
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
