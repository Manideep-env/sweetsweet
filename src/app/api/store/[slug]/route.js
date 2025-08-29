// src/app/api/store/[slug]/route.js
import { NextResponse } from 'next/server';
import { Seller } from '@/models';
import { sequelize } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    await sequelize.sync();
    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ message: 'Store slug is required.' }, { status: 400 });
    }

    const seller = await Seller.findOne({
      where: { storeSlug: slug },
      attributes: ['storeName'], // Only fetch the storeName
    });

    if (!seller) {
      return NextResponse.json({ message: 'Store not found.' }, { status: 404 });
    }

    return NextResponse.json({ storeName: seller.storeName });

  } catch (error) {
    console.error('[STORE_API_ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
