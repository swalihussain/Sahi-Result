import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function isAdminAuthenticated() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
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

