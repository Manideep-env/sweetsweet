// src/app/api/login/route.js
import { NextResponse } from 'next/server';
import { Seller } from '@/models'; // Changed from Admin
import { sequelize } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  const { email, password } = await req.json(); // Changed from username
  
  await sequelize.sync();

  // Find seller by email
  const seller = await Seller.findOne({ where: { email } });

  if (!seller) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const match = await bcrypt.compare(password, seller.password_hash);
  if (!match) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // --- CRITICAL CHANGE: Sign token with sellerId ---
  const token = await signToken({ 
    sellerId: seller.id, // The essential piece of info for multi-tenancy
    email: seller.email,
    storeName: seller.storeName
  });

  const response = NextResponse.json({ message: 'Login successful' });
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400, // 24 hours
    path: '/',
  });

  return response;
}

// DELETE remains the same for logout
export async function DELETE() {
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('token', '', { maxAge: 0, path: '/' });
  return response;
}