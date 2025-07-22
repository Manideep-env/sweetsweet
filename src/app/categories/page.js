'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './categories.css'; // optional custom styles

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const searchParams = useSearchParams();
  const categoryFromQuery = searchParams.get('category');

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch('/api/category');
      const data = await res.json();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch('/api/product');
      const data = await res.json();
      setProducts(data);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    if (categoryFromQuery) {
      setSelectedCategory(categoryFromQuery);
    }
  }, [categoryFromQuery]);

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter(
          (prod) => prod.category?.name === selectedCategory
        );

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-1/4 p-4 border-r">
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <ul className="space-y-2">
          <li
            onClick={() => setSelectedCategory('All')}
            className={`cursor-pointer p-2 rounded ${
              selectedCategory === 'All' ? 'bg-green-100 font-bold' : ''
            }`}
          >
            All
          </li>
          {categories.map((cat) => (
            <li
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`cursor-pointer p-2 rounded ${
                selectedCategory === cat.name ? 'bg-green-100 font-bold' : ''
              }`}
            >
              {cat.name}
            </li>
          ))}
        </ul>
      </aside>

      {/* Products */}
      <section className="w-3/4 p-4">
        <h2 className="text-2xl font-semibold mb-4">
          {selectedCategory === 'All'
            ? 'All Products'
            : `${selectedCategory} Products`}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`}>
              <div className="border rounded-lg p-4 hover:shadow">
                <img
                  src={product.image || '/no-image.jpg'}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded"
                />
                <h3 className="mt-2 font-medium">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  {product.category?.name}
                </p>
                <p className="mt-1">
                  {product.discountedPrice ? (
                    <>
                      <span className="line-through text-gray-400 mr-1">
                        ₹{product.price}
                      </span>
                      <span className="text-green-600 font-semibold">
                        ₹{product.discountedPrice.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <>₹{product.price}</>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
