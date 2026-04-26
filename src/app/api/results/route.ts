import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const compId = searchParams.get('competition_id');

        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        let query = firestore.collection('results').orderBy('position', 'asc');
        if (compId) {
            query = query.where('competition_id', '==', compId);
        }

        const snapshot = await query.get();
        const results = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            
            // Enrich with team and competition data
            const teamDoc = await firestore.collection('teams').doc(data.team_id).get();
            const compDoc = await firestore.collection('competitions').doc(data.competition_id).get();
            
            const teamData = teamDoc.exists ? teamDoc.data() : {};
            const compData = compDoc.exists ? compDoc.data() : {};

            return {
                id: doc.id,
                ...data,
                team_name: teamData?.name,
                institution: teamData?.institution,
                competition_name: compData?.name,
                template_image: compData?.template_image,
                category: compData?.category
            };
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error('Firestore results GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const { competition_id, team_id, position, points_awarded } = data;

        if (!competition_id || !team_id || !position || !points_awarded) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        // Check if result already exists for this competition and position
        const existing = await firestore.collection('results')
            .where('competition_id', '==', competition_id)
            .where('position', '==', position)
            .get();
            
        if (!existing.empty) {
            return NextResponse.json({ error: 'Result for this position already uploaded' }, { status: 400 });
        }

        const docRef = await firestore.collection('results').add({
            ...data,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error) {
        console.error('Firestore results POST error:', error);
        return NextResponse.json({ error: 'Failed to add result' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const compId = searchParams.get('competition_id');

        if (!compId) {
            return NextResponse.json({ error: 'Missing competition_id' }, { status: 400 });
        }

        const firestore = getFirestore();
        if (!firestore) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });

        const snapshot = await firestore.collection('results').where('competition_id', '==', compId).get();
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Firestore results DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete results' }, { status: 500 });
    }
}
