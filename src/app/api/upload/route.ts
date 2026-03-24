import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = formData.get('folder') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file received.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename
        const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        // Determine upload directory
        let uploadDir = path.join(process.cwd(), 'public/uploads');
        let relativePath = '/uploads';

        if (folder && ['gallery', 'events', 'settings'].includes(folder)) {
            uploadDir = path.join(uploadDir, folder);
            relativePath = `/uploads/${folder}`;
            
            // Ensure subfolder exists
            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) {
                // Ignore if exists
            }
        }

        const filepath = path.join(uploadDir, filename);

        // Write file
        await writeFile(filepath, buffer);

        return NextResponse.json({ success: true, fileUrl: `${relativePath}/${filename}` });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }
}
