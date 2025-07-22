// /api/admin/invoice/[id]/route.js
import { Order, OrderItem, Product, Discount } from '@/models';

export async function GET(req, { params }) {
  const { id } = params;

  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: {
            model: Product,
            attributes: ['name'],
          },
        },
        {
          model: Discount,
          through: { attributes: [] },
        },
      ],
    });

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(order.toJSON()), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
