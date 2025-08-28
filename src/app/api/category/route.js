// src/app/api/category/route.js
import { NextResponse } from 'next/server';
import { Category } from '@/models';
import { getSellerFromToken } from '@/lib/get-seller-from-token';

// GET all categories for the authenticated seller
export async function GET(req) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await Category.findAll({
      where: { sellerId: seller.sellerId }, // DATA ISOLATION
      order: [['name', 'ASC']],
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error('[CATEGORIES_GET_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST a new category for the authenticated seller
export async function POST(req) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const newCategory = await Category.create({
      name: body.name,
      image: body.image || null,
      sellerId: seller.sellerId, // DATA ISOLATION
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('[CATEGORY_POST_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}