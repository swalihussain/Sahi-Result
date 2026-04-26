import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getStorageBucket } from '@/lib/firebase-admin';

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

        const bucket = getStorageBucket();
        if (!bucket) {
            return NextResponse.json({ error: 'Cloud storage is not configured.' }, { status: 500 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename
        const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storagePath = `${folder}/${filename}`;
        
        const fileRef = bucket.file(storagePath);

        // Upload to Firebase Storage
        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
            public: true, // Make publicly accessible
        });

        // Generate the public URL
        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

        return NextResponse.json({ success: true, fileUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: 'Failed to upload file to cloud storage.' }, { status: 500 });
    }
}
