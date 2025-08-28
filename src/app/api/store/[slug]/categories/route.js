// src/app/api/store/[slug]/categories/route.js
import { NextResponse } from 'next/server';
import { Category, Seller } from '@/models';

export async function GET(req, { params }) {
  const { slug } = params;

  try {
    const seller = await Seller.findOne({ where: { storeSlug: slug } });
    if (!seller) {
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 });
    }

    const categories = await Category.findAll({
      where: { sellerId: seller.id },
      order: [['name', 'ASC']],
    });

    return NextResponse.json(categories);
  } catch (err) {
    console.error(`[STORE_CATEGORIES_GET_ERROR]`, err);
    return NextResponse.json({ error: 'Failed to fetch store categories' }, { status: 500 });
  }
}