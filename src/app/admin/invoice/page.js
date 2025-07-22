'use client';

import { useState } from 'react';
import './invoice.css';

export default function InvoicePage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    const res = await fetch(`/api/admin/invoice/${orderId}`);
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      setOrder(null);
    } else {
      setOrder(data);
    }
  };

  const downloadPDF = () => {
    const printContents = document.getElementById('invoice-area').innerHTML;
    const printWindow = window.open('', '', 'height=800,width=600');
    printWindow.document.write('<html><head><title>Invoice</title>');
    printWindow.document.write('<style>body{font-family: Arial;} table{width: 100%; border-collapse: collapse;} th, td{border: 1px solid #ccc; padding: 6px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="invoice-container">
      <h2>Generate Invoice</h2>
      <div className="invoice-input">
        <input
          type="text"
          placeholder="Enter Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <button onClick={fetchOrder}>Fetch</button>
      </div>

      {order && (
        <div>
          <div id="invoice-area" className="invoice-box">
            <h3>Invoice</h3>
            <p><strong>Order ID:</strong> #{order.id}</p>
            <p><strong>Name:</strong> {order.customerName}</p>
            <p><strong>Phone:</strong> {order.phoneNumber}</p>
            <p><strong>Address:</strong> {order.address}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>

            <h4>Items</h4>
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Qty/Wt</th><th>Unit Price</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.Product.name}</td>
                    <td>{item.quantity || item.weight}</td>
                    <td>₹{item.pricePerUnit || item.pricePerKg}</td>
                    <td>₹{item.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p><strong>Discounts:</strong> {order.Discounts?.map(d => `#${d.id} (${d.percentage}%)`).join(', ') || '-'}</p>
            <h4>Total: ₹{order.totalPrice}</h4>
          </div>

          <button className="print-btn" onClick={downloadPDF}>Download as PDF</button>
        </div>
      )}
    </div>
  );
}
