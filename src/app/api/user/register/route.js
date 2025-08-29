// src/app/api/user/register/route.js
import { NextResponse } from 'next/server';
import { User } from '@/models';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { fullName, email, password, phoneNumber } = await req.json();

    // --- Basic Validation ---
    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'Full name, email, and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // --- Check for existing user ---
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
    }

    // --- Hash password ---
    const password_hash = await bcrypt.hash(password, 10);

    // --- Create the user record ---
    const newUser = await User.create({
      fullName,
      email,
      password_hash,
      phoneNumber,
    });
    
    // --- Respond without sensitive data ---
    const userData = {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
    };

    return NextResponse.json(userData, { status: 201 });

  } catch (error) {
    console.error('[USER_REGISTER_ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
