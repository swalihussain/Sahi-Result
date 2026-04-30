import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

        const filename = `${new Date().getTime()}-${file.name.replace(/\s+/g, '_')}`;
        const storagePath = `results/${filename}`;
        
        const { error: uploadError } = await supabase.storage.from('uploads').upload(storagePath, buffer, {
            contentType: file.type || 'application/pdf',
            upsert: true
        });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(storagePath);
        const result_pdf_url = publicUrlData.publicUrl;

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

        const { data: compData } = await supabase.from('competitions').select('*').eq('id', competitionId).single();
        const isGroup = compData?.category === 'GENERAL' || compData?.name?.toLowerCase().includes('group');

        for (const line of textLines) {
            const match = line.match(/^([123])\.?\s+(.+?)(?:\s*,\s*|\s+-\s+|\s+–\s+)(.+)$/);
            if (match) {
                const position = parseInt(match[1]);
                const participant = match[2].trim();
                const institution = match[3].trim();

                let points = 0;
                if (isGroup) {
                    points = position === 1 ? 15 : position === 2 ? 10 : position === 3 ? 5 : 0;
                } else {
                    points = position === 1 ? 10 : position === 2 ? 5 : position === 3 ? 2 : 0;
                }

                const { data: existing } = await supabase.from('results').select('id').eq('competition_id', competitionId).eq('position', position);
                if (existing && existing.length > 0) continue;

                const { data: teamSnap } = await supabase.from('teams').select('*').eq('institution', institution);
                let teamId;
                if (!teamSnap || teamSnap.length === 0) {
                    const { data: newTeam } = await supabase.from('teams').insert([{
                        name: institution,
                        institution: institution,
                        total_points: points,
                        wins: position === 1 ? 1 : 0
                    }]).select('id').single();
                    teamId = newTeam?.id;
                } else {
                    const teamDoc = teamSnap[0];
                    teamId = teamDoc.id;
                    await supabase.from('teams').update({
                        total_points: (teamDoc.total_points || 0) + points,
                        wins: (teamDoc.wins || 0) + (position === 1 ? 1 : 0)
                    }).eq('id', teamId);
                }

                await supabase.from('results').insert([{
                    competition_id: competitionId,
                    team_id: teamId,
                    position,
                    points_awarded: points,
                    participant_names: participant,
                    result_pdf_url
                }]);

                extractedResults.push({ position, participant, institution, points });
            }
        }

        if (extractedResults.length === 0) {
            return NextResponse.json({ error: 'No 1st/2nd/3rd patterns found in PDF.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, count: extractedResults.length, results: extractedResults });
    } catch (error: any) {
        console.error('Supabase parse-pdf error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
