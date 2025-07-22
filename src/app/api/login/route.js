import { NextResponse } from 'next/server';
import { Admin } from '@/models/Admin';
import { sequelize } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  const { username, password } = await req.json();
  await sequelize.sync();
  const admin = await Admin.findOne({ where: { username } });

  if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = await signToken({ id: admin.id, username: admin.username });

  const response = NextResponse.json({ message: 'Login successful' });
  response.cookies.set('token', token, {
    httpOnly: true,
    maxAge: 86400,
    path: '/',
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('token', '', { maxAge: 0, path: '/' });
  return response;
}
