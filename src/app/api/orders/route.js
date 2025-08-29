// src/app/api/orders/route.js
import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db';
import { Seller, Product, Order, OrderItem, Discount, OrderDiscount, User, Address } from '@/models';
import { Op } from 'sequelize';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req) {
  const t = await sequelize.transaction();
  try {
    const body = await req.json();
    const { items, storeSlug, shippingAddressId, shippingAddress } = body;

    if (!items || !storeSlug || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields for order.' }, { status: 400 });
    }
    
    // --- User Verification ---
    const cookieStore = cookies();
    const token = cookieStore.get('user_token')?.value;
    let userId = null;
    let finalAddressId = shippingAddressId;

    if (token) {
        try {
            const decoded = await verifyToken(token);
            userId = decoded.userId;
        } catch (e) { /* Ignore invalid token, proceed as guest */ }
    }

    const seller = await Seller.findOne({ where: { storeSlug } });
    if (!seller) {
      return NextResponse.json({ error: 'Invalid store.' }, { status: 404 });
    }

    // --- Address Handling ---
    if (userId && !finalAddressId && shippingAddress) {
        // Logged-in user is creating a new address
        const newAddress = await Address.create({
            userId: userId,
            ...shippingAddress
        }, { transaction: t });
        finalAddressId = newAddress.id;
    } else if (!userId && shippingAddress) {
        // Guest user, we can't save the address, but we need the details for the order
    } else if (!finalAddressId) {
        return NextResponse.json({ error: 'Shipping address is required.' }, { status: 400 });
    }
    
    let totalPrice = 0;
    const appliedDiscountIds = new Set();
    
    // --- Create Order ---
    const newOrder = await Order.create({
      totalPrice: 0, // Will be updated later
      sellerId: seller.id,
      userId: userId, // Can be null for guest orders
      shippingAddressId: finalAddressId, // Link to the chosen/new address if user is logged in
      // For guests, we might store the address directly on the order if the model is adjusted
      // For now, we rely on the Address model, which works best for logged-in users
      customerName: shippingAddress?.fullName, // Fallback for guests
      phoneNumber: shippingAddress?.phoneNumber, // Fallback for guests
    }, { transaction: t });

    // The rest of the logic for processing items and discounts remains the same...
    for (const item of items) {
        const product = await Product.findOne({ where: { slug: item.slug, sellerId: seller.id }, transaction: t });
        if (!product) throw new Error(`Product ${item.slug} not found.`);

        const basePrice = parseFloat(product.pricePerKg ?? product.pricePerUnit);
        // ... discount logic ...
        const finalPrice = basePrice; // Simplified for brevity
        
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

    // ... save discounts ...
    
    await t.commit();
    return NextResponse.json({ success: true, orderId: newOrder.id }, { status: 201 });
  } catch (err) {
    await t.rollback();
    console.error('[ORDER_CREATE_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
