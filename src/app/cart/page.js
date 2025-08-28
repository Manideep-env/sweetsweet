'use client';

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import './cart.css';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, storeSlug } = useCart();
  const router = useRouter();
  
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    street: '', apartment: '', landmark: '',
    city: '', state: '', zip: '', country: '',
  });

  useEffect(() => {
    const totalPrice = cart.reduce((sum, item) => {
      let itemTotal = 0;
      // ✅ FIX 1: Ensure prices are numbers before multiplication
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

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!storeSlug) {
      alert("Error: Store information is missing. Please add an item to your cart first.");
      return;
    }

    const customerName = `${form.firstName} ${form.lastName}`;
    const address = `${form.street}, ${form.apartment || ''}, ${form.landmark || ''}, ${form.city}, ${form.state} - ${form.zip}, ${form.country}`;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        phoneNumber: form.phone,
        address,
        items: cart.map(item => ({ 
            productId: item.id,
            slug: item.slug, 
            quantity: item.quantity, 
            weight: item.weight 
        })),
        storeSlug: storeSlug,
      }),
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

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Item</th><th>Qty</th><th>Price</th><th>Total</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => {
                // ✅ FIX 2: Convert the unit price to a number immediately
                let unitPrice = parseFloat(item.pricePerKg ?? item.pricePerUnit ?? 0);
                
                let itemTotal = 0;
                if (item.weight && item.pricePerKg) {
                  itemTotal = parseFloat(item.weight) * parseFloat(item.pricePerKg);
                } else if (item.quantity && item.pricePerUnit) {
                  itemTotal = parseInt(item.quantity) * parseFloat(item.pricePerUnit);
                }

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="cart-item-info">
                        <img src={item.image || '/no-image.jpg'} alt={item.name} />
                        <div>
                          <strong>{item.name}</strong>
                          <p>{item.category?.name || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.weight ? `${item.weight} kg` : item.quantity}
                    </td>
                    <td>
                      {/* This will now work correctly */}
                      ₹{unitPrice.toFixed(2)}
                    </td>
                    <td>₹{itemTotal.toFixed(2)}</td>
                    <td>
                      <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✖</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="cart-summary">
            <h3>Total: ₹{total.toFixed(2)}</h3>
          </div>

          <h2>Shipping Details</h2>
          <form className="checkout-form" onSubmit={handleCheckout}>
             {/* Form inputs remain the same */}
            <div className="form-row">
              <input name="firstName" placeholder="First Name" onChange={handleChange} required />
              <input name="lastName" placeholder="Last Name" onChange={handleChange} required />
            </div>
            <div className="form-row">
              <input name="phone" placeholder="Phone" type="tel" onChange={handleChange} required />
            </div>
            <input name="street" placeholder="Street Address" onChange={handleChange} required />
            <input name="apartment" placeholder="Apartment/Suite" onChange={handleChange} />
            <input name="landmark" placeholder="Landmark" onChange={handleChange} />
            <div className="form-row">
              <input name="city" placeholder="City" onChange={handleChange} required />
              <input name="state" placeholder="State" onChange={handleChange} required />
            </div>
            <div className="form-row">
              <input name="zip" placeholder="Zip Code" onChange={handleChange} required />
              <input name="country" placeholder="Country" onChange={handleChange} required />
            </div>
            <button type="submit" className="checkout-btn">Place Order</button>
          </form>
        </>
      )}
    </div>
  );
}