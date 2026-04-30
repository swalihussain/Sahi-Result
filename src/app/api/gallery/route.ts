import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

export const revalidate = 60;

export async function GET() {
    try {
        const { data: files, error } = await supabase.storage.from('uploads').list('gallery', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'desc' },
        });

        if (error) throw error;

        const imageUrls = files
            .filter((file: any) => /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg)$/i.test(file.name))
            .map((file: any) => {
                const { data } = supabase.storage.from('uploads').getPublicUrl(`gallery/${file.name}`);
                return data.publicUrl;
            });

        return NextResponse.json(imageUrls);
    } catch (error) {
        console.error('Gallery error:', error);
        return NextResponse.json({ error: 'Failed to load cloud gallery' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { url } = await request.json();
        
        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        const storagePath = url.split('/uploads/')[1];
        if (!storagePath) {
            return NextResponse.json({ error: 'URL does not match cloud storage bucket' }, { status: 400 });
        }
        
        const { error } = await supabase.storage.from('uploads').remove([storagePath]);
        if (error) throw error;
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Failed to delete file from cloud' }, { status: 500 });
    }
}
