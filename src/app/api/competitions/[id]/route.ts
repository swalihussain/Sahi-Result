import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { isAdminAuthenticated } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const firestore = getFirestore();
    if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

    await firestore.collection('competitions').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Firestore competition DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete competition' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const firestore = getFirestore();
    if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

    await firestore.collection('competitions').doc(id).update({
        ...data,
        updated_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Firestore competition PUT error:', error);
    return NextResponse.json({ error: 'Failed to update competition' }, { status: 500 });
  }
}
