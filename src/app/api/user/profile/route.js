// src/app/api/user/profile/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { User, Address } from '@/models';
import { sequelize } from '@/lib/db';

// GET function remains the same
export async function GET() {
    // ... your existing GET logic ...
    const cookieStore = cookies();
    const token = cookieStore.get('user_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decoded = await verifyToken(token);
        await sequelize.sync();

        const user = await User.findByPk(decoded.userId, {
            attributes: ['id', 'fullName', 'email', 'phoneNumber'],
        });
        const addresses = await Address.findAll({ where: { userId: decoded.userId } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ user, addresses });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// --- NEW: PUT function to update user details ---
export async function PUT(req) {
    const cookieStore = cookies();
    const token = cookieStore.get('user_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decoded = await verifyToken(token);
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { fullName } = await req.json();
        if (!fullName) {
            return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
        }

        user.fullName = fullName;
        await user.save();

        // Return the updated user data (excluding password)
        const updatedUserData = {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
        };

        return NextResponse.json(updatedUserData);

    } catch (error) {
        console.error('[PROFILE_UPDATE_ERROR]', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
