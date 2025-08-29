'use client';

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import './cart.css';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, storeSlug } = useCart();
  const router = useRouter();
  
  const [total, setTotal] = useState(0);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Updated form state to match the Address model
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
  });
  
  // This function fetches user status and their addresses
  const fetchUserAndAddresses = async () => {
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
        // Automatically select the default address or the first one
        const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
        setSelectedAddressId(defaultAddress.id.toString());
        setShowNewAddressForm(false); // Hide form if addresses exist
      } else {
        setShowNewAddressForm(true); // Show form if user has no saved addresses
      }
    } catch (error) {
      setIsUserLoggedIn(false);
      setShowNewAddressForm(true); // Always show form for guests
    }
  };

  useEffect(() => {
    fetchUserAndAddresses();
  }, []);

  // Recalculates total when the cart changes
  useEffect(() => {
    const totalPrice = cart.reduce((sum, item) => {
      let itemTotal = 0;
      if (item.weight && item.pricePerKg) {
        itemTotal = parseFloat(item.weight) * parseFloat(item.pricePerKg);
      } else if (item.quantity && item.pricePerUnit) {
        itemTotal = parseInt(item.quantity) * parseFloat(item.pricePerUnit);
      }
      return sum + itemTotal;
    }, 0);
    setTotal(totalPrice);
  }, [cart]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handles saving a new address for a logged-in user
  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
    });

    if (res.ok) {
        alert('Address saved successfully!');
        // After saving, refetch addresses to update the dropdown
        fetchUserAndAddresses();
    } else {
        alert('Failed to save address. Please check all fields.');
    }
  };

  // Handles the final order submission
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!storeSlug) {
      alert("Error: Store information is missing.");
      return;
    }

    let orderPayload = {
        items: cart.map(item => ({ 
            productId: item.id,
            slug: item.slug, 
            quantity: item.quantity, 
            weight: item.weight 
        })),
        storeSlug: storeSlug,
    };

    // If logged in and using a saved address, send the ID
    if (isUserLoggedIn && !showNewAddressForm && selectedAddressId) {
        orderPayload.shippingAddressId = parseInt(selectedAddressId, 10);
    } else {
    // Otherwise, send the full address object from the form
        orderPayload.shippingAddress = form;
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Order placed successfully! Your Order ID is: ${data.orderId}`);
      clearCart();
      router.push(`/${storeSlug}`);
    } else {
      const data = await res.json();
      alert(`Error: ${data.error || 'Could not place order.'}`);
    }
  };

  const cartTable = (
    <table className="cart-table">
        <thead>
            <tr>
                <th>Item</th><th>Qty</th><th>Price</th><th>Total</th><th>Action</th>
            </tr>
        </thead>
        <tbody>
            {cart.map((item) => {
                let unitPrice = parseFloat(item.pricePerKg ?? item.pricePerUnit ?? 0);
                let itemTotal = 0;
                if (item.weight && item.pricePerKg) {
                    itemTotal = parseFloat(item.weight) * unitPrice;
                } else if (item.quantity && item.pricePerUnit) {
                    itemTotal = parseInt(item.quantity) * unitPrice;
                }
                return (
                    <tr key={item.id}>
                        <td>{item.name}</td>
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
  );

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cartTable}
          <div className="cart-summary"><h3>Total: ₹{total.toFixed(2)}</h3></div>

          <h2>Shipping Details</h2>
          <form className="checkout-form" onSubmit={handleCheckout}>
            {isUserLoggedIn && savedAddresses.length > 0 && (
              <div className="address-management">
                <div className="address-selector">
                  <label>Select Address:</label>
                  <select value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                    {savedAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.streetAddress}, {addr.city} {addr.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" className="toggle-address-form-btn" onClick={() => setShowNewAddressForm(!showNewAddressForm)}>
                  {showNewAddressForm ? 'Cancel' : 'Add New Address'}
                </button>
              </div>
            )}

            {showNewAddressForm && (
              <div className="new-address-form">
                <h3>{isUserLoggedIn ? 'Add a New Address' : 'Enter Shipping Details'}</h3>
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
            
            {/* Show place order button if not currently adding a new address OR if user is a guest */}
            {(!showNewAddressForm || !isUserLoggedIn) && (
              <button type="submit" className="checkout-btn">Place Order</button>
            )}
          </form>
        </>
      )}
    </div>
  );
}
