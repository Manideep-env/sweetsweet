// app/api/discounts/route.js
import { Discount } from '@/models/Discount';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const data = await req.json();

  try {
    const { productId, categoryId, percentage, startDate, endDate } = data;

    // Ensure at least one (and only one) of productId or categoryId is present
    if ((!productId && !categoryId) || (productId && categoryId)) {
      return NextResponse.json(
        { error: 'Specify either productId or categoryId (not both)' },
        { status: 400 }
      );
    }

    const discount = await Discount.create({
      productId: productId || null,
      categoryId: categoryId || null,
      percentage,
      startDate,
      endDate,
    });

    return NextResponse.json(discount);
  } catch (err) {
    console.error('[DISCOUNT_CREATE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const discounts = await Discount.findAll();
    return NextResponse.json(discounts);
  } catch (err) {
    console.error('[DISCOUNTS_GET_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}
