// middleware.js
import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  if (isAdminPath) {
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'], // protect /admin route
};
