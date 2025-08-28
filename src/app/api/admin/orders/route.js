// src/app/api/admin/orders/route.js
import { Order, OrderItem, Product } from '@/models';
import { NextResponse } from 'next/server';
import { getSellerFromToken } from '@/lib/get-seller-from-token';

export async function GET(req) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = await Order.findAll({
      where: { sellerId: seller.sellerId }, // DATA ISOLATION
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, attributes: ['name'] }], // Only include name
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('[ADMIN_ORDER_FETCH_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}