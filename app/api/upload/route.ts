import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse-new';
import Groq from 'groq-sdk';

export const maxDuration = 60;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract raw text
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;

    // Split text into paragraphs using regex (double newlines)
    const paragraphs = rawText.split(/\n\s*\n/);
    
    const parsedBlocks = paragraphs
      .map((para, index) => ({
        id: `block_${index}`,
        type: 'p',
        content: para.replace(/\n/g, ' ').trim()
      }))
      .filter(block => block.content.length > 0);

    return NextResponse.json({ blocks: parsedBlocks });

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: error.message || 'Failed to process PDF' }, { status: 500 });
  }
}
