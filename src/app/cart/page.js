'use client';

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import './cart.css';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, storeSlug } = useCart();
  const router = useRouter();
  
  const [total, setTotal] = useState(0);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [customization, setCustomization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
  });
  
  // Effect to fetch all necessary data on component mount or when storeSlug changes
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      if (storeSlug) {
        // Fetch theme settings
        fetch(`/api/store/${storeSlug}/customization`)
          .then(res => res.ok ? res.json() : null)
          .then(setCustomization);
      }

      // Fetch user and address data
      try {
        const userRes = await fetch('/api/user/verify');
        if (!userRes.ok) throw new Error('Not logged in');
        const userData = await userRes.json();
        
        setIsUserLoggedIn(true);
        setForm(prev => ({ ...prev, fullName: userData.fullName || '' }));

        const addrRes = await fetch('/api/user/addresses');
        const addresses = await addrRes.json();
        
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
          setSelectedAddressId(defaultAddress.id.toString());
          setShowNewAddressForm(false);
        } else {
          setShowNewAddressForm(true);
        }
      } catch (error) {
        setIsUserLoggedIn(false);
        setShowNewAddressForm(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [storeSlug]);

  // Effect to apply the theme's background color to the entire page
  useEffect(() => {
    if (customization) {
      document.body.style.backgroundColor = customization.backgroundColor;
    }
    return () => {
      document.body.style.backgroundColor = ''; // Reset on unmount
    };
  }, [customization]);

  // Effect to recalculate the cart total
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => {
      const price = parseFloat(item.pricePerKg ?? item.pricePerUnit ?? 0);
      const amount = parseFloat(item.weight ?? item.quantity ?? 0);
      return sum + (price * amount);
    }, 0);
    setTotal(newTotal);
  }, [cart]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
    });
    if (res.ok) {
        alert('Address saved successfully!');
        // Refetch data to update the address list
        const addrRes = await fetch('/api/user/addresses');
        const addresses = await addrRes.json();
        setSavedAddresses(addresses);
        const newAddress = await res.json();
        setSelectedAddressId(newAddress.id.toString());
        setShowNewAddressForm(false);
    } else {
        alert('Failed to save address.');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!storeSlug) return alert("Store information is missing.");

    let orderPayload = {
        items: cart.map(item => ({ 
            productId: item.id, slug: item.slug, 
            quantity: item.quantity, weight: item.weight 
        })),
        storeSlug: storeSlug,
    };

    if (isUserLoggedIn && !showNewAddressForm && selectedAddressId) {
        orderPayload.shippingAddressId = parseInt(selectedAddressId, 10);
    } else {
        orderPayload.shippingAddress = form;
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Order placed successfully! Order ID: ${data.orderId}`);
      clearCart();
      router.push(`/${storeSlug}`);
    } else {
      const data = await res.json();
      alert(`Error: ${data.error || 'Could not place order.'}`);
    }
  };

  const pageStyles = customization ? {
    '--store-primary-color': customization.primaryColor,
  } : {};

  if (isLoading) {
    return <div className="loading-state">Loading Cart...</div>;
  }

  return (
    <div className="page-container" style={pageStyles}>
      <div className="cart-layout">
        <main className="cart-items-section">
          <h1 className="main-title">Your Cart</h1>
          {cart.length === 0 ? (
            <p>Your cart is empty. <Link href={storeSlug ? `/${storeSlug}` : '/'} className="continue-shopping">Continue Shopping</Link></p>
          ) : (
            <>
              <table className="cart-table">
                <thead>
                  <tr>
                    <th className="th-product">Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => {
                    const unitPrice = parseFloat(item.pricePerKg ?? item.pricePerUnit ?? 0);
                    const amount = parseFloat(item.weight ?? item.quantity ?? 0);
                    const itemTotal = unitPrice * amount;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="product-info-cell">
                            <img src={item.image || '/no-image.jpg'} alt={item.name} />
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td>{item.weight ? `${item.weight} kg` : item.quantity}</td>
                        <td>₹{unitPrice.toFixed(2)}</td>
                        <td>₹{itemTotal.toFixed(2)}</td>
                        <td>
                          <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✖</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="cart-total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </>
          )}
        </main>
        
        {cart.length > 0 && (
          <aside className="checkout-sidebar">
            <h2 className="sidebar-title">Checkout</h2>
            <form className="checkout-form" onSubmit={handleCheckout}>
              {isUserLoggedIn && savedAddresses.length > 0 && (
                <div className="address-management">
                  <label>Shipping Address</label>
                  <div className="address-controls">
                    <select value={selectedAddressId} onChange={(e) => {
                        setSelectedAddressId(e.target.value);
                        setShowNewAddressForm(e.target.value === 'new');
                    }}>
                      {savedAddresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.streetAddress}, {addr.city}
                        </option>
                      ))}
                      <option value="new">+ Add New Address</option>
                    </select>
                  </div>
                </div>
              )}

              {(showNewAddressForm || !isUserLoggedIn) && (
                <div className="address-form">
                  <h3>{isUserLoggedIn ? 'Add New Address' : 'Shipping Details'}</h3>
                  <input name="fullName" value={form.fullName} placeholder="Full Name" onChange={handleChange} required />
                  <input name="phoneNumber" value={form.phoneNumber} placeholder="Phone Number" type="tel" onChange={handleChange} required />
                  <input name="streetAddress" value={form.streetAddress} placeholder="Street Address" onChange={handleChange} required />
                  <div className="form-row">
                    <input name="city" value={form.city} placeholder="City" onChange={handleChange} required />
                    <input name="state" value={form.state} placeholder="State" onChange={handleChange} required />
                  </div>
                  <input name="postalCode" value={form.postalCode} placeholder="Postal Code" onChange={handleChange} required />
                  
                  {isUserLoggedIn && (
                    <button type="button" className="save-address-btn" onClick={handleAddNewAddress}>Save Address</button>
                  )}
                </div>
              )}
              
              <button type="submit" className="checkout-btn">Place Order</button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
