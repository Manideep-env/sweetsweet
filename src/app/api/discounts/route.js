// src/app/api/discounts/route.js
import { NextResponse } from 'next/server';
import { Discount } from '@/models';
import { getSellerFromToken } from '@/lib/get-seller-from-token';

// GET all discounts for the authenticated seller
export async function GET(req) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const discounts = await Discount.findAll({
      where: { sellerId: seller.sellerId }, // DATA ISOLATION
      order: [['endDate', 'DESC']],
    });
    return NextResponse.json(discounts);
  } catch (err) {
    console.error('[DISCOUNTS_GET_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

// POST a new discount for the authenticated seller
export async function POST(req) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const { productId, categoryId, percentage, startDate, endDate } = body;

    // Ensure at least one target is specified
    if (!productId && !categoryId) {
      return NextResponse.json({ error: 'Specify either a productId or categoryId.' }, { status: 400 });
    }

    const newDiscount = await Discount.create({
      ...body,
      productId: productId || null,
      categoryId: categoryId || null,
      sellerId: seller.sellerId, // DATA ISOLATION
    });

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (err) {
    console.error('[DISCOUNT_CREATE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}