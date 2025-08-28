// src/app/api/admin/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { Order, OrderItem, Product } from '@/models';
import { getSellerFromToken } from '@/lib/get-seller-from-token';

// GET a single order by ID
export async function GET(req, { params }) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const order = await Order.findOne({
      where: { id, sellerId: seller.sellerId }, // DATA ISOLATION
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or permission denied.' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (err) {
    console.error('[ORDER_FETCH_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// PUT: Update an order's status
export async function PUT(req, { params }) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { status } = await req.json();

    const order = await Order.findOne({
      where: { id, sellerId: seller.sellerId }, // DATA ISOLATION
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or permission denied.' }, { status: 404 });
    }

    order.status = status;
    await order.save();
    return NextResponse.json({ success: true, status: order.status });
  } catch (err) {
    console.error('[ORDER_UPDATE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}