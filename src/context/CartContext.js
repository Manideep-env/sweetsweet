'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [storeSlug, setStoreSlug] = useState(null);

  // --- Persistence logic from new component (correct) ---
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    const storedSlug = localStorage.getItem('cart_store_slug');
    if (storedCart) setCart(JSON.parse(storedCart));
    if (storedSlug) setStoreSlug(storedSlug);
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    if (storeSlug) {
      localStorage.setItem('cart_store_slug', storeSlug);
    } else {
      localStorage.removeItem('cart_store_slug');
    }
  }, [cart, storeSlug]);
  // ---

  const addToCart = (product, slug) => {
    // --- Architectural rule from new component (correct) ---
    if (storeSlug && slug !== storeSlug) {
      // Starting a new cart in a different store
      setCart([product]);
      setStoreSlug(slug);
      alert('You started shopping at a new store, so your previous cart was cleared.');
      return;
    }

    // If this is the first item, set the store slug
    if (!storeSlug) {
      setStoreSlug(slug);
    }
    // ---

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        // ✅ MERGED: Use the robust update logic from the original component
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: (item.quantity || 0) + (product.quantity || 0),
                weight: (item.weight || 0) + (product.weight || 0),
              }
            : item
        );
      }
      
      // ✅ MERGED: Use the simpler, correct logic for adding a new item
      return [...prev, product];
    });
  };

  // --- Cart management functions from new component (correct) ---
  const removeFromCart = (id) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.id !== id);
      if (newCart.length === 0) {
        setStoreSlug(null); // Clear slug if cart becomes empty
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setStoreSlug(null);
  };
  // ---

  return (
    <CartContext.Provider value={{ cart, storeSlug, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}