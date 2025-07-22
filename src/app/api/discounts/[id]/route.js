// app/api/discounts/[id]/route.js
import { Discount } from '@/models/Discount';
import { NextResponse } from 'next/server';

// PUT: Update a discount
// app/api/discounts/[id]/route.js
export async function PUT(req, { params }) {
  const { id } = params;
  const data = await req.json();

  try {
    const discount = await Discount.findByPk(id);
    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    const { productId, categoryId, percentage, startDate, endDate } = data;

    if ((!productId && !categoryId) || (productId && categoryId)) {
      return NextResponse.json(
        { error: 'Specify either productId or categoryId (not both)' },
        { status: 400 }
      );
    }

    await discount.update({
      productId: productId || null,
      categoryId: categoryId || null,
      percentage,
      startDate,
      endDate,
    });

    return NextResponse.json(discount);
  } catch (err) {
    console.error('[DISCOUNT_UPDATE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
  }
}


// DELETE: Remove a discount
export async function DELETE(_, { params }) {
  const { id } = params;

  try {
    const discount = await Discount.findByPk(id);
    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    await discount.destroy();
    return NextResponse.json({ message: 'Discount deleted' });
  } catch (err) {
    console.error('[DISCOUNT_DELETE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
  }
}
