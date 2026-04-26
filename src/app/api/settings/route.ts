import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
    try {
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        const snapshot = await firestore.collection('settings').get();
        const settingsMap: Record<string, string> = {};
        snapshot.docs.forEach(doc => {
            settingsMap[doc.id] = doc.data().value;
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
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });
        
        const batch = firestore.batch();
        for (const [key, value] of Object.entries(data)) {
            const docRef = firestore.collection('settings').doc(key);
            batch.set(docRef, { value: String(value) });
        }
        await batch.commit();
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings POST error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
