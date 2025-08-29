// src/app/api/store/[slug]/customization/route.js
import { NextResponse } from 'next/server';
import { Seller, StoreCustomization } from '@/models';
import { sequelize } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { slug } = params;
    if (!slug) {
      return NextResponse.json({ error: 'Store slug is required.' }, { status: 400 });
    }

    await sequelize.sync();

    const seller = await Seller.findOne({ where: { storeSlug: slug } });
    if (!seller) {
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 });
    }

    // Find the customization settings for this seller
    const customization = await StoreCustomization.findOne({
      where: { sellerId: seller.id },
    });

    // If no settings are saved, return the default values
    if (!customization) {
      return NextResponse.json({
        primaryColor: '#4F46E5',
        backgroundColor: '#F9FAFB',
        bannerImageUrl: '/image.png', // A default banner
      });
    }

    return NextResponse.json(customization);
  } catch (error) {
    console.error('[STORE_CUSTOMIZATION_API_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
