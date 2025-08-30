'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import './orders.css';

// Helper function to get nested property values safely
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchId, setSearchId] = useState('');
  // State to manage sorting configuration { key: 'columnName', direction: 'ascending' | 'descending' }
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
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

  // Function to request a sort on a specific column
  const requestSort = (key) => {
    let direction = 'ascending';
    // If sorting the same column, toggle the direction
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // useMemo will re-calculate the sorted orders only when the dependencies (filteredOrders or sortConfig) change
  const sortedOrders = useMemo(() => {
    let sortableItems = [...filteredOrders];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        // Handle null or undefined values to prevent errors
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Comparison logic based on data type
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        } else if (sortConfig.key === 'createdAt') {
            comparison = new Date(aValue) - new Date(bValue);
        } else {
            comparison = aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true });
        }
        
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [filteredOrders, sortConfig]);
  
  // Helper to get the CSS class for sortable headers
  const getSortableHeaderClass = (key) => {
      return `sortable-header ${sortConfig.key === key ? 'sorted' : ''}`;
  }
  
  // Helper to get the visual indicator for the sorted column
  const getSortIndicator = (key) => {
      if (sortConfig.key !== key) return null;
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  }


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
            <th className={getSortableHeaderClass('id')} onClick={() => requestSort('id')}>
              Order ID{getSortIndicator('id')}
            </th>
            <th className={getSortableHeaderClass('User.fullName')} onClick={() => requestSort('User.fullName')}>
              Customer{getSortIndicator('User.fullName')}
            </th>
             <th className={getSortableHeaderClass('Address.phoneNumber')} onClick={() => requestSort('Address.phoneNumber')}>
               Contact{getSortIndicator('Address.phoneNumber')}
            </th>
            <th className={getSortableHeaderClass('Address.city')} onClick={() => requestSort('Address.city')}>
              Shipping To{getSortIndicator('Address.city')}
            </th>
            <th className={getSortableHeaderClass('totalPrice')} onClick={() => requestSort('totalPrice')}>
              Total Price{getSortIndicator('totalPrice')}
            </th>
            <th className={getSortableHeaderClass('createdAt')} onClick={() => requestSort('createdAt')}>
              Date{getSortIndicator('createdAt')}
            </th>
            <th className={getSortableHeaderClass('status')} onClick={() => requestSort('status')}>
              Status{getSortIndicator('status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map(order => (
            <tr key={order.id} className="clickable-row" onClick={() => handleRowClick(order.id)}>
              <td>{order.id}</td>
              <td>{order.User?.fullName || order.customerName || 'Guest'}</td>
              <td>{order.Address?.phoneNumber || order.phoneNumber}</td>
              <td>{order.Address ? `${order.Address.city}, ${order.Address.state}` : 'N/A'}</td>
              <td>₹{order.totalPrice}</td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
              <td>
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
