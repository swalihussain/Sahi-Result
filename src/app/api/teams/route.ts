import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const grouped = searchParams.get('grouped');
        
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });
        
        if (grouped === 'true') {
            const snapshot = await firestore.collection('unit_points').orderBy('total_points', 'desc').get();
            const units = snapshot.docs.map((doc, i) => ({ 
                id: doc.id,
                name: doc.data().institution,
                ...doc.data() 
            }));
            return NextResponse.json(units);
        }

        const snapshot = await firestore.collection('teams').orderBy('total_points', 'desc').get();
        const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(teams);
    } catch (error) {
        console.error('Firestore teams GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const { name, institution } = data;

        if (!name || !institution) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        const docRef = await firestore.collection('teams').add({
            ...data,
            total_points: 0,
            wins: 0,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error) {
        console.error('Firestore teams POST error:', error);
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }
}
