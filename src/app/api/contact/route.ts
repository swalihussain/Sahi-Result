import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { name, email, message } = data;

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        await firestore.collection('messages').add({
            ...data,
            status: 'New',
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact submit error:', error);
        return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
    }
}

export async function GET() {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        const snapshot = await firestore.collection('messages').orderBy('created_at', 'desc').get();
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return NextResponse.json(messages);
    } catch (error) {
        console.error('Messages fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, status } = await request.json();
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        await firestore.collection('messages').doc(id).update({ status });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message update error:', error);
        return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await firestore.collection('messages').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message delete error:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}
