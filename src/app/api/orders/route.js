import { Product } from '@/models/Product';
import { sequelize } from '@/lib/db';
import { Op } from 'sequelize';
import { Order, Discount, OrderItem, OrderDiscount } from '@/models'; // adjust as per your path


export async function POST(req) {
  try {
    const body = await req.json();
    const { customerName, phoneNumber, address, items } = body;

    if (!customerName || !phoneNumber || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const result = await sequelize.transaction(async (t) => {
      const today = new Date();
      let totalPrice = 0;
      const appliedDiscountIds = new Set();

      const order = await Order.create({
        customerName,
        phoneNumber,
        address,
        totalPrice: 0,
        status: 'Pending',
        discountId: null, // Optional: if using a single global discount
      }, { transaction: t });

      for (const item of items) {
        const product = await Product.findOne({
          where: { slug: item.slug },
          transaction: t,
        });

        if (!product) continue;

        const discounts = await Discount.findAll({
          where: {
            [Op.or]: [
              { productId: product.id },
              { categoryId: product.categoryId },
            ],
            startDate: { [Op.lte]: today },
            endDate: { [Op.gte]: today },
          },
          order: [['percentage', 'DESC']],
          transaction: t,
        });

        let discountedPricePerKg = product.pricePerKg ? parseFloat(product.pricePerKg) : null;
        let discountedPricePerUnit = product.pricePerUnit ? parseFloat(product.pricePerUnit) : null;

        if (discounts.length > 0) {
          const bestDiscount = discounts[0];
          const maxDiscount = bestDiscount.percentage;

          if (discountedPricePerKg !== null) {
            discountedPricePerKg *= (1 - maxDiscount / 100);
          }
          if (discountedPricePerUnit !== null) {
            discountedPricePerUnit *= (1 - maxDiscount / 100);
          }

          // Add all relevant discount IDs for this product to the set
          for (const disc of discounts) {
            appliedDiscountIds.add(disc.id);
          }
        }

        let itemTotal = 0;
        if (item.weight && discountedPricePerKg !== null) {
          itemTotal = discountedPricePerKg * parseFloat(item.weight);
        } else if (item.quantity && discountedPricePerUnit !== null) {
          itemTotal = discountedPricePerUnit * parseInt(item.quantity);
        }

        totalPrice += itemTotal;

        await OrderItem.create({
          orderId: order.id,
          productId: product.id,
          weight: item.weight || null,
          quantity: item.quantity || null,
          pricePerKg: discountedPricePerKg || null,
          pricePerUnit: discountedPricePerUnit || null,
          totalPrice: itemTotal.toFixed(2),
        }, { transaction: t });
      }

      // Update order with total
      await order.update({
        totalPrice: totalPrice.toFixed(2),
      }, { transaction: t });

      // Create entries in OrderDiscount table for all used discounts
      for (const discountId of appliedDiscountIds) {
        await OrderDiscount.create({
          orderId: order.id,
          discountId,
        }, { transaction: t });
      }

      return order;
    });

    return new Response(JSON.stringify({ success: true, orderId: result.id }), { status: 201 });

  } catch (err) {
    console.error('[ORDER_ERROR]', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function GET() {
  try {
    // /api/admin/orders GET
const orders = await Order.findAll({
  include: [
    {
      model: Discount,
      attributes: ['id', 'percentage'],
      through: { attributes: [] }
    },
    {
      model: OrderItem,
      as: 'items',
      include: {
        model: Product,
        attributes: ['name', 'pricePerKg']
      }
    }
  ]
});

const plainOrders = orders.map(o => o.toJSON());
return new Response(JSON.stringify(plainOrders), { status: 200 });


  } catch (err) {
    console.error('Failed to fetch orders:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }

}
