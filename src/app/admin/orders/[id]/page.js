'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import './order-detail.css';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setStatus(data.status);
      })
      .catch(err => console.error('Error fetching order:', err));
  }, [id]);

  const handleStatusUpdate = async () => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const result = await res.json();
    if (result.success) {
      alert('Status updated');
      setOrder(prev => ({ ...prev, status }));
    } else {
      alert('Failed to update status');
    }
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div className="order-detail-container">
      <h2>Order #{order.id} Details</h2>
      <p><strong>Customer:</strong> {order.customerName}</p>
      <p><strong>Phone:</strong> {order.phoneNumber}</p>
      <p><strong>Address:</strong> {order.address}</p>
      <p><strong>Total Price:</strong> ₹{order.totalPrice}</p>
      <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>

      <div className="status-section">
        <label htmlFor="status"><strong>Status:</strong></label>
        <select id="status" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
        </select>
        <button onClick={handleStatusUpdate}>Update</button>
      </div>

      <h3>Items:</h3>
      <table className="order-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Weight</th>
            <th>Price/kg</th>
            <th>Price/unit</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => (
            <tr key={idx}>
              <td>{item.Product?.name || 'Unknown'}</td>
              <td>{item.quantity || '-'}</td>
              <td>{item.weight ? `${item.weight} kg` : '-'}</td>
              <td>{item.pricePerKg ? `₹${item.pricePerKg}` : '-'}</td>
              <td>{item.pricePerUnit ? `₹${item.pricePerUnit}` : '-'}</td>
              <td>₹{item.totalPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
