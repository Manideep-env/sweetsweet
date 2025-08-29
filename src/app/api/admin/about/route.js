// src/app/api/admin/about/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { AboutPage } from '@/models';
import { sequelize } from '@/lib/db';

async function getSellerId() {
    const token = cookies().get('token')?.value;
    if (!token) return null;
    try {
        return (await verifyToken(token)).sellerId;
    } catch {
        return null;
    }
}

export async function GET() {
    const sellerId = await getSellerId();
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await sequelize.sync();
    const aboutPage = await AboutPage.findOrCreate({ where: { sellerId } });
    return NextResponse.json(aboutPage[0]);
}

export async function POST(req) {
    const sellerId = await getSellerId();
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    await sequelize.sync();
    const [aboutPage] = await AboutPage.findOrCreate({ where: { sellerId } });
    await aboutPage.update(body);
    return NextResponse.json(aboutPage);
}
