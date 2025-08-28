// src/app/api/orders/route.js
import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db';
import { Seller, Product, Order, OrderItem, Discount, OrderDiscount } from '@/models';
import { Op } from 'sequelize';

export async function POST(req) {
  const t = await sequelize.transaction();
  try {
    const body = await req.json();
    const { customerName, phoneNumber, address, items, storeSlug } = body;

    if (!customerName || !phoneNumber || !items || !storeSlug || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields for order.' }, { status: 400 });
    }

    const seller = await Seller.findOne({ where: { storeSlug } });
    if (!seller) {
      return NextResponse.json({ error: 'Invalid store.' }, { status: 404 });
    }
    
    const today = new Date();
    let totalPrice = 0;
    const appliedDiscountIds = new Set();

    const newOrder = await Order.create({
      customerName, phoneNumber, address,
      totalPrice: 0,
      sellerId: seller.id,
    }, { transaction: t });

    for (const item of items) {
      const product = await Product.findOne({
        where: { slug: item.slug, sellerId: seller.id },
        transaction: t,
      });

      if (!product) throw new Error(`Product ${item.slug} not found.`);

      const basePrice = parseFloat(product.pricePerKg ?? product.pricePerUnit);
      
      // Find all active, applicable discounts for this item
      const applicableDiscounts = await Discount.findAll({
        where: {
          sellerId: seller.id,
          [Op.or]: [{ productId: product.id }, { categoryId: product.categoryId }],
          startDate: { [Op.lte]: today },
          endDate: { [Op.gte]: today },
        },
        transaction: t,
      });

      const bestDiscountPercentage = applicableDiscounts.reduce((max, d) => Math.max(max, parseFloat(d.percentage)), 0);

      let finalPrice = basePrice;
      if (bestDiscountPercentage > 0) {
        finalPrice = parseFloat((basePrice * (1 - bestDiscountPercentage / 100)).toFixed(2));
        // Add the IDs of all discounts that could have applied
        applicableDiscounts.forEach(d => appliedDiscountIds.add(d.id));
      }

      let itemTotal = 0;
      if (item.weight && product.pricePerKg) {
        itemTotal = parseFloat(item.weight) * finalPrice;
      } else if (item.quantity && product.pricePerUnit) {
        itemTotal = parseInt(item.quantity) * finalPrice;
      }

      await OrderItem.create({
        orderId: newOrder.id,
        productId: product.id,
        weight: item.weight || null,
        quantity: item.quantity || null,
        pricePerKg: product.pricePerKg ? finalPrice : null,
        pricePerUnit: product.pricePerUnit ? finalPrice : null,
        totalPrice: itemTotal.toFixed(2),
      }, { transaction: t });
      
      totalPrice += itemTotal;
    }

    newOrder.totalPrice = totalPrice.toFixed(2);
    await newOrder.save({ transaction: t });

    for (const discountId of appliedDiscountIds) {
      await OrderDiscount.create({ orderId: newOrder.id, discountId }, { transaction: t });
    }
    
    await t.commit();
    return NextResponse.json({ success: true, orderId: newOrder.id }, { status: 201 });
  } catch (err) {
    await t.rollback();
    console.error('[ORDER_CREATE_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}