// /app/admin/users/page.js
'use client';

import { useEffect, useState } from 'react';
import './users.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  return (
    <div className="admin-users-container">
      <h2>Customers</h2>
      <table className="admin-users-table">
        <thead>
          <tr>
            <th>Name</th><th>Phone</th><th>Address</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={index}>
              <td>{user.customerName}</td>
              <td>{user.phoneNumber}</td>
              <td>{user.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
