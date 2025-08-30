//app/page.js

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SaaSPlatformLandingPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch('/api/stores');
        const data = await res.json();
        setStores(data);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Welcome to InstantB2C</h1>
        <p className="text-lg text-gray-600">Your one-stop platform for the best local stores.</p>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">Available Stores</h2>
        {loading ? (
          <p className="text-center">Loading stores...</p>
        ) : stores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Link
                key={store.storeSlug}
                href={`/${store.storeSlug}`}
                className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 transition-colors"
              >
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                  {store.storeName}
                </h5>
                <p className="font-normal text-blue-600">
                  Visit Store →
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No stores are available at the moment.</p>
        )}
      </div>
    </main>
  );
}