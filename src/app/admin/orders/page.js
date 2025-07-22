'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './orders.css'; // This will contain your shared styles

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [discountMap, setDiscountMap] = useState({});
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

    fetch('/api/admin/order-discounts')
      .then(res => res.json())
      .then(data => setDiscountMap(data))
      .catch(err => console.error('Error fetching order-discounts:', err));
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchId(value);
    if (value === '') {
      setFilteredOrders(orders);
    } else {
      const id = parseInt(value);
      if (!isNaN(id)) {
        setFilteredOrders(orders.filter(order => order.id === id));
      }
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
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #999',
            borderRadius: '6px',
            outline: 'none',
          }}
        />
      </div>

      <table className="products-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Sweets Ordered</th>
            <th>Weight</th>
            <th>Total Price</th>
            <th>Date</th>
            <th>Status</th>
            <th>Discount IDs</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id} className="clickable-row" onClick={() => handleRowClick(order.id)}>
              <td>{order.id}</td>
              <td>{order.customerName}</td>
              <td>{order.phoneNumber}</td>
              <td>
                {(order.items || []).map(i => i.Product?.name).join(', ') || '—'}
              </td>
              <td>
                {(order.items || []).map(i => i.weight ? `${i.weight}kg` : '').filter(Boolean).join(', ') || '—'}
              </td>
              <td>₹{order.totalPrice}</td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
              <td>
  <button
    onClick={async (e) => {
      e.stopPropagation();
      try {
        const res = await fetch(`/api/admin/orders/${order.id}/status`, { method: 'PUT' });
        const data = await res.json();
        if (data.success) {
          // Update local state
          setOrders(prev =>
            prev.map(o =>
              o.id === order.id ? { ...o, status: data.status } : o
            )
          );
          setFilteredOrders(prev =>
            prev.map(o =>
              o.id === order.id ? { ...o, status: data.status } : o
            )
          );
        }
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }}
    style={{
      padding: '0.3rem 0.6rem',
      borderRadius: '5px',
      backgroundColor: order.status === 'Pending' ? '#facc15' : '#4ade80',
      color: '#000',
      fontWeight: 500,
      border: 'none',
      cursor: 'pointer',
    }}
  >
    {order.status}
  </button>
</td>

              <td>{(discountMap[order.id] || []).join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
