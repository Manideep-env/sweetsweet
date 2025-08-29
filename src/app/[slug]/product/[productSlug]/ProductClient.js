'use client';

import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import './product-page.css'; // New CSS file for styling

export default function ProductClient({ product, storeSlug, customization }) {
  const { addToCart } = useCart();
  const [weight, setWeight] = useState(1);
  const [quantity, setQuantity] = useState(1);

  // This useEffect applies the theme to the entire page body
  useEffect(() => {
    if (customization) {
      document.body.style.backgroundColor = customization.backgroundColor;
    }
    return () => {
      document.body.style.backgroundColor = ''; // Reset on component unmount
    };
  }, [customization]);

  const originalPrice = product.pricePerKg ?? product.pricePerUnit ?? 0;
  const effectivePrice = product.discountedPrice ?? originalPrice;
  const unitLabel = product.unitLabel || (product.pricePerKg ? 'kg' : 'unit');

  const handleAdd = () => {
    const payload = {
      id: product.id,
      slug: product.slug,
      name: product.title,
      image: product.image,
      pricePerKg: product.pricePerKg ? effectivePrice : null,
      pricePerUnit: product.pricePerUnit ? effectivePrice : null,
    };

    if (product.pricePerKg) {
      payload.weight = weight;
    } else {
      payload.quantity = quantity;
    }
    
    addToCart(payload, storeSlug);
    alert(`${product.title} added to cart!`);
  };

  const pageStyles = customization ? {
    '--store-primary-color': customization.primaryColor,
  } : {};

  return (
    <main className="product-page-container" style={pageStyles}>
      <div className="product-layout">
        <div className="product-image-gallery">
          <img
            src={product.image || '/no-image.jpg'}
            alt={product.title}
            className="main-product-image"
          />
        </div>

        <div className="product-details-panel">
          <p className="product-category">{product.category?.name || 'Uncategorized'}</p>
          <h1 className="product-title">{product.title}</h1>
          <p className="product-description">{product.description}</p>

          <div className="price-section">
            {product.finalDiscount > 0 && originalPrice > effectivePrice ? (
              <>
                <span className="original-price">₹{originalPrice}</span>
                <span className="sale-price">₹{effectivePrice}</span>
              </>
            ) : (
              <span className="regular-price">₹{effectivePrice}</span>
            )}
            <span className="unit-label">/ {unitLabel}</span>
          </div>

          {product.pricePerKg ? (
            <div className="quantity-selector">
              <label>Weight (kg):</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
              />
            </div>
          ) : (
            <div className="quantity-selector">
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              />
            </div>
          )}

          <button onClick={handleAdd} className="add-to-cart-btn">
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  );
}
