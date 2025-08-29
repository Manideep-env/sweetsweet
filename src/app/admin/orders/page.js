'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './orders.css';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchId, setSearchId] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
          setFilteredOrders(data);
        }
      })
      .catch(err => console.error('Error fetching orders:', err));
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchId(value);
    if (value === '') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.id.toString().includes(value)));
    }
  };

  const handleRowClick = (orderId) => {
    router.push(`/admin/orders/${orderId}`);
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <h2>All Orders</h2>
        <input
          type="text"
          placeholder="Search by Order ID"
          value={searchId}
          onChange={handleSearch}
          className="order-search-input"
        />
      </div>

      <table className="products-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Contact</th>
            <th>Shipping To</th>
            <th>Total Price</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id} className="clickable-row" onClick={() => handleRowClick(order.id)}>
              <td>{order.id}</td>
              {/* Display user's full name if available, otherwise the guest name */}
              <td>{order.User?.fullName || order.customerName || 'Guest'}</td>
              <td>{order.Address?.phoneNumber || order.phoneNumber}</td>
              <td>{order.Address ? `${order.Address.city}, ${order.Address.state}` : 'N/A'}</td>
              <td>₹{order.totalPrice}</td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
              <td>
                {/* Status button logic remains the same */}
                <button
                  onClick={(e) => e.stopPropagation() /* Prevent row click */}
                  className={`status-btn ${order.status.toLowerCase()}`}
                >
                  {order.status}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
