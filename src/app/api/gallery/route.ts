import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { bucket } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // List files in the 'gallery' folder
        const [files] = await bucket.getFiles({ prefix: 'gallery/' });
        
        // Map to public URLs
        const imageUrls = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg)$/i.test(file.name))
            .map(file => `https://storage.googleapis.com/${bucket.name}/${file.name}`);

        // Sort by name (which starts with timestamp) to show newest first
        imageUrls.sort((a, b) => {
            const nameA = a.split('/').pop() || '';
            const nameB = b.split('/').pop() || '';
            return nameB.localeCompare(nameA);
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
        
        // Extract the path from the URL
        // Format: https://storage.googleapis.com/[BUCKET]/[PATH]
        const bucketName = bucket.name;
        const pathPrefix = `https://storage.googleapis.com/${bucketName}/`;
        
        if (!url.startsWith(pathPrefix)) {
            return NextResponse.json({ error: 'URL does not match cloud storage bucket' }, { status: 400 });
        }
        
        const storagePath = url.replace(pathPrefix, '');
        
        // Delete the file
        await bucket.file(storagePath).delete();
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Failed to delete file from cloud' }, { status: 500 });
    }
}
