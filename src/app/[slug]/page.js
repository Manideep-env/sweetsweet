'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import '../homepage.css';

export default function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [customization, setCustomization] = useState(null); // State for theme
  const [error, setError] = useState(null);

  const router = useRouter();
  const params = useParams();
  const storeSlug = params.slug;

  useEffect(() => {
    if (!storeSlug) return;

    async function fetchStoreData() {
      try {
        const [productRes, categoryRes, customRes] = await Promise.all([
          fetch(`/api/store/${storeSlug}/products`),
          fetch(`/api/store/${storeSlug}/categories`),
          fetch(`/api/store/${storeSlug}/customization`),
        ]);

        if (!productRes.ok) {
          throw new Error(`Store "${storeSlug}" not found.`);
        }

        const productData = await productRes.json();
        const categoryData = await categoryRes.json();
        const customData = await customRes.json();
        
        setProducts(productData);
        setCategories(categoryData);
        setCustomization(customData); // Save the theme settings

        const shuffled = [...productData].sort(() => 0.5 - Math.random());
        setFeatured(shuffled.slice(0, 10));

        const byCat = {};
        productData.forEach((product) => {
          const catName = product.category?.name || 'Uncategorized';
          if (!byCat[catName]) byCat[catName] = [];
          byCat[catName].push(product);
        });
        setProductsByCategory(byCat);

      } catch (err) {
        setError(err.message);
      }
    }
    
    fetchStoreData();
  }, [storeSlug]);

  useEffect(() => {
    if (customization) {
      document.body.style.backgroundColor = customization.backgroundColor;
    }
    // Cleanup function to reset the background color when leaving the page
    return () => {
      document.body.style.backgroundColor = ''; // Resets to default
    };
  }, [customization]);

  const handleOrderNow = (product) => {
    router.push(`/${storeSlug}/product/${product.slug}`);
  };

  const handleLeft = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
  const handleRight = () => {
    const maxIndex = Math.max(0, featured.length - 4);
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  if (error) return <div className="text-center p-10 text-red-500 font-bold">{error}</div>;
  if (!products.length || !customization) return <div className="text-center p-10">Loading Store...</div>;

  // Apply fetched settings as CSS variables to the main container
  const storeStyles = {
    '--store-background-color': customization.backgroundColor,
    '--store-primary-color': customization.primaryColor,
  };

  return (
    <main className="home-container" style={storeStyles}>
      <div className="banner">
        <img 
          src={customization.bannerImageUrl || '/image.png'} 
          className="banner-img" 
          alt="Store Banner"
          onError={(e) => { e.target.src = '/image.png'; }} // Fallback if the image fails
        />
      </div>

      <div className="featured-section">
        <div className="carousel-container">
          <button onClick={handleLeft} className="carousel-btn">‹</button>
          <div className="carousel-track">
            {featured.slice(currentIndex, currentIndex + 4).map((product, index) => {
              const bgColors = ['#FECACA', '#FED7AA', '#BBF7D0', '#DDD6FE'];
              const bgColor = bgColors[index % bgColors.length];
              const basePrice = parseFloat(product.pricePerKg ?? product.pricePerUnit ?? 0);
              const displayPrice = parseFloat(product.discountedPrice ?? basePrice);

              return (
                <div key={product.id} className="carousel-card-custom" style={{ backgroundColor: bgColor }}>
                  <div className="img-wrapper">
                    <img src={product.image || '/no-image.jpg'} alt={product.name} className="circle-img" />
                    <div className="badge-dot"></div>
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">₹{displayPrice.toFixed(2)}</p>
                  <button className="order-now-btn" onClick={() => handleOrderNow(product)}>
                    Order Now <span className="arrow">&gt;</span>
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={handleRight} className="carousel-btn">›</button>
        </div>
      </div>

      <section className="mt-12">
  <h2 className="text-2xl font-bold mb-4">Our Categories</h2>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
    {categories.map((cat) => (
      <Link 
        key={cat.id} 
        href={`/${storeSlug}/categories?category=${encodeURIComponent(cat.name)}`}
      >
        <div className="category-card">
          <img 
            src={cat.image || '/category-placeholder.png'} 
            alt={cat.name} 
            className="category-img" 
          />
          <h3 className="category-name">{cat.name}</h3>
        </div>
      </Link>
    ))}
  </div>
</section>

      {categories.map((cat) => {
        const catProducts = productsByCategory[cat.name] || [];
        if (catProducts.length === 0) return null;
        const randomSample = [...catProducts].sort(() => 0.5 - Math.random()).slice(0, 3);
        return (
          <section key={cat.id} className="mt-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{cat.name}</h2>
              <Link href={`/${storeSlug}/categories?category=${encodeURIComponent(cat.name)}`}>
                {/* REMOVED INLINE CLASSES - will be styled from CSS file */}
                <button className="view-all-btn">
                  View All
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {randomSample.map((product) => {
                const basePrice = parseFloat(product.pricePerKg ?? product.pricePerUnit ?? 0);
                const discountedPrice = product.discountedPrice ? parseFloat(product.discountedPrice) : null;
                return (
                  <div key={product.id} className="product-card">
                    <img src={product.image || '/no-image.jpg'} alt={product.name} className="product-img" />
                    <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
                    <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                    <p className="font-semibold">
                      {discountedPrice && discountedPrice < basePrice ? (
                        <>
                          <span className="line-through text-gray-500">₹{basePrice.toFixed(2)}</span>{' '}
                          <span className="text-green-600 font-bold">₹{discountedPrice.toFixed(2)}</span>
                        </>
                      ) : (
                        <>₹{basePrice.toFixed(2)}</>
                      )}
                    </p>
                    {/* REMOVED INLINE CLASSES - will be styled from CSS file */}
                    <button className="order-now-card-btn" onClick={() => handleOrderNow(product)}>
                      Order Now
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
