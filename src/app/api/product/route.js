// ✅ GET: Fetch all products with category info
import { NextResponse } from 'next/server';
import { Product, Category, Discount } from '@/models';
import { sequelize } from '@/lib/db';
import { Op } from 'sequelize';

export async function GET(req) {
  try {
    await sequelize.sync();
    const today = new Date();

    const products = await Product.findAll({
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
        {
          model: Discount,
          as: 'Discounts',
          where: {
            startDate: { [Op.lte]: today },
            endDate: { [Op.gte]: today },
          },
          required: false,
          attributes: ['id', 'percentage'],
        },
      ],
    });

    // Get all active category discounts
    const categoryDiscountsRaw = await Discount.findAll({
      where: {
        categoryId: { [Op.not]: null },
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
      },
      attributes: ['id', 'percentage', 'categoryId'],
    });

    const categoryDiscountMap = {};
    categoryDiscountsRaw.forEach(d => {
      categoryDiscountMap[d.categoryId] = Math.max(
        categoryDiscountMap[d.categoryId] || 0,
        d.percentage
      );
    });

    const productList = products.map(product => {
      const prodDiscount = product.Discounts?.[0]?.percentage || 0;
      const catDiscount = categoryDiscountMap[product.category.id] || 0;
      const maxDiscount = Math.max(prodDiscount, catDiscount);

      const basePrice = product.pricePerKg ?? product.pricePerUnit;
      const discountedPrice = maxDiscount
        ? parseFloat((basePrice * (1 - maxDiscount / 100)).toFixed(2))
        : null;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        image: product.image,
        description: product.description,
        price: basePrice,
        discountedPrice: discountedPrice !== basePrice ? discountedPrice : null,
        unitLabel: product.unitLabel,
        isAvailable: product.isAvailable,
      };
    });

    return NextResponse.json(productList);
  } catch (err) {
    console.error('GET /api/product error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



// ✅ POST: Create new product
export async function POST(req) {
  try {
    await sequelize.sync();
    const body = await req.json();

    const {
      name,
      slug,
      categoryId,
      pricePerKg,
      pricePerUnit,
      unitLabel,
      image,
      description,
      isAvailable,
    } = body;

    if (!name || !slug || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const product = await Product.create({
      name,
      slug,
      categoryId,
      pricePerKg,
      pricePerUnit,
      unitLabel,
      image,
      description,
      isAvailable,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('POST /api/product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ PUT: Update existing product
export async function PUT(req) {
  try {
    await sequelize.sync();
    const body = await req.json();

    const {
      id,
      name,
      slug,
      categoryId,
      pricePerKg,
      pricePerUnit,
      unitLabel,
      image,
      description,
      isAvailable,
    } = body;

    const product = await Product.findByPk(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await product.update({
      name,
      slug,
      categoryId,
      pricePerKg,
      pricePerUnit,
      unitLabel,
      image,
      description,
      isAvailable,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('PUT /api/product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ DELETE: Delete product by query param ID
export async function DELETE(req) {
  try {
    await sequelize.sync();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Product ID missing' }, { status: 400 });

    const product = await Product.findByPk(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await product.destroy();
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('DELETE /api/product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
