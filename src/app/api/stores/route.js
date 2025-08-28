// src/app/api/stores/route.js
import { NextResponse } from 'next/server';
import { Seller } from '@/models';

// GET: Fetch all available stores for the main landing page
export async function GET() {
  try {
    const stores = await Seller.findAll({
      attributes: ['storeName', 'storeSlug'], // Only send public, necessary data
      order: [['storeName', 'ASC']],
    });
    return NextResponse.json(stores);
  } catch (err) {
    console.error('[STORES_GET_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}