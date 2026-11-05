import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'piano-playroom-super-secure-session-secret-key-2026'
);
const COOKIE_NAME = 'piano_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isAdminRoute = pathname.startsWith('/admin');
  const isTeacherRoute = pathname.startsWith('/teacher');
  const isParentRoute = pathname.startsWith('/parent');
  const isProtectedRoute = isAdminRoute || isTeacherRoute || isParentRoute;

  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, SESSION_SECRET);
      const role = payload.role as string;

      // Strict role isolation: users can ONLY access their own assigned portal
      if (isAdminRoute && role !== 'ADMIN') {
        const target = role === 'TEACHER' ? '/teacher' : '/parent';
        return NextResponse.redirect(new URL(target, request.url));
      }

      if (isTeacherRoute && role !== 'TEACHER') {
        const target = role === 'ADMIN' ? '/admin' : '/parent';
        return NextResponse.redirect(new URL(target, request.url));
      }

      if (isParentRoute && role !== 'PARENT') {
        const target = role === 'ADMIN' ? '/admin' : '/teacher';
        return NextResponse.redirect(new URL(target, request.url));
      }
    } catch (err) {
      // Session invalid or expired: clear cookie and route to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // Redirect authenticated user away from /login to their respective portal
  if (pathname === '/login' && token) {
    try {
      const { payload } = await jwtVerify(token, SESSION_SECRET);
      const role = payload.role as string;
      const target = role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/parent';
      return NextResponse.redirect(new URL(target, request.url));
    } catch {
      // Allow /login if token is malformed or expired
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
