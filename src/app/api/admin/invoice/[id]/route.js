// /api/admin/invoice/[id]/route.js
import { Order, OrderItem, Product, Discount } from '@/models';
import { getSellerFromToken } from '@/lib/get-seller-from-token';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = params;
    const order = await Order.findOne({
      where: { id, sellerId: seller.sellerId }, // DATA ISOLATION
      include: [
        { model: OrderItem, as: 'items', include: { model: Product, attributes: ['name'] }},
        { model: Discount, through: { attributes: [] } },
      ],
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or permission denied.' }, { status: 404 });
    }

    return NextResponse.json(order.toJSON());
  } catch (err) {
    console.error('[INVOICE_GET_ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}