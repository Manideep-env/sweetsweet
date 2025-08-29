'use client';

import { useState } from 'react';
import './invoice.css';

export default function InvoicePage() {
const [orderId, setOrderId] = useState('');
const [order, setOrder] = useState(null);

const fetchOrder = async (e) => {
    e.preventDefault();
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
    // Injecting styles directly for the print window
 printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .invoice-box { border: 1px solid #eee; padding: 20px; }
        h3, h4 { margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .invoice-header { text-align: center; margin-bottom: 20px; }
        .total { text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 20px;}
      </style>
    `);
printWindow.document.write('</head><body>');
 printWindow.document.write(printContents);
 printWindow.document.write('</body></html>');
printWindow.document.close();
printWindow.focus();
printWindow.print();
printWindow.close();
};

return (
<div className="page-container">
      <div className="form-container">
        <h2>Generate Invoice</h2>
        <form onSubmit={fetchOrder} className="invoice-form">
          <input
            type="text"
            placeholder="Enter Order ID to generate invoice"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button type="submit">Fetch Order</button>
        </form>
      </div>

{order && (
<div className="invoice-preview-container">
<div id="invoice-area" className="invoice-box">
            <div className="invoice-header">
                <h3>Invoice</h3>
                <p><strong>Order ID:</strong> #{order.id}</p>
            </div>
            <div className="customer-details">
                <p><strong>Billed To:</strong> {order.User?.fullName || order.customerName}</p>
                <p><strong>Phone:</strong> {order.Address?.phoneNumber || order.phoneNumber}</p>
                <p><strong>Shipping Address:</strong> {order.Address ? `${order.Address.streetAddress}, ${order.Address.city}` : order.address}</p>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
<table className="invoice-table">
<thead>
 <tr>
 <th>Product</th><th>Qty/Wt</th><th>Unit Price</th><th>Total</th>
</tr>
 </thead>
<tbody>
{order.items.map(item => (
<tr key={item.id}>
<td>{item.Product.name}</td>
 <td>{item.quantity || `${item.weight} kg`}</td>
<td>₹{item.pricePerUnit || item.pricePerKg}</td>
 <td>₹{item.totalPrice}</td>
</tr>
))}
</tbody>
</table>
            <div className="total">
                <p><strong>Total: ₹{order.totalPrice}</strong></p>
            </div>
</div>
 <button className="print-btn" onClick={downloadPDF}>Download as PDF</button>
</div>
 )}
 </div>
);
}