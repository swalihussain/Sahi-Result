import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file received.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storagePath = `${folder}/${filename}`;
        
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(storagePath);

        return NextResponse.json({ success: true, fileUrl: publicUrlData.publicUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: 'Failed to upload file to cloud storage.' }, { status: 500 });
    }
}
