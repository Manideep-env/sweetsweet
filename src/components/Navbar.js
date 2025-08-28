'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  
  // --- Hooks for navigation and context ---
  const pathname = usePathname();
  const params = useParams();
  const { cart } = useCart();

  // Get the store slug from the URL, e.g., "manis-store"
  const storeSlug = params.slug;

  useEffect(() => {
    // Admin verification logic remains the same
    fetch('/api/verify')
      .then(res => res.ok ? setIsAdmin(true) : setIsAdmin(false))
      .catch(() => setIsAdmin(false));
  }, []);

  const logout = async () => {
    await fetch('/api/login', { method: 'DELETE' });
    setIsAdmin(false);
    // Redirect to the main landing page after logout
    window.location.href = '/'; 
  };

  const isAdminRoute = pathname.startsWith('/admin');
  
  // ✅ FIX: Cart count should be the number of unique items in the cart
  const itemCount = cart?.length || 0;

  return (
    <nav className="navbar">
      {/* ✅ FIX: Home link is now dynamic. It points to the store's homepage if on a store page, otherwise to the root. */}
      <Link href={storeSlug ? `/${storeSlug}` : "/"}>Store Home</Link>

      {/* Show store-specific links only when on a storefront page */}
      {storeSlug && !isAdminRoute && (
        <>
          {/* ✅ FIX: Categories link is now dynamic */}
          <Link href={`/${storeSlug}/categories`}>All Products</Link>

          <Link href="/cart" className="ml-auto relative cart-icon">
            🛒
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </Link>
        </>
      )}

      {/* Admin Panel link logic remains the same */}
      {isAdmin && <Link href="/admin">Admin Panel</Link>}
      
      {/* Example of a static link that is not store-dependent */}
      {!storeSlug && !isAdminRoute && (
         <Link href="/store-locator">Find a Store</Link> // Example
      )}
    </nav>
  );
}
