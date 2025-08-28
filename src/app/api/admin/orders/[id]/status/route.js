// src/app/api/admin/orders/[id]/status/route.js
import { Order } from '@/models';
import { getSellerFromToken } from '@/lib/get-seller-from-token';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const order = await Order.findOne({
        where: { id, sellerId: seller.sellerId } // DATA ISOLATION
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or permission denied.' }, { status: 404 });
    }

    // Toggle status
    const newStatus = order.status === 'Pending' ? 'Confirmed' : 'Pending';
    await order.update({ status: newStatus });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('Error updating status:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}