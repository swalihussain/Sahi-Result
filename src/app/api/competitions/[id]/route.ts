import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = params;
        const db = await getDbConnection();
        await db.run('DELETE FROM competitions WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete competition' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = params;
        const { name, date, category, competition_type, template_image, serial_number, match_number, results_only } = await request.json();
        
        const db = await getDbConnection();
        await db.run(
            'UPDATE competitions SET name = ?, date = ?, category = ?, competition_type = ?, template_image = ?, serial_number = ?, match_number = ?, results_only = ? WHERE id = ?',
            [name, date, category, competition_type || null, template_image, serial_number || null, match_number || null, results_only || 0, id]
        );
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update competition' }, { status: 500 });
    }
}
