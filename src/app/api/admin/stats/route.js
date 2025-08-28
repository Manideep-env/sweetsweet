// src/app/api/admin/stats/route.js
import { Order, Product, Category } from '@/models';
import { Op } from 'sequelize';
import { getSellerFromToken } from '@/lib/get-seller-from-token';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // DATA ISOLATION: Add sellerId to all queries
    const whereClause = { sellerId: seller.sellerId };

    const totalOrdersToday = await Order.count({
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
    });

    const pendingOrders = await Order.count({
      where: {
        ...whereClause,
        status: 'Pending',
      },
    });

    const totalProducts = await Product.count({ where: whereClause });
    const totalCategories = await Category.count({ where: whereClause });

    return NextResponse.json({
      totalOrdersToday,
      pendingOrders,
      totalProducts,
      totalCategories,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}