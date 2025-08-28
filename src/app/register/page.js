// src/app/register/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    const res = await fetch('/api/sellers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, storeName }),
    });

    if (res.ok) {
      alert('Registration successful! Please log in.');
      router.push('/login');
    } else {
      const data = await res.json();
      setError(data.message || 'Registration failed.');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto mt-10 shadow-lg rounded-lg">
      <h1 className="text-2xl mb-4 font-bold text-center">Create Your Store</h1>
      <form onSubmit={handleRegister}>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
          required
          className="border p-2 w-full mb-4 rounded"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          required
          className="border p-2 w-full mb-4 rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 characters)"
          required
          minLength="8"
          className="border p-2 w-full mb-4 rounded"
        />
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="Store Name (e.g., Jay's Sweet Shop)"
          required
          className="border p-2 w-full mb-4 rounded"
        />
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 w-full rounded">
          Register
        </button>
      </form>
    </div>
  );
}