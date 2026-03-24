import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'ml'],

    // Used when no locale matches
    defaultLocale: 'en'
});

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Handle Admin Security
    if (pathname.includes('/admin/dashboard')) {
        const authCookie = request.cookies.get('admin_auth');
        
        if (authCookie?.value !== 'authenticated') {
            const segments = pathname.split('/');
            const locale = (segments[1] === 'en' || segments[1] === 'ml') ? segments[1] : 'en';
            return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
        }
    }

    // 2. Handle Internationalization
    const response = intlMiddleware(request);
    
    // 3. Pass pathname to layout via Next.js internal header propagation
    // This makes x-pathname available to server components via headers().get('x-pathname')
    response.headers.set('x-middleware-request-x-pathname', pathname);
    
    return response;
}

export const config = {
    // Match only internationalized pathnames + admin dash
    // EXCLUDE api, _next, uploads, assets, etc.
    matcher: ['/((?!api|_next/static|_next/image|uploads|favicon.ico).*)']
};
