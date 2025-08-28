import { NextResponse } from 'next/server';
import { Category } from '@/models'; // Assuming '@/models' maps to your models directory
import { getSellerFromToken } from '@/lib/get-seller-from-token'; // Assuming this utility exists

// GET all categories for the authenticated seller
export async function GET(req) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await Category.findAll({
      where: { sellerId: seller.sellerId }, // DATA ISOLATION
      order: [['name', 'ASC']],
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error('[CATEGORIES_GET_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST a new category for the authenticated seller
export async function POST(req) {
  const seller = await getSellerFromToken(req);
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json(); // Correctly parse JSON body
    const { name, image } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }

    const newCategory = await Category.create({
      name,
      image: image || null,
      sellerId: seller.sellerId,
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('[CATEGORY_POST_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
