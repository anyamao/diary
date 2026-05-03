import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a simplified middleware - in production, verify the token properly
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register';
  const isDiaryPage = request.nextUrl.pathname.startsWith('/diary');

  // For now, we're relying on client-side auth
  // This middleware just passes through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
