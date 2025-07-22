// app/api/product/basic/route.js
import { NextResponse } from 'next/server';
import { Product } from '@/models';
import { sequelize } from '@/lib/db';

export async function GET() {
  try {
    await sequelize.sync();
    const products = await Product.findAll({
      attributes: ['id', 'name', 'categoryId'],
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
