// testOrderDiscountAssociations.js
import { sequelize } from './lib/db.js';
import './models/index.js'; // This should initialize all models and associations

import { Order } from './models/Order.js';
import { Discount } from './models/Discount.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    const order = await Order.findOne({
      include: [
        {
          model: Discount,
          attributes: ['id', 'percentage', 'productId', 'categoryId'],
          through: { attributes: [] }, // Hide join table
        },
      ],
    });

    if (!order) {
      console.log('❌ No order found');
      return;
    }

    console.log(`\n✔ Order ID: ${order.id}`);
    if (order.Discounts.length === 0) {
      console.log('⚠ No discounts applied to this order.');
    } else {
      console.log('✔ Discounts applied:');
      order.Discounts.forEach((d) => {
        console.log(`  ➤ #${d.id} | ${d.percentage}% | productId: ${d.productId ?? '-'} | categoryId: ${d.categoryId ?? '-'}`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await sequelize.close();
  }
})();
