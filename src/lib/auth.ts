import { cookies } from 'next/headers';

export async function isAdminAuthenticated() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth');
    return authCookie?.value === 'authenticated';
}
