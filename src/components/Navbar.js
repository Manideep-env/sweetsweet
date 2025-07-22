'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import './Navbar.css';

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

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

  return (
    <nav className="navbar">
      <Link href="/">Home</Link>

      {!isAdminRoute && (
        <>
          <Link href="/categories">Categories</Link>
          <Link href="/cart" className="ml-auto text-white bg-blue-600 px-4 py-2 rounded">Cart</Link>
        </>
      )}

      {isAdmin && <Link href="/admin">Admin Panel</Link>}
    </nav>
  );
}
