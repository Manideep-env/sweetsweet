'use client';

import { useEffect, useState } from 'react';
import './cart.css';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    street: '', apartment: '', landmark: '',
    city: '', state: '', zip: '', country: '',
  });

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cart')) || [];

    // Ensure prices and weights are numbers
    const parsedItems = items.map((item) => ({
      ...item,
      pricePerKg: item.pricePerKg ? parseFloat(item.pricePerKg) : null,
      pricePerUnit: item.pricePerUnit ? parseFloat(item.pricePerUnit) : null,
      weight: item.weight ? parseFloat(item.weight) : null,
      quantity: item.quantity ? parseInt(item.quantity) : 1,
    }));

    setCartItems(parsedItems);
  }, []);

  useEffect(() => {
    const totalPrice = cartItems.reduce((sum, item) => {
      let itemTotal = 0;

      if (item.weight && item.pricePerKg) {
        itemTotal = item.weight * item.pricePerKg;
      } else if (item.quantity && item.pricePerUnit) {
        itemTotal = item.quantity * item.pricePerUnit;
      }

      return sum + itemTotal;
    }, 0);

    setTotal(totalPrice);
  }, [cartItems]);

  const updateQuantity = (slug, delta) => {
    const updated = cartItems.map(item =>
      item.slug === slug
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (slug) => {
    const updated = cartItems.filter(item => item.slug !== slug);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckout = async () => {
    const customerName = `${form.firstName} ${form.lastName}`;
    const address = `${form.street}, ${form.apartment || ''}, ${form.landmark || ''}, ${form.city}, ${form.state} - ${form.zip}, ${form.country}`;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        phoneNumber: form.phone,
        address,
        items: cartItems.map((item) => ({
          productId: item.id,
          slug: item.slug,
          weight: item.weight,
          quantity: item.quantity,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Order placed successfully! ID: ${data.orderId}`);
      localStorage.removeItem('cart');
      setCartItems([]);
    } else {
      const errorData = await res.json();
      alert(`Error: ${errorData.error}`);
    }
  };

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>

      {cartItems.length === 0 ? (
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
              {cartItems.map((item, index) => {
                let unitLabel = '';
                let unitPrice = 0;
                let itemTotal = 0;

                if (item.weight && item.pricePerKg) {
                  unitLabel = `${item.weight}kg`;
                  unitPrice = item.pricePerKg;
                  itemTotal = item.weight * item.pricePerKg;
                } else if (item.quantity && item.pricePerUnit) {
                  unitLabel = `${item.quantity} pcs`;
                  unitPrice = item.pricePerUnit;
                  itemTotal = item.quantity * item.pricePerUnit;
                }

                return (
                  <tr key={`${item.slug}-${index}`}>
                    <td>
                      <div className="cart-item-info">
                        <img src={`/${item.image}`} alt={item.title} />
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.weight && item.pricePerKg ? (
                        <span>{item.weight} kg</span>
                      ) : (
                        <div className="quantity-controls">
                          <button onClick={() => updateQuantity(item.slug, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.slug, 1)}>+</button>
                        </div>
                      )}
                    </td>
                    <td>₹{unitPrice.toFixed(2)}</td>
                    <td>₹{itemTotal.toFixed(2)}</td>
                    <td>
                      <button className="remove-btn" onClick={() => removeItem(item.slug)}>✖</button>
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
          <form
            className="checkout-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleCheckout();
            }}
          >
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
