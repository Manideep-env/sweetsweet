// src/app/api/sellers/register/route.js
import { NextResponse } from 'next/server';
import { Seller } from '@/models'; // Make sure your jsconfig.json paths are set up
import bcrypt from 'bcryptjs';
import slugify from 'slugify';

export async function POST(req) {
  try {
    const { fullName, email, password, storeName } = await req.json();

    // --- Basic Validation ---
    if (!fullName || !email || !password || !storeName) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // --- Check for existing seller ---
    const existingSeller = await Seller.findOne({ where: { email } });
    if (existingSeller) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
    }

    // --- Hash password ---
    const password_hash = await bcrypt.hash(password, 10);

    // --- Create a unique store slug ---
    let storeSlug = slugify(storeName, { lower: true, strict: true });
    const existingSlug = await Seller.findOne({ where: { storeSlug } });
    if (existingSlug) {
      // Append a random suffix if the slug is taken
      storeSlug = `${storeSlug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // --- Create the seller record ---
    const newSeller = await Seller.create({
      fullName,
      email,
      password_hash,
      storeName,
      storeSlug,
    });
    
    // --- Respond without sensitive data ---
    const sellerData = {
        id: newSeller.id,
        fullName: newSeller.fullName,
        email: newSeller.email,
        storeName: newSeller.storeName,
        storeSlug: newSeller.storeSlug,
    };

    return NextResponse.json(sellerData, { status: 201 });

  } catch (error) {
    console.error('[SELLER_REGISTER_ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}