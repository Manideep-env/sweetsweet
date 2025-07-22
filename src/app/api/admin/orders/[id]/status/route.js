// src/app/api/admin/orders/[id]/status/route.js
import { Order } from '@/models';
import { sequelize } from '@/lib/db';

export async function PUT(req, { params }) {
  const { id } = params;
  try {
    await sequelize.sync();

    const order = await Order.findByPk(id);
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    // Toggle status
    const newStatus = order.status === 'Pending' ? 'Confirmed' : 'Pending';
    await order.update({ status: newStatus });

    return new Response(JSON.stringify({ success: true, status: newStatus }), { status: 200 });
  } catch (err) {
    console.error('Error updating status:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
