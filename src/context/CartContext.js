'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [storeSlug, setStoreSlug] = useState(null);

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

  // --- NEW: Function to set the current store slug ---
  const setCurrentStore = (slug) => {
    if (slug) {
        setStoreSlug(slug);
    }
  };

  const addToCart = (product, slug) => {
    if (storeSlug && slug !== storeSlug) {
      setCart([product]);
      setStoreSlug(slug);
      alert('You started shopping at a new store, so your previous cart was cleared.');
      return;
    }
    if (!storeSlug) {
      setStoreSlug(slug);
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 0) + (product.quantity || 0), weight: (item.weight || 0) + (product.weight || 0) }
            : item
        );
      }
      return [...prev, product];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.id !== id);
      if (newCart.length === 0) {
        setStoreSlug(null);
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setStoreSlug(null);
  };

  return (
    <CartContext.Provider value={{ cart, storeSlug, addToCart, removeFromCart, clearCart, setCurrentStore }}>
      {children}
    </CartContext.Provider>
  );
}
