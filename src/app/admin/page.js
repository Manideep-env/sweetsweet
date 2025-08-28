'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

// StatCard component remains the same
function StatCard({ title, value }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-4 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

// Main AdminPanel Component
export default function AdminPanel() {
  const [stats, setStats] = useState({ /* ...initial stats */ });
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // useEffect for stats remains the same
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setPrompt('');

    try {
      // UPDATED: No more sellerId. The auth cookie is sent automatically.
      const res = await axios.post('/api/chat', { 
        messages: [...messages, userMessage] 
      });
      setMessages((prev) => [...prev, res.data.response]);
    } catch (err) {
      console.error("Error communicating with AI", err);
      const errorMessage = { role: 'assistant', content: 'Sorry, I ran into an error.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders Today" value={stats.totalOrdersToday} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} />
        <StatCard title="Total Sweets" value={stats.totalProducts} />
        <StatCard title="Total Categories" value={stats.totalCategories} />
      </div>

      {/* AI Chat Assistant Section */}
      <div className="mt-8 bg-white shadow-md rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-2">AI Assistant 🤖</h2>
        <div className="h-64 overflow-y-auto border rounded-lg p-2 mb-2">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                {msg.content}
              </span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder="Ask a question about your store..."
            disabled={isLoading}
          />
        </form>
      </div>
    </main>
  );
}