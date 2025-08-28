'use client';

import { useCart } from '@/context/CartContext';
import { useState } from 'react';

// This component now receives the storeSlug prop
export default function ProductClient({ product, storeSlug }) {
  const { addToCart } = useCart();
  const [weight, setWeight] = useState(1);
  const [quantity, setQuantity] = useState(1);

  // --- Logic from original component ---
  const originalPrice = product.pricePerKg ?? product.pricePerUnit ?? 0;
  const discountPercentage = Number(product.finalDiscount || 0);
  const effectivePrice = product.discountedPrice ?? originalPrice;
  const unitLabel = product.unitLabel || (product.pricePerKg ? 'kg' : 'unit');
  // ---

  const handleAdd = () => {
    // --- Payload creation from original component ---
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
    // ---

    // ✅ KEY CHANGE: Pass the storeSlug when adding to cart
    addToCart(payload, storeSlug);
    alert(`${product.title} added to cart!`);
  };

  // --- Full JSX from original component ---
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">{product.title}</h1>

      <img
        src={product.image || '/no-image.jpg'}
        alt={product.title}
        className="w-60 h-60 object-cover rounded mt-4"
      />

      <p className="mt-4 text-lg">{product.description}</p>
      <p className="mt-2 text-sm text-gray-500">
        Category: {product.category?.name || 'Uncategorized'}
      </p>

      {discountPercentage > 0 && (
        <p className="mt-2 text-sm text-green-600 font-semibold">
          🎉 Best Deal: {discountPercentage}% Off!
        </p>
      )}

      <div className="mt-2 text-lg font-semibold">
        {discountPercentage > 0 && originalPrice > effectivePrice ? (
          <>
            <span className="line-through text-gray-500 mr-2">
              ₹{originalPrice} / {unitLabel}
            </span>
            <span className="text-red-600">
              ₹{effectivePrice} / {unitLabel}
            </span>
          </>
        ) : (
          <span>
            ₹{effectivePrice} / {unitLabel}
          </span>
        )}
      </div>

      {product.pricePerKg ? (
        <div className="mt-4">
          <label className="block mb-1 font-medium">Weight (kg):</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
            className="border px-2 py-1 rounded w-24"
          />
        </div>
      ) : (
        <div className="mt-4">
          <label className="block mb-1 font-medium">Quantity:</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="border px-2 py-1 rounded w-24"
          />
        </div>
      )}

      <button
        onClick={handleAdd}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Add to Cart
      </button>
    </main>
  );
}