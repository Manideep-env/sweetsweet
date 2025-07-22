// /api/admin/users/route.js
import { Order } from '@/models';
import { sequelize } from '@/lib/db';

export async function GET() {
  try {
    await sequelize.sync();

    const users = await Order.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('customerName')), 'customerName'],
        'phoneNumber',
        'address',
      ],
    });

    const plainUsers = users.map(user => user.toJSON());

    // Remove full duplicates manually (just in case)
    const uniqueUsers = [];
    const seen = new Set();

    for (const user of plainUsers) {
      const key = `${user.customerName}-${user.phoneNumber}-${user.address}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueUsers.push(user);
      }
    }

    return new Response(JSON.stringify(uniqueUsers), { status: 200 });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
