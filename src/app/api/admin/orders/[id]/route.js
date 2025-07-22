// app/api/admin/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { Order } from '@/models/Order';
import { OrderItem } from '@/models/OrderItem';
import { Product } from '@/models/Product';

export async function GET(req, { params }) {
  const { id } = params;

  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [Product],
        },
      ],
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json(order);
  } catch (err) {
    console.error('[ORDER_FETCH_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { id } = params;
  const { status } = await req.json();

  try {
    const order = await Order.findByPk(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    order.status = status;
    await order.save();

    return NextResponse.json({ success: true, status: order.status });
  } catch (err) {
    console.error('[ORDER_UPDATE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
