'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import './AdminSideNav.css';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/add-product', label: 'Add new Product' },
  { href: '/admin/add-category', label: 'Add new Category' },
  { href: '/admin/discount', label: 'Discounts' },
  { href: '/admin/customization', label: 'Customization' },
  { href: '/admin/about', label: 'About' },
  { href: '/admin/invoice', label: 'Invoice' },
];

export default function AdminSideNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [storeName, setStoreName] = useState('Admin Panel'); // Add state for store name

  useEffect(() => {
    fetch('/api/verify')
      .then(res => {
        if (res.ok) {
          setIsAdmin(true);
          return res.json(); // If the response is OK, parse the JSON body
        }
        throw new Error('Verification failed');
      })
      .then(data => {
        if (data && data.storeName) {
          setStoreName(data.storeName); // Set the store name from the response
        }
      })
      .catch(() => {
        setIsAdmin(false);
        setStoreName('Admin Panel'); // Fallback on error
      });
  }, []);

  const logout = async () => {
    await fetch('/api/login', { method: 'DELETE' });
    setIsAdmin(false);
    location.href = '/';
  };

  return (
    <aside className="admin-sidenav">
      <div>
        {/* Display the dynamic store name */}
        <h2 className="admin-title">{storeName}</h2>
        <nav className="admin-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-link ${pathname === link.href ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {isAdmin && (
        <button className="admin-logout" onClick={logout}>
          Logout
        </button>
      )}
    </aside>
  );
}
