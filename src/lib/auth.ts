import { cookies } from 'next/headers';

export async function isAdminAuthenticated() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth');
    return authCookie?.value === 'authenticated';
}

export async function isJudgeAuthenticated() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('judge_auth');
    return authCookie?.value !== undefined;
}

export async function getJudgeSession() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('judge_auth');
    if (!authCookie?.value) return null;
    try {
        return JSON.parse(authCookie.value);
    } catch {
        return null;
    }
}

