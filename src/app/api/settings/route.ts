import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
    try {
        const { data: settingsData, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        
        const settingsMap: Record<string, string> = {};
        (settingsData || []).forEach(doc => {
            settingsMap[doc.key] = doc.value;
        });
        
        return NextResponse.json(settingsMap);
    } catch (error) {
        console.error('Settings GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const data = await request.json();
        for (const [key, value] of Object.entries(data)) {
            await supabase.from('settings').upsert({ key, value: String(value) });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings POST error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
