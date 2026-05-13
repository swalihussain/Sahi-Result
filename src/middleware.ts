import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'ml'],

    // Used when no locale matches
    defaultLocale: 'en'
});

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Update Supabase session and get user
    const { response, user } = await updateSession(request, intlMiddleware);

    // 2. Handle Admin Security
    // Check if the path is an admin path but NOT the login page
    const segments = pathname.split('/').filter(Boolean);
    const isAdminPath = segments.includes('admin');
    const isLoginPage = segments[segments.length - 1] === 'admin';
    const isAdminRoute = isAdminPath && !isLoginPage;
    
    if (isAdminRoute) {
        if (!user) {
            const locale = (segments[0] === 'en' || segments[0] === 'ml') ? segments[0] : 'en';
            return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
        }
    }

    // 3. Handle Judge Security
    if (pathname.includes('/judgement')) {
        const judgeCookie = request.cookies.get('judge_auth');
        
        if (!judgeCookie?.value) {
            const segments = pathname.split('/');
            const locale = (segments[1] === 'en' || segments[1] === 'ml') ? segments[1] : 'en';
            return NextResponse.redirect(new URL(`/${locale}/judge-login`, request.url));
        }
    }

    // 4. Pass pathname to layout via Next.js internal header propagation
    // This makes x-pathname available to server components via headers().get('x-pathname')
    response.headers.set('x-middleware-request-x-pathname', pathname);
    
    return response;
}

export const config = {
    // Match only internationalized pathnames + admin dash
    // EXCLUDE api, _next, uploads, and all static files with extensions (like .png, .jpg)
    matcher: ['/((?!api|_next/static|_next/image|uploads|.*\\..*).*)']
};
