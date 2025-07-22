// app/api/categories/route.js

import { NextResponse } from 'next/server';
import { Category } from '@/models/Category';
import { sequelize } from '@/lib/db';

export async function POST(req) {
  try {
    await sequelize.sync();
    const body = await req.json();

    const newCategory = await Category.create({
      name: body.name,
      image: body.image || '', // Accept image if provided
    });

    return NextResponse.json(newCategory);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await sequelize.sync();
    const categories = await Category.findAll();
    return NextResponse.json(categories);
  } catch (err) {
    console.error('[CATEGORIES_GET_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
