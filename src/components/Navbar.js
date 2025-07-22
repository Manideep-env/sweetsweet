'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext'; // ✅ assumes you have this
import './Navbar.css';

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const { cart } = useCart();

  useEffect(() => {
    fetch('/api/verify')
      .then(res => res.ok ? setIsAdmin(true) : setIsAdmin(false))
      .catch(() => setIsAdmin(false));
  }, []);

  const logout = async () => {
    await fetch('/api/login', { method: 'DELETE' });
    setIsAdmin(false);
    location.href = '/';
  };

  const isAdminRoute = pathname.startsWith('/admin');
  const itemCount = cart?.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="navbar">
      <Link href="/">Home</Link>

      {!isAdminRoute && (
        <>
          <Link href="/categories">Categories</Link>

          <Link href="/cart" className="ml-auto relative cart-icon">
            🛒
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </Link>
        </>
      )}

      {isAdmin && <Link href="/admin">Admin Panel</Link>}
    </nav>
  );
}
