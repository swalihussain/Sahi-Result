import { NextResponse } from 'next/server';
import { getFirestore, getStorageBucket } from '@/lib/firebase-admin';
const PDFParser = require('pdf2json');

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const competitionId = formData.get('competition_id') as string | null;

        if (!file || !competitionId) {
            return NextResponse.json({ error: 'Missing file or competition ID' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const firestore = getFirestore();
        const bucket = getStorageBucket();

        if (!firestore || !bucket) {
            return NextResponse.json({ error: 'Firebase not configured.' }, { status: 500 });
        }

        // Upload PDF to Storage
        const filename = `${new Date().getTime()}-${file.name.replace(/\s+/g, '_')}`;
        const storagePath = `results/${filename}`;
        const fileRef = bucket.file(storagePath);

        await fileRef.save(buffer, {
            metadata: { contentType: file.type || 'application/pdf' },
            public: true,
        });

        const result_pdf_url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

        // Extract Text
        const extractText = (): Promise<string> => {
            return new Promise((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1);
                pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                pdfParser.on("pdfParser_dataReady", () => {
                    resolve(pdfParser.getRawTextContent().replace(/\\r\\n/g, '\\n'));
                });
                pdfParser.parseBuffer(buffer);
            });
        };

        let rawText = "";
        try {
            rawText = await extractText();
        } catch (err) {
            console.error(err);
            return NextResponse.json({ error: 'Failed to read PDF text.' }, { status: 400 });
        }

        const textLines = rawText.split('\n').map((line: string) => line.trim());
        const extractedResults = [];

        // Fetch competition once
        const compDoc = await firestore.collection('competitions').doc(competitionId).get();
        const compData = compDoc.data();
        const isGroup = compData?.category === 'GENERAL' || compData?.name?.toLowerCase().includes('group');

        for (const line of textLines) {
            const match = line.match(/^([123])\.?\s+(.+?)(?:\s*,\s*|\s+-\s+|\s+–\s+)(.+)$/);
            if (match) {
                const position = parseInt(match[1]);
                const participant = match[2].trim();
                const institution = match[3].trim();

                // Points logic
                let points = 0;
                if (isGroup) {
                    points = position === 1 ? 15 : position === 2 ? 10 : position === 3 ? 5 : 0;
                } else {
                    points = position === 1 ? 10 : position === 2 ? 5 : position === 3 ? 2 : 0;
                }

                // Use Firestore transaction for team matching and updates
                await firestore.runTransaction(async (transaction) => {
                    // Check if result already exists
                    const existingQuery = firestore.collection('results')
                        .where('competition_id', '==', competitionId)
                        .where('position', '==', position);
                    const existingSnap = await transaction.get(existingQuery);
                    
                    if (!existingSnap.empty) return;

                    // Find or create team
                    const teamQuery = firestore.collection('teams')
                        .where('institution', '==', institution);
                    const teamSnap = await transaction.get(teamQuery);

                    let teamId;
                    if (teamSnap.empty) {
                        const newTeamRef = firestore.collection('teams').doc();
                        transaction.set(newTeamRef, {
                            name: institution,
                            institution: institution,
                            total_points: points,
                            wins: position === 1 ? 1 : 0,
                            created_at: new Date().toISOString()
                        });
                        teamId = newTeamRef.id;
                    } else {
                        const teamDoc = teamSnap.docs[0];
                        teamId = teamDoc.id;
                        transaction.update(teamDoc.ref, {
                            total_points: (teamDoc.data().total_points || 0) + points,
                            wins: (teamDoc.data().wins || 0) + (position === 1 ? 1 : 0)
                        });
                    }

                    // Create result
                    const resultRef = firestore.collection('results').doc();
                    transaction.set(resultRef, {
                        competition_id: competitionId,
                        team_id: teamId,
                        position,
                        points_awarded: points,
                        participant_names: participant,
                        result_pdf_url,
                        created_at: new Date().toISOString()
                    });
                });

                extractedResults.push({ position, participant, institution, points });
            }
        }

        if (extractedResults.length === 0) {
            return NextResponse.json({ error: 'No 1st/2nd/3rd patterns found in PDF.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, count: extractedResults.length, results: extractedResults });
    } catch (error: any) {
        console.error('Firestore parse-pdf error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
