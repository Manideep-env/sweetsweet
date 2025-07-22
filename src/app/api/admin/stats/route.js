import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Op } from 'sequelize';

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const totalOrdersToday = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    const pendingOrders = await Order.count({
      where: {
        status: 'Pending',
      },
    });

    const totalProducts = await Product.count();
    const totalCategories = await Category.count();

    return Response.json({
      totalOrdersToday,
      pendingOrders,
      totalProducts,
      totalCategories,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
