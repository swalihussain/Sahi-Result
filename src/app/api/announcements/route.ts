import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
    try {
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        const snapshot = await firestore.collection('announcements').orderBy('created_at', 'desc').get();
        const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(announcements);
    } catch (error) {
        console.error('Firestore announcements GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const { title, type, date } = data;

        if (!title || !type || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        const docRef = await firestore.collection('announcements').add({
            ...data,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error) {
        console.error('Firestore announcements POST error:', error);
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        await firestore.collection('announcements').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Firestore announcements DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }
}
