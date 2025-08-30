'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import './Navbar.css';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export default function Navbar() {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [storeName, setStoreName] = useState('instantB2C');
  const [customization, setCustomization] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const params = useParams();
  const { cart, storeSlug, setCurrentStore } = useCart();

  // Mount check to avoid hydration mismatch
  useEffect(() => setIsMounted(true), []);

  // Set store context from slug
  useEffect(() => {
    if (params.slug) setCurrentStore(params.slug);
  }, [params.slug, setCurrentStore]);

  // Verify login state on route change
  useEffect(() => {
    fetch('/api/user/verify')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setIsUserLoggedIn(true);
        setUserData(data);
      })
      .catch(() => {
        setIsUserLoggedIn(false);
        setUserData(null);
      });
  }, [pathname]);

  // Store customization & name fetch
  useEffect(() => {
    if (pathname === '/') {
      setStoreName('instantB2C');
      setCustomization(null);
      return;
    }

    if (!storeSlug) {
      setStoreName('instantB2C'); 
      setCustomization(null);
      return;
    }

    // Could be combined into one API call later
    fetch(`/api/store/${storeSlug}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setStoreName(data.storeName || 'instantB2C'))
      .catch(() => setStoreName('instantB2C'));

    fetch(`/api/store/${storeSlug}/customization`)
      .then(res => res.ok ? res.json() : null)
      .then(setCustomization)
      .catch(() => setCustomization(null));
  }, [storeSlug, pathname]);

  const itemCount = cart?.length || 0;

  // Memoized theme styles
  const navStyles = useMemo(() => (
    customization ? { '--store-primary-color': customization.primaryColor, '--store-bg-color': customization.backgroundColor } : {}
  ), [customization]);

  if (!isMounted) {
    return <nav className="navbar" style={{ height: '72px', visibility: 'hidden' }}></nav>;
  }

  return (
    <nav className="navbar" style={navStyles}>
      <div className="navbar-left">
        <Link href={storeSlug ? `/${storeSlug}` : "/"} className={pathname === `/${storeSlug}` || pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        {storeSlug && (
          <>
            <Link href={`/${storeSlug}/categories`} className={pathname.includes('/categories') ? 'active' : ''}>All Products</Link>
            <Link href={`/${storeSlug}/about`} className={pathname.includes('/about') ? 'active' : ''}>About</Link>
          </>
        )}
      </div>

      <div className="navbar-center">
        {storeName && (
          <Link href={storeSlug ? `/${storeSlug}` : "/"} className="store-name">
            {storeName}
          </Link>
        )}
      </div>

      <div className="navbar-right">
        {storeSlug && (
          <Link href="/cart" className="cart-icon" aria-label="cart">
            <span role="img" aria-hidden="true"><img src="/cart.png" alt="Cart" className="cart-png" /></span>
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </Link>
        )}
        <div className="user-auth-section">
          {isUserLoggedIn ? (
            <Link href="/user/profile" className="profile-link">
              <span>{userData?.fullName}</span>
              <UserIcon />
            </Link>
          ) : (
            <Link href="/user/login" className="login-link">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
