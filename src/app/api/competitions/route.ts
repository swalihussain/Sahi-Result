import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
    try {
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        const snapshot = await firestore.collection('competitions').orderBy('created_at', 'desc').get();
        const competitions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return NextResponse.json(competitions);
    } catch (error) {
        console.error('Firestore competitions GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const { name, date, category } = data;

        if (!name || !date || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        const docRef = await firestore.collection('competitions').add({
            ...data,
            created_at: new Date().toISOString(),
            results_only: data.results_only || 0
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error) {
        console.error('Firestore competitions POST error:', error);
        return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
    }
}
