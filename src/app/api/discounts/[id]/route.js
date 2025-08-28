// src/app/api/discounts/[id]/route.js
import { NextResponse } from 'next/server';
import { Discount } from '@/models';
import { getSellerFromToken } from '@/lib/get-seller-from-token';

// PUT: Update a discount owned by the authenticated seller
export async function PUT(req, { params }) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();

    const discount = await Discount.findOne({
      where: { id, sellerId: seller.sellerId }, // DATA ISOLATION
    });

    if (!discount) {
      return NextResponse.json({ error: 'Discount not found or permission denied.' }, { status: 404 });
    }

    await discount.update({
        ...body,
        productId: body.productId || null,
        categoryId: body.categoryId || null,
    });
    
    return NextResponse.json(discount);
  } catch (err) {
    console.error('[DISCOUNT_UPDATE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
  }
}

// DELETE: Remove a discount owned by the authenticated seller
export async function DELETE(req, { params }) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    const discount = await Discount.findOne({
      where: { id, sellerId: seller.sellerId }, // DATA ISOLATION
    });

    if (!discount) {
      return NextResponse.json({ error: 'Discount not found or permission denied.' }, { status: 404 });
    }

    await discount.destroy();
    return NextResponse.json({ message: 'Discount deleted.' });
  } catch (err) {
    console.error('[DISCOUNT_DELETE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
  }
}