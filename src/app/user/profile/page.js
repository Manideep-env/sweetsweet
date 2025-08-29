'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import './profile.css';

export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customization, setCustomization] = useState(null);
  const router = useRouter();
  const { storeSlug } = useCart();

  const sections = { details: useRef(null), addresses: useRef(null), orders: useRef(null) };
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [profileForm, setProfileForm] = useState({ fullName: '' });
  const [addressForm, setAddressForm] = useState({});

  // --- CORRECTED: Single, robust data fetching function ---
  const fetchPageData = () => {
    Promise.all([
      fetch('/api/user/profile'),
      storeSlug ? fetch(`/api/store/${storeSlug}/customization`) : Promise.resolve(null)
    ])
    .then(async ([profileRes, customRes]) => {
      if (!profileRes.ok) throw new Error('Not authenticated');
      
      const profileData = await profileRes.json();
      const customData = customRes ? await customRes.json() : null;

      setUserData(profileData.user);
      setAddresses(profileData.addresses);
      setOrders(profileData.orders);
      setProfileForm({ fullName: profileData.user.fullName });
      setCustomization(customData);
    })
    .catch(() => router.push('/user/login'))
    .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPageData();
  }, [router, storeSlug]);

  useEffect(() => {
    if (customization) {
      document.body.style.backgroundColor = customization.backgroundColor;
    }
    return () => { document.body.style.backgroundColor = ''; };
  }, [customization]);

  const scrollToSection = (sectionKey) => {
    sections[sectionKey].current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileForm),
    });
    if (res.ok) {
      alert('Profile updated!');
      setIsEditingProfile(false);
      fetchPageData();
    } else {
      alert('Failed to update profile.');
    }
  };

  const handleAddressUpdate = async (addressId) => {
    const res = await fetch(`/api/user/addresses/${addressId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressForm),
    });
    if (res.ok) {
      alert('Address updated!');
      setEditingAddressId(null);
      fetchPageData();
    } else {
      alert('Failed to update address.');
    }
  };

  const handleAddressDelete = async (addressId) => {
    if (confirm('Are you sure you want to delete this address?')) {
      const res = await fetch(`/api/user/addresses/${addressId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Address deleted.');
        fetchPageData();
      } else {
        alert('Failed to delete address.');
      }
    }
  };

  const userLogout = async () => {
    await fetch('/api/user/login', { method: 'DELETE' });
    router.push('/');
  };
  
  const startEditingAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm(address);
  };

  const handleCancelOrder = async (orderId) => {
    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      const res = await fetch(`/api/user/orders/${orderId}/cancel`, {
        method: 'PUT',
      });
      if (res.ok) {
        alert('Order cancelled successfully.');
        fetchPageData();
      } else {
        const data = await res.json();
        alert(`Failed to cancel order: ${data.error || 'An unknown error occurred.'}`);
      }
    }
  };

  if (isLoading || !userData) return <div className="loading-state">Loading Profile...</div>;

  const pageStyles = customization ? { '--store-primary-color': customization.primaryColor } : {};

  return (
    <div className="page-container" style={pageStyles}>
      {/* --- CORRECTED: JSX structure now matches the CSS layout --- */}
      <div className="profile-layout">
        <aside className="profile-sidenav">
          <nav>
            <ul className="sidenav-list">
              <li><button onClick={() => scrollToSection('details')}>Account Details</button></li>
              <li><button onClick={() => scrollToSection('addresses')}>Saved Addresses</button></li>
              <li><button onClick={() => scrollToSection('orders')}>My Orders</button></li>
              <li className="sidenav-divider"></li>
              <li><button onClick={userLogout} className="sidenav-logout-btn">Logout</button></li>
            </ul>
          </nav>
        </aside>

        <main className="profile-content">
          <h1 className="main-title">Your Profile</h1>
          
          <section ref={sections.details} className="profile-section">
            <h2 className="section-title">Account Details</h2>
            {isEditingProfile ? (
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                />
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Save Changes</button>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="details-view">
                <div className="detail-item"><span>Full Name</span><span>{userData.fullName}</span></div>
                <div className="detail-item"><span>Email</span><span>{userData.email}</span></div>
                <button className="edit-btn" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>
              </div>
            )}
          </section>

          <section ref={sections.addresses} className="profile-section">
            <h2 className="section-title">Saved Addresses</h2>
            <ul className="address-list">
              {addresses.map(addr => (
                <li key={addr.id} className="address-item">
                  {editingAddressId === addr.id ? (
                    <form className="address-form" onSubmit={(e) => { e.preventDefault(); handleAddressUpdate(addr.id); }}>
                      <input value={addressForm.fullName || ''} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} placeholder="Full Name"/>
                      <input value={addressForm.streetAddress || ''} onChange={e => setAddressForm({...addressForm, streetAddress: e.target.value})} placeholder="Street Address"/>
                      <div className="form-row">
                        <input value={addressForm.city || ''} onChange={e => setAddressForm({...addressForm, city: e.target.value})} placeholder="City"/>
                        <input value={addressForm.state || ''} onChange={e => setAddressForm({...addressForm, state: e.target.value})} placeholder="State"/>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">Save</button>
                        <button type="button" className="btn-secondary" onClick={() => setEditingAddressId(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="address-view">
                      <div>
                        <p className="address-name">{addr.fullName}</p>
                        <p className="address-details">{addr.streetAddress}, {addr.city}, {addr.state}</p>
                      </div>
                      <div className="address-actions">
                        <button onClick={() => startEditingAddress(addr)}>Edit</button>
                        <button onClick={() => handleAddressDelete(addr.id)} className="btn-delete">Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section ref={sections.orders} className="profile-section">
            <h2 className="section-title">My Orders</h2>
            <div className="order-history-list">
              {orders.length > 0 ? (
                orders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-summary">
                      <div>
                        <p className="order-id">Order #{order.id}</p>
                        <p className="order-date">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="order-total">₹{order.totalPrice}</p>
                      <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                    </div>
                    <div className="order-details">
                      <p><strong>Items:</strong> {order.items.map(item => item.Product.name).join(', ')}</p>
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="cancel-order-btn"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p>You haven't placed any orders yet.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
