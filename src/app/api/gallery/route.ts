import { NextResponse } from 'next/server';
import { readdir, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const galleryDir = path.join(process.cwd(), 'public/uploads/gallery');
        let files: string[] = [];
        try {
            files = await readdir(galleryDir);
        } catch (e) {
            // Directory might not exist yet, try creating it
            try {
                await mkdir(galleryDir, { recursive: true });
            } catch (err) {}
            return NextResponse.json([]);
        }

        // Sort files to show newest first
        files.sort((a, b) => b.localeCompare(a));
        
        // Filter only images and videos
        const imageUrls = files
            .filter(filename => /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg)$/i.test(filename))
            .map(filename => `/uploads/gallery/${filename}`);

        return NextResponse.json(imageUrls);
    } catch (error) {
        console.error('Gallery error:', error);
        return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { url } = await request.json();
        
        if (!url || typeof url !== 'string' || !url.startsWith('/uploads/gallery/')) {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }
        
        const filename = url.replace('/uploads/gallery/', '');
        const filePath = path.join(process.cwd(), 'public/uploads/gallery', filename);
        
        // Basic security check
        if (filePath.indexOf(path.join(process.cwd(), 'public/uploads/gallery')) !== 0) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }
        
        await unlink(filePath);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}
