// File: /app/api/store/[slug]/products/route.js
import { NextResponse } from 'next/server';
import { Product, Category, Discount, Seller } from '@/models';
import { Op } from 'sequelize';

export async function GET(req, { params }) {
  const { slug } = params;
  const today = new Date();

  try {
    const seller = await Seller.findOne({ where: { storeSlug: slug } });
    if (!seller) {
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 });
    }

    // 1. Fetch all active category-level discounts for this seller
    const categoryDiscountsRaw = await Discount.findAll({
      where: {
        sellerId: seller.id,
        categoryId: { [Op.not]: null },
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
      },
    });
    
    // Create a map for efficient lookup: { categoryId: maxPercentage }
    const categoryDiscountMap = {};
    categoryDiscountsRaw.forEach(d => {
      const categoryId = d.categoryId;
      const percentage = parseFloat(d.percentage);
      categoryDiscountMap[categoryId] = Math.max(categoryDiscountMap[categoryId] || 0, percentage);
    });

    // 2. Fetch all of the seller's available products
    const products = await Product.findAll({
      where: { sellerId: seller.id, isAvailable: true },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { 
          model: Discount, 
          as: 'Discounts',
          where: { startDate: { [Op.lte]: today }, endDate: { [Op.gte]: today }},
          required: false 
        }
      ]
    });

    // 3. Process each product to find the best discount and final price
    const productList = products.map(product => {
      const plainProduct = product.toJSON();
      const basePrice = parseFloat(plainProduct.pricePerKg ?? plainProduct.pricePerUnit);

      // Find best product-specific discount
      const productDiscount = plainProduct.Discounts.reduce((max, d) => Math.max(max, parseFloat(d.percentage)), 0);
      
      // Get the category discount from our map
      const categoryDiscount = categoryDiscountMap[plainProduct.categoryId] || 0;

      // The final discount is the best of the two
      const finalDiscount = Math.max(productDiscount, categoryDiscount);

      let discountedPrice = null;
      if (finalDiscount > 0) {
        discountedPrice = parseFloat((basePrice * (1 - finalDiscount / 100)).toFixed(2));
      }

      // ✅ FIX: Return the object structure the frontend expects
      return {
        id: plainProduct.id,
        name: plainProduct.name,
        slug: plainProduct.slug,
        category: plainProduct.category,
        image: plainProduct.image,
        description: plainProduct.description,
        pricePerKg: plainProduct.pricePerKg, // Keep original price fields
        pricePerUnit: plainProduct.pricePerUnit, // Keep original price fields
        isAvailable: plainProduct.isAvailable,
        finalDiscount,
        discountedPrice,
      };
    });

    return NextResponse.json(productList);

  } catch (err) {
    console.error(`[STORE_PRODUCTS_GET_ERROR]`, err);
    return NextResponse.json({ error: 'Failed to fetch store products' }, { status: 500 });
  }
}
