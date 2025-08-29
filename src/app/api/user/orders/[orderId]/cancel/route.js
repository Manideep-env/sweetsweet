// src/app/api/user/orders/[orderId]/cancel/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { Order } from '@/models';
import { sequelize } from '@/lib/db';

export async function PUT(req, { params }) {
  const cookieStore = cookies();
  const token = cookieStore.get('user_token')?.value;
  const { orderId } = params;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyToken(token);
    await sequelize.sync();

    // Find the order and ensure it belongs to the authenticated user
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: decoded.userId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or you do not have permission to modify it.' }, { status: 404 });
    }

    // Add business logic: Only 'Pending' orders can be cancelled by the user
    if (order.status !== 'Pending') {
      return NextResponse.json({ error: `Cannot cancel an order with status: ${order.status}` }, { status: 400 });
    }

    // Update the order's status to 'Cancelled'
    order.status = 'Cancelled';
    await order.save();

    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('[ORDER_CANCEL_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
