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
  { href: '/admin/customization', label: 'Customization' }, // <-- New Link
  { href: '/admin/invoice', label: 'Invoice' },
];

export default function AdminSideNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <aside className="admin-sidenav">
      <div>
        <h2 className="admin-title">Sweet Store</h2>
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
