'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import './order-detail.css';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (id) {
      fetch(`/api/admin/orders/${id}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data);
          setStatus(data.status);
        })
        .catch(err => console.error('Error fetching order:', err));
    }
  }, [id]);

  const handleStatusUpdate = async () => {
    // ... your existing status update logic ...
  };
  
  const formatAddress = (addr) => {
    if (!addr) return "No address details available.";
    return `${addr.streetAddress}, ${addr.city}, ${addr.state} - ${addr.postalCode}`;
  }

  if (!order) return <div>Loading...</div>;

  return (
    <div className="order-detail-container">
      <h2>Order #{order.id} Details</h2>
      
      <div className="customer-details">
        <h3>Customer Information</h3>
        {/* Use data from associated User and Address models */}
        <p><strong>Customer:</strong> {order.User?.fullName || order.customerName || 'Guest'}</p>
        <p><strong>Email:</strong> {order.User?.email || 'N/A'}</p>
        <p><strong>Phone:</strong> {order.Address?.phoneNumber || order.phoneNumber}</p>
        <p><strong>Shipping Address:</strong> {formatAddress(order.Address)}</p>
      </div>
      
      <div className="order-summary">
        <h3>Order Summary</h3>
        <p><strong>Total Price:</strong> ₹{order.totalPrice}</p>
        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        <div className="status-section">
          <label htmlFor="status"><strong>Status:</strong></label>
          <select id="status" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={handleStatusUpdate}>Update Status</button>
        </div>
      </div>

      <h3>Items Ordered</h3>
      <table className="order-table"><thead>

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

        </tbody></table>
    </div>
  );
}
