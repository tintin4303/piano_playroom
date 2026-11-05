import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'piano-playroom-super-secure-session-secret-key-2026'
);
const COOKIE_NAME = 'piano_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Protected route prefixes
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/parent');

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, SESSION_SECRET);
      const role = payload.role as string;

      // Role authorization guards
      if (pathname.startsWith('/admin') && role !== 'ADMIN') {
        return NextResponse.redirect(new URL(role === 'TEACHER' ? '/teacher' : '/parent', request.url));
      }
      if (pathname.startsWith('/teacher') && role !== 'TEACHER' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/parent', request.url));
      }
    } catch (err) {
      // Invalid / expired token
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // Redirect authenticated user away from /login
  if (pathname === '/login' && token) {
    try {
      const { payload } = await jwtVerify(token, SESSION_SECRET);
      const role = payload.role as string;
      const destination = role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/parent';
      return NextResponse.redirect(new URL(destination, request.url));
    } catch {
      // Token expired, allow /login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/parent/:path*',
    '/login',
  ],
};
