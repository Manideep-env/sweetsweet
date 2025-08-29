import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db';
import { Order, OrderItem, Product, User, Address } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req, { params }) {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = params;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decoded = await verifyToken(token);
        await sequelize.sync();

        const order = await Order.findOne({
            where: { id, sellerId: decoded.sellerId },
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Product }],
                },
                {
                    model: User,
                    attributes: ['fullName', 'email'],
                },
                {
                    model: Address,
                },
            ],
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('[ADMIN_ORDER_DETAIL_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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