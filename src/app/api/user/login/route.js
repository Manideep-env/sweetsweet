// src/app/api/user/login/route.js
import { NextResponse } from 'next/server';
import { User } from '@/models';
import { sequelize } from '@/lib/db';
import { signToken } from '@/lib/auth'; // Assuming you have a similar function for users
import bcrypt from 'bcryptjs';

export async function POST(req) {
  const { email, password } = await req.json();
  
  await sequelize.sync();

  // Find user by email
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // --- Sign token with userId ---
  const token = await signToken({ 
    userId: user.id,
    email: user.email,
    fullName: user.fullName
  });

  const response = NextResponse.json({ message: 'Login successful' });
  response.cookies.set('user_token', token, { // Use a different cookie name
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400, // 24 hours
    path: '/',
  });

  return response;
}

// DELETE remains the same for logout, just change the cookie name
export async function DELETE() {
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('user_token', '', { maxAge: 0, path: '/' });
  return response;
}
