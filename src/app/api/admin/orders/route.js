// app/api/admin/orders/route.js
import { Order, OrderItem, Product } from '@/models';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product }],
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
