'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import './categories.css'; // optional custom styles

export default function CategoriesPage() {
  // --- State for data, loading, and errors ---
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Hooks to get URL parameters ---
  const params = useParams();
  const searchParams = useSearchParams();
  
  const storeSlug = params.slug; // Get the store's slug from the main URL path
  const categoryFromQuery = searchParams.get('category'); // Get pre-selected category from query

  // --- Data fetching effect ---
  useEffect(() => {
    // Don't fetch if we don't have the store slug yet
    if (!storeSlug) return;

    async function fetchStoreData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch categories and products specific to the store slug
        const [categoryRes, productRes] = await Promise.all([
          fetch(`/api/store/${storeSlug}/categories`),
          fetch(`/api/store/${storeSlug}/products`)
        ]);

        if (!productRes.ok || !categoryRes.ok) {
          throw new Error(`Could not find data for store: ${storeSlug}`);
        }

        const categoryData = await categoryRes.json();
        const productData = await productRes.json();

        setCategories(categoryData);
        setProducts(productData);

      } catch (err) {
        console.error("Failed to fetch store data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStoreData();
  }, [storeSlug]); // Re-run this effect if the store slug changes

  // --- Effect to set the selected category from the URL query ---
  useEffect(() => {
    if (categoryFromQuery) {
      setSelectedCategory(categoryFromQuery);
    } else {
      setSelectedCategory('All'); // Default to 'All' if no query
    }
  }, [categoryFromQuery]);

  // --- Filtering logic (remains the same) ---
  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter(
          (prod) => prod.category?.name === selectedCategory
        );

  // --- Render states ---
  if (loading) {
    return <div className="p-6 text-center">Loading products...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600 font-semibold">{error}</div>;
  }

  return (
    <div className="flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 p-4 border-b md:border-r md:border-b-0">
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <ul className="space-y-2">
          <li
            onClick={() => setSelectedCategory('All')}
            className={`cursor-pointer p-2 rounded ${
              selectedCategory === 'All' ? 'bg-green-100 font-bold' : 'hover:bg-gray-100'
            }`}
          >
            All
          </li>
          {categories.map((cat) => (
            <li
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`cursor-pointer p-2 rounded ${
                selectedCategory === cat.name ? 'bg-green-100 font-bold' : 'hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </li>
          ))}
        </ul>
      </aside>

      {/* Products */}
      <section className="w-full md:w-3/4 p-4">
        <h2 className="text-2xl font-semibold mb-4">
          {selectedCategory === 'All'
            ? 'All Products'
            : `${selectedCategory}`}
        </h2>

        {filteredProducts.length === 0 ? (
            <p>No products found in this category.</p>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
                // Determine the correct base price
                const basePrice = parseFloat(product.pricePerKg ?? product.pricePerUnit ?? 0);
                const discountedPrice = product.discountedPrice ? parseFloat(product.discountedPrice) : null;

                return (
                // ✅ KEY CHANGE: Link is now dynamic with the storeSlug
                <Link key={product.id} href={`/${storeSlug}/product/${product.slug}`}>
                    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
                    <img
                        src={product.image || '/no-image.jpg'}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded"
                    />
                    <div className="flex-grow mt-2 flex flex-col">
                        <h3 className="font-medium flex-grow">{product.name}</h3>
                        <p className="text-sm text-gray-500">
                        {product.category?.name}
                        </p>
                        <p className="mt-1 font-semibold">
                        {discountedPrice && discountedPrice < basePrice ? (
                            <>
                            <span className="line-through text-gray-400 mr-2">
                                ₹{basePrice.toFixed(2)}
                            </span>
                            <span className="text-green-600">
                                ₹{discountedPrice.toFixed(2)}
                            </span>
                            </>
                        ) : (
                            <>₹{basePrice.toFixed(2)}</>
                        )}
                        </p>
                    </div>
                    </div>
                </Link>
                );
            })}
            </div>
        )}
      </section>
    </div>
  );
}
