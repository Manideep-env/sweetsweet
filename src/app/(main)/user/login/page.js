// src/app/user/login/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/'); // Redirect to homepage or user dashboard
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto mt-10 shadow-lg rounded-lg">
      <h1 className="text-2xl mb-4 font-bold text-center">User Login</h1>
      <form onSubmit={handleLogin}>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
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
