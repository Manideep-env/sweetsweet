// /app/api/admin/order-discounts/route.js
import { OrderDiscount } from '@/models/OrderDiscount';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const discounts = await OrderDiscount.findAll();

    // Group discounts by orderId
    const grouped = {};
    discounts.forEach((entry) => {
      if (!grouped[entry.orderId]) grouped[entry.orderId] = [];
      grouped[entry.orderId].push(entry.discountId);
    });

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching OrderDiscounts:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}
