'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './profile.css';

export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // State for editing modes
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // State for form inputs
  const [profileForm, setProfileForm] = useState({ fullName: '' });
  const [addressForm, setAddressForm] = useState({});

  const fetchProfileData = () => {
    fetch('/api/user/profile')
      .then(res => res.ok ? res.json() : Promise.reject('Not authenticated'))
      .then(data => {
        setUserData(data.user);
        setAddresses(data.addresses);
        setProfileForm({ fullName: data.user.fullName });
        setIsLoading(false);
      })
      .catch(() => router.push('/user/login'));
  };

  useEffect(() => {
    fetchProfileData();
  }, [router]);

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
      fetchProfileData(); // Refresh data
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
        fetchProfileData(); // Refresh data
    } else {
        alert('Failed to update address.');
    }
  };

  const handleAddressDelete = async (addressId) => {
    if (confirm('Are you sure you want to delete this address?')) {
        const res = await fetch(`/api/user/addresses/${addressId}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Address deleted.');
            fetchProfileData(); // Refresh data
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

  if (isLoading) return <div className="profile-container">Loading...</div>;

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      
      <div className="profile-section">
        <h2>Account Details</h2>
        {isEditingProfile ? (
          <form onSubmit={handleProfileUpdate} className="profile-form">
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
            />
            <div className="form-actions">
              <button type="submit">Save</button>
              <button type="button" onClick={() => setIsEditingProfile(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <p><strong>Full Name:</strong> {userData.fullName}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <button className="edit-btn" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>
          </>
        )}
      </div>

      <div className="profile-section">
        <h2>Saved Addresses</h2>
        <ul className="address-list">
          {addresses.map(addr => (
            <li key={addr.id} className="address-item">
              {editingAddressId === addr.id ? (
                <div className="address-form">
                    <input value={addressForm.streetAddress} onChange={e => setAddressForm({...addressForm, streetAddress: e.target.value})} placeholder="Street"/>
                    <input value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} placeholder="City"/>
                    {/* Add other fields as needed */}
                    <div className="form-actions">
                        <button onClick={() => handleAddressUpdate(addr.id)}>Save</button>
                        <button onClick={() => setEditingAddressId(null)}>Cancel</button>
                    </div>
                </div>
              ) : (
                <>
                  <p>{addr.streetAddress}, {addr.city}, {addr.state}</p>
                  <div className="address-actions">
                    <button onClick={() => startEditingAddress(addr)}>Edit</button>
                    <button onClick={() => handleAddressDelete(addr.id)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="profile-section">
        <button onClick={userLogout} className="logout-button">Logout</button>
      </div>
    </div>
  );
}
