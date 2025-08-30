// src/app/api/admin/upload-banner/route.js
import { NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp'; // <-- Add sharp
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getSellerId() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = await verifyToken(token);
    return decoded.sellerId;
  } catch {
    return null;
  }
}

export async function POST(req) {
  const sellerId = await getSellerId();
  if (!sellerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const filename = `${sellerId}-${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadDir = path.join(process.cwd(), 'public/uploads/banners');
    const uploadPath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });

    // --- Resize to 1500x500 using sharp ---
    await sharp(buffer)
      .resize(1500, 500, { fit: 'cover' }) // 'cover' crops to fit nicely
      .toFile(uploadPath);

    const publicPath = `/uploads/banners/${filename}`;
    return NextResponse.json({ success: true, url: publicPath });
  } catch (error) {
    console.error('[BANNER_UPLOAD_ERROR]', error);
    return NextResponse.json({ error: 'File upload failed.' }, { status: 500 });
  }
}
