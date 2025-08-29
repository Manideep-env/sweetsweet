// src/app/api/user/addresses/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { Address } from '@/models';
import { sequelize } from '@/lib/db';

// GET function remains the same
export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('user_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyToken(token);
    await sequelize.sync();

    const addresses = await Address.findAll({
      where: { userId: decoded.userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 401 });
  }
}

// --- NEW: POST function to add a new address ---
export async function POST(req) {
  const cookieStore = cookies();
  const token = cookieStore.get('user_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyToken(token);
    const body = await req.json();

    const { fullName, phoneNumber, streetAddress, city, state, postalCode, isDefault } = body;

    // Basic validation
    if (!fullName || !phoneNumber || !streetAddress || !city || !state || !postalCode) {
        return NextResponse.json({ error: 'All address fields are required.' }, { status: 400 });
    }

    await sequelize.sync();

    const newAddress = await Address.create({
      userId: decoded.userId,
      fullName,
      phoneNumber,
      streetAddress,
      city,
      state,
      postalCode,
      isDefault: isDefault || false,
    });

    return NextResponse.json(newAddress, { status: 201 });

  } catch (error) {
    console.error('[ADDRESS_CREATE_ERROR]', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 500 });
  }
}
