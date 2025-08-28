// src/app/login/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/admin'); // Redirect to the seller dashboard
    } else {
      const data = await res.json();
      alert(data.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto mt-10 shadow-lg rounded-lg">
      <h1 className="text-2xl mb-4 font-bold text-center">Seller Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="border p-2 w-full mb-4 rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="border p-2 w-full mb-4 rounded"
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 w-full rounded">
          Login
        </button>
      </form>
    </div>
  );
}