// src/app/api/admin/customization/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { sequelize } from '@/lib/db';
import { StoreCustomization } from '@/models/StoreCustomization'; // Ensure correct path
import { Seller } from '@/models/Seller'; // --- 1. IMPORT: Added the Seller model ---

// Helper function to get the authenticated seller's ID from the token
async function getSellerId() {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const decoded = await verifyToken(token);
        return decoded.sellerId;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

// Helper function to create a URL-friendly slug from a string
function createSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}


// --- 2. GET: Modified to fetch from both tables ---
export async function GET() {
    const sellerId = await getSellerId();
    if (!sellerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const seller = await Seller.findByPk(sellerId);
        if (!seller) {
            return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
        }

        // Find customization or create it if it doesn't exist yet
        const [customization] = await StoreCustomization.findOrCreate({
            where: { sellerId },
        });

        // Combine data from both models into a single response object
        const responseData = {
            storeName: seller.storeName,
            primaryColor: customization.primaryColor,
            backgroundColor: customization.backgroundColor,
            bannerImageUrl: customization.bannerImageUrl,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("GET /api/admin/customization error:", error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}


// --- 3. POST: Modified to update both tables within a transaction ---
export async function POST(req) {
    const sellerId = await getSellerId();
    if (!sellerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use a transaction to ensure both updates succeed or neither do.
    const t = await sequelize.transaction();

    try {
        const body = await req.json();
        const { storeName, primaryColor, backgroundColor, bannerImageUrl } = body;

        // --- Update Seller Table ---
        // Only update if storeName is provided
        if (storeName) {
            await Seller.update({
                storeName,
                storeSlug: createSlug(storeName) // Also update the slug for consistency
            }, {
                where: { id: sellerId },
                transaction: t
            });
        }
        
        // --- Update (or Insert) StoreCustomization Table ---
        // upsert is a convenient way to update a record or create it if it doesn't exist.
        await StoreCustomization.upsert({
            sellerId,
            primaryColor,
            backgroundColor,
            bannerImageUrl,
        }, {
            transaction: t
        });

        // If both operations were successful, commit the transaction
        await t.commit();

        return NextResponse.json({ success: true, message: 'Settings saved successfully!' });

    } catch (error) {
        // If any error occurred, roll back the transaction
        await t.rollback();
        console.error("POST /api/admin/customization error:", error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
