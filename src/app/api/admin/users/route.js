// src/app/api/admin/users/route.js
import { Order } from '@/models';
import { sequelize } from '@/lib/db';
import { getSellerFromToken } from '@/lib/get-seller-from-token';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await Order.findAll({
      where: { sellerId: seller.sellerId }, // DATA ISOLATION
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('customerName')), 'customerName'],
        'phoneNumber',
        'address',
      ],
      group: ['customerName', 'phoneNumber', 'address'], // Group to get unique customers
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}