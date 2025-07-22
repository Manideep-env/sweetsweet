import { NextResponse } from 'next/server';
import { Category } from '@/models/Category';
import { sequelize } from '@/lib/db';

// Update a category
export async function PUT(req, { params }) {
  const { id } = params;
  try {
    await sequelize.sync();
    const body = await req.json();

    const category = await Category.findByPk(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    category.name = body.name;
    await category.save();

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a category
export async function DELETE(_, { params }) {
  const { id } = params;
  try {
    await sequelize.sync();

    const category = await Category.findByPk(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await category.destroy();
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
