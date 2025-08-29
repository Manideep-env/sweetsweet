// src/app/api/admin/upload-banner/route.js
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises'; // <-- Import mkdir
import path from 'path';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getSellerId() {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const decoded = await verifyToken(token);
        return decoded.sellerId;
    } catch (error) {
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

        // --- FIX: Ensure the directory exists before writing the file ---
        await mkdir(uploadDir, { recursive: true });
        
        await writeFile(uploadPath, buffer);

        const publicPath = `/uploads/banners/${filename}`;
        return NextResponse.json({ success: true, url: publicPath });

    } catch (error) {
        console.error('[BANNER_UPLOAD_ERROR]', error);
        return NextResponse.json({ error: 'File upload failed.' }, { status: 500 });
    }
}
