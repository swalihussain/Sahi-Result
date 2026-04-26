import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
    try {
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        const settingsSnap = await firestore.collection('settings').get();
        const unitsSnap = await firestore.collection('unit_points').orderBy('points', 'desc').get();
        
        const config = settingsSnap.docs.reduce((acc: any, doc: any) => ({ ...acc, [doc.id]: doc.data().value }), {});
        const units = unitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return NextResponse.json({ settings: config, units });
    } catch (error) {
        console.error('Firestore status GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { heading, units } = await request.json();
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });
        
        if (heading) {
            await firestore.collection('settings').doc('points_heading').set({ value: heading });
        }
        
        if (units && Array.isArray(units)) {
            const batch = firestore.batch();
            for (const u of units) {
                const docRef = firestore.collection('unit_points').doc(u.institution);
                batch.set(docRef, { institution: u.institution, points: u.points });
            }
            await batch.commit();
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Firestore status PUT error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
