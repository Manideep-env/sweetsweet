// src/app/api/admin/orders/route.js
import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db';
import { Order, OrderItem, Product, User, Address } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value; // Admin/Seller token

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyToken(token);
    await sequelize.sync();

    const orders = await Order.findAll({
      where: { sellerId: decoded.sellerId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, attributes: ['name'] }],
        },
        {
          model: User, // Include the User who placed the order
          attributes: ['fullName', 'email'],
        },
        {
          model: Address, // Include the shipping address
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('[ADMIN_ORDERS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
