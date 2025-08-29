// src/app/api/store/[slug]/about/route.js
import { NextResponse } from 'next/server';
import { Seller, AboutPage } from '@/models';
import { sequelize } from '@/lib/db';

export async function GET(req, { params }) {
    const { slug } = params;
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    await sequelize.sync();
    const aboutPage = await AboutPage.findOne({
        include: [{ model: Seller, where: { storeSlug: slug }, attributes: [] }]
    });

    if (!aboutPage) {
        // Return a default if the seller hasn't created one yet
        return NextResponse.json({ title: 'About Us', content: 'Welcome to our store!', imageUrl: null });
    }

    return NextResponse.json(aboutPage);
}
