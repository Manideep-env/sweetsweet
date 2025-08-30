'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import './about-page.css'; // New CSS file

export default function AboutPage() {
  const [pageData, setPageData] = useState(null);
  const [customization, setCustomization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const storeSlug = params.slug;

  useEffect(() => {
    if (!storeSlug) return;
    
    async function fetchData() {
      const [aboutRes, customRes] = await Promise.all([
        fetch(`/api/store/${storeSlug}/about`),
        fetch(`/api/store/${storeSlug}/customization`)
      ]);
      const aboutData = await aboutRes.json();
      const customData = await customRes.json();
      setPageData(aboutData);
      setCustomization(customData);
      setIsLoading(false);
    }
    fetchData();
  }, [storeSlug]);

  useEffect(() => {
    if (customization) {
      document.body.style.backgroundColor = customization.backgroundColor;
    }
    return () => { document.body.style.backgroundColor = ''; };
  }, [customization]);

  if (isLoading) return <div>Loading...</div>;

  const pageStyles = customization ? {
    '--store-primary-color': customization.primaryColor,
  } : {};

  return (
    <div className="about-page-container" style={pageStyles}>
      {pageData.imageUrl && (
        <div className="about-header-image" style={{ backgroundImage: `url(${pageData.imageUrl})` }}></div>
      )}
      <div className="about-content">
        <h1>{pageData.title}</h1>
        <p>{pageData.content}</p>
      </div>
    </div>
  );
}
