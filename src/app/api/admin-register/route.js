import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Admin } from '@/models/Admin';
import { sequelize } from '@/lib/db';

export async function POST(req) {
  const { username, password } = await req.json();

  await sequelize.sync();

  const existing = await Admin.findOne({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: 'Admin already exists' }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 10);
  await Admin.create({ username, password_hash });

  return NextResponse.json({ message: 'Admin registered' });
}
