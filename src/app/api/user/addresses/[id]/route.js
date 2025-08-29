// src/app/api/user/addresses/[id]/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { Address } from '@/models';

async function authorize(req) {
    const cookieStore = cookies();
    const token = cookieStore.get('user_token')?.value;
    if (!token) return null;

    try {
        return await verifyToken(token);
    } catch (error) {
        return null;
    }
}

// --- UPDATE a specific address ---
export async function PUT(req, { params }) {
    const decoded = await authorize(req);
    if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const address = await Address.findOne({ where: { id: params.id, userId: decoded.userId } });
        if (!address) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        const body = await req.json();
        await address.update(body);

        return NextResponse.json(address);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
    }
}

// --- DELETE a specific address ---
export async function DELETE(req, { params }) {
    const decoded = await authorize(req);
    if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const address = await Address.findOne({ where: { id: params.id, userId: decoded.userId } });
        if (!address) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        await address.destroy();

        return NextResponse.json({ message: 'Address deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
    }
}
