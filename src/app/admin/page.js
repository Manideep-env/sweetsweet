'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminPanel() {
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get('/api/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      }
    }

    fetchStats();
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders Today" value={stats.totalOrdersToday} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} />
        <StatCard title="Total Sweets" value={stats.totalProducts} />
        <StatCard title="Total Categories" value={stats.totalCategories} />
      </div>
    </main>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-4 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
