    // src/app/api/user/verify/route.js
    import { NextResponse } from 'next/server';
    import { cookies } from 'next/headers';
    import { verifyToken } from '@/lib/auth'; // Assuming your verify function is here

    export async function GET() {
      console.log("--- Verify API Route Hit ---");
      const cookieStore = await cookies();
      const token = cookieStore.get('user_token')?.value;

      if (!token) {
        console.log("Verification failed: No 'user_token' cookie found.");
        return NextResponse.json({ error: 'Unauthorized: No token' }, { status: 401 });
      }

      console.log("Found token:", token);

      try {
        const decoded = await verifyToken(token);
        console.log("Token decoded successfully:", decoded);
        
        // Ensure the decoded token has the necessary user info
        if (!decoded.userId || !decoded.fullName) {
             console.error("Verification error: Token is missing required user data.");
             return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
        }

        return NextResponse.json({ 
            id: decoded.userId, 
            email: decoded.email,
            fullName: decoded.fullName 
        });
      } catch (error) {
        console.error("Verification error: Token is invalid or expired.", error.message);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }
    