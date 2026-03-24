import { NextResponse } from 'next/server';
import { getDbConnection, initDb } from '@/lib/db';
const PDFParser = require('pdf2json');
import fs from 'fs/promises';
import path from 'path';

initDb().catch(console.error);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const competitionId = formData.get('competition_id') as string | null;

        if (!file || !competitionId) {
            return NextResponse.json({ error: 'Missing file or competition ID' }, { status: 400 });
        }

        // Process File specific logic to save PDF locally for URL linking
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const filename = `${new Date().getTime()}-${file.name.replace(/\s+/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);
        const result_pdf_url = `/uploads/${filename}`;

        // Extract Text natively from the PDF utilizing pdf2json
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
            return NextResponse.json({ error: 'Failed to read text from the PDF. Upload a valid text-embedded PDF instead of an image.' }, { status: 400 });
        }

        const textLines = rawText.split('\n').map((line: string) => line.trim());
        const db = await getDbConnection();
        const extractedResults = [];

        for (const line of textLines) {
            // Looking for lines like "1. Name, Team" or "1. Name - Team"
            const match = line.match(/^([123])\.?\s+(.+?)(?:\s*,\s*|\s+-\s+|\s+–\s+)(.+)$/);
            if (match) {
                const position = parseInt(match[1]);
                const participant = match[2].trim();
                const institution = match[3].trim();

                // Check if result already exists for this position in this competition
                const existing = await db.get(
                    'SELECT id FROM results WHERE competition_id = ? AND position = ?',
                    [competitionId, position]
                );
                if (existing) continue; // Skip existing positions so we don't duplicate on reparse

                // Auto Points Calculation (Default General logic: 10, 5, 2)
                const comp = await db.get('SELECT * FROM competitions WHERE id = ?', [competitionId]);
                const isGroup = comp?.category === 'GENERAL' || comp?.name?.toLowerCase().includes('group');
                let points = 0;
                if (isGroup) {
                    points = position === 1 ? 15 : position === 2 ? 10 : position === 3 ? 5 : 0;
                } else {
                    points = position === 1 ? 10 : position === 2 ? 5 : position === 3 ? 2 : 0;
                }

                // Try to find the matching Team
                // First exact match on Institution
                const teamMatch = await db.get('SELECT * FROM teams WHERE institution LIKE ? OR name LIKE ?', [`%${institution}%`, `%${institution}%`]);
                
                let team_id;
                if (!teamMatch) {
                    // Create Team dynamically since it was not found, to preserve database integrity
                    const tempName = institution + ' (' + new Date().getTime() + ')';
                    const runRes = await db.run(
                        'INSERT INTO teams (name, institution, total_points, wins) VALUES (?, ?, ?, ?)',
                        [tempName, institution, points, position === 1 ? 1 : 0]
                    );
                    team_id = runRes.lastID;
                } else {
                    team_id = teamMatch.id;
                    // Pre-allocate points for the team
                    await db.run('UPDATE teams SET total_points = total_points + ?, wins = wins + ? WHERE id = ?', [points, position === 1 ? 1 : 0, team_id]);
                }

                // Insert the Result mapping magically parsed!
                await db.run(
                    'INSERT INTO results (competition_id, team_id, position, points_awarded, participant_names, result_pdf_url) VALUES (?, ?, ?, ?, ?, ?)',
                    [competitionId, team_id, position, points, participant, result_pdf_url]
                );

                extractedResults.push({ position, participant, institution, points });
            }
        }

        if (extractedResults.length === 0) {
            return NextResponse.json({ error: 'PDF successfully read, but no readable 1st/2nd/3rd pattern (e.g. "1. Name, Team") found in document text.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, count: extractedResults.length, results: extractedResults });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
