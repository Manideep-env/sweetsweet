'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch('/api/product');
      const data = await res.json();
      setProducts(data);
    }
    fetchProducts();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Our Products</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link href={`/product/${product.slug}`} key={product.id}>
            <div className="border rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer">
              <img
                src={product.image || '/no-image.jpg'}
                alt={product.name}
                className="w-full h-40 object-cover rounded"
              />
              <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
              <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>

              {/* Dynamic Price Display */}
              <p className="text-md mt-1">
                {product.discountedPrice ? (
  <>
    <span className="line-through text-gray-500">₹{product.price}</span>{' '}
    <span className="text-green-600 font-bold">₹{product.discountedPrice.toFixed(2)}</span>
  </>
) : (
  <>₹{product.price}</>
)}

              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
