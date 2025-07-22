'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './homepage.css';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});

  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch('/api/product');
      const data = await res.json();
      setProducts(data);

      const shuffled = [...data].sort(() => 0.5 - Math.random());
      setFeatured(shuffled.slice(0, 10));

      const byCat = {};
      data.forEach((product) => {
        const catName = product.category?.name || 'Uncategorized';
        if (!byCat[catName]) byCat[catName] = [];
        byCat[catName].push(product);
      });
      setProductsByCategory(byCat);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch('/api/category');
      const data = await res.json();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  const handleOrderNow = (product) => {
    router.push(`/product/${product.slug}`);
  };

  const handleLeft = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleRight = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, featured.length - 4));
  };

  return (
    <main className="home-container">
      {/* BANNER */}
      <div className="banner"><img src={'/image.png'}  className="banner-img" /></div>

      {/* FEATURED SECTION */}
      <div className="featured-section">
        <div className="carousel-container">
          <button onClick={handleLeft} className="carousel-btn">‹</button>
          <div className="carousel-track">
            {featured.slice(currentIndex, currentIndex + 4).map((product, index) => {
  const bgColors = ['#FECACA', '#FED7AA', '#BBF7D0', '#DDD6FE']; // pastel pink, orange, green, violet
  const bgColor = bgColors[index % bgColors.length];

  return (
    <div
      key={product.id}
      className="carousel-card-custom"
      style={{ backgroundColor: bgColor }}
    >
      <div className="img-wrapper">
        <img src={product.image || '/no-image.jpg'} alt={product.name} className="circle-img" />
        <div className="badge-dot"></div>
      </div>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">₹{Number(product.discountedPrice ?? product.price).toFixed(2)}</p>
      <button
        className="order-now-btn"
        onClick={() => handleOrderNow(product)}
      >
        Order Now <span className="arrow">&gt;</span>
      </button>
    </div>
  );
})}

          </div>
          <button onClick={handleRight} className="carousel-btn">›</button>
        </div>
      </div>

      {/* CATEGORIES LIST */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Our Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="border rounded-xl shadow-md p-4 text-center hover:shadow-lg cursor-pointer bg-white"
            >
              <img
                src={cat.image || '/category-placeholder.png'}
                alt={cat.name}
                className="w-full h-24 object-cover rounded mb-2"
              />
              <h3 className="font-semibold">{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS BY CATEGORY */}
      {categories.map((cat) => {
        const catProducts = productsByCategory[cat.name] || [];
        const randomSample = [...catProducts].sort(() => 0.5 - Math.random()).slice(0, 3);

        return (
          <section key={cat.id} className="mt-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{cat.name}</h2>
              <Link href={`/categories?category=${encodeURIComponent(cat.name)}`}>
                <button className="mt-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">
                  View All
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {randomSample.map((product) => (
                <div key={product.id} className="product-card">
                  <img
                    src={product.image || '/no-image.jpg'}
                    alt={product.name}
                    className="product-img"
                  />
                  <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
                  <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                  <p>
                    {product.discountedPrice ? (
                      <>
                        <span className="line-through text-gray-500">₹{product.price}</span>{' '}
                        <span className="text-green-600 font-bold">₹{product.discountedPrice.toFixed(2)}</span>
                      </>
                    ) : (
                      <>₹{product.price}</>
                    )}
                  </p>
                  <button
                    className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    onClick={() => handleOrderNow(product)}
                  >
                    Order Now
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
