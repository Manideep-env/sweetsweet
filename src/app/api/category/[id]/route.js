// src/app/api/category/[id]/route.js
import { NextResponse } from 'next/server';
import { Category } from '@/models';
import { getSellerFromToken } from '@/lib/get-seller-from-token';

// PUT: Update a category owned by the authenticated seller
export async function PUT(req, { params }) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();

    // DATA ISOLATION: Find category by its ID and the seller's ID
    const category = await Category.findOne({
      where: { id, sellerId: seller.sellerId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found or permission denied.' }, { status: 404 });
    }

    await category.update({ name: body.name, image: body.image });
    return NextResponse.json(category);
  } catch (error) {
    console.error('[CATEGORY_PUT_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a category owned by the authenticated seller
export async function DELETE(req, { params }) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    // DATA ISOLATION: Ensure the category being deleted belongs to the seller
    const category = await Category.findOne({
      where: { id, sellerId: seller.sellerId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found or permission denied.' }, { status: 404 });
    }

    // You might want to add logic here to handle products associated with this category
    await category.destroy();
    return NextResponse.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('[CATEGORY_DELETE_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}