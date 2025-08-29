// src/app/api/admin/customization/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { StoreCustomization } from '@/models';
import { sequelize } from '@/lib/db';

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

// GET current customization settings
export async function GET() {
    const sellerId = await getSellerId();
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await sequelize.sync();
    const customization = await StoreCustomization.findOrCreate({
        where: { sellerId },
    });

    return NextResponse.json(customization[0]);
}

// SAVE new customization settings
export async function POST(req) {
    const sellerId = await getSellerId();
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { primaryColor, backgroundColor, bannerImageUrl } = body;

        await sequelize.sync();
        const [customization] = await StoreCustomization.findOrCreate({
            where: { sellerId },
        });

        customization.primaryColor = primaryColor;
        customization.backgroundColor = backgroundColor;
        customization.bannerImageUrl = bannerImageUrl;
        await customization.save();

        return NextResponse.json(customization);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
