// src/app/api/verify/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth'; // Assuming your verify function is here

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value; // The seller token

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyToken(token);
    
    // The token payload should contain the storeName
    if (!decoded.sellerId || !decoded.storeName) {
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    // On success, return the decoded data
    return NextResponse.json({ 
        sellerId: decoded.sellerId, 
        storeName: decoded.storeName 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
