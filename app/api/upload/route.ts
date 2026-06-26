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

    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY is not set.");
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    // Prompt the LLM to structure the messy PDF text
    const systemPrompt = `You are an expert document structural parser. Your task is to take messy, raw text extracted from a PDF and format it into a clean, semantic JSON format.
    
The raw text may have broken ligatures, missing spaces, merged words, or incorrect line breaks due to the PDF extraction process. You must FIX these issues and clean the German text.

You MUST respond strictly with a valid JSON object. Do not use markdown wrappers like \`\`\`json.
The JSON object must have a property called "blocks" which is an array of objects representing the document structure.
Each object in the "blocks" array must match this structure:
{
  "id": "unique_string_id",
  "type": "h1" | "h2" | "p",
  "content": "The cleaned, properly spaced German text for this block"
}

Rules:
- Identify titles/headers and use "h1" or "h2".
- Identify paragraphs and use "p".
- Fix broken ligatures (e.g., if you see "A uflösung", fix it to "Auflösung").
- Merge sentences that were split by page breaks or line breaks into single cohesive paragraphs.
- Omit irrelevant PDF artifacts (like page numbers or gibberish).
- DO NOT translate the text. Keep it in the original language.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText.substring(0, 20000) } // Prevent token limit explosion
      ],
      model: 'llama-3.1-8b-instant', // fast active model
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from Groq");
    }

    let parsedBlocks = [];
    try {
      const parsedJson = JSON.parse(content);
      if (parsedJson.blocks && Array.isArray(parsedJson.blocks)) {
        parsedBlocks = parsedJson.blocks;
      } else {
        parsedBlocks = Object.values(parsedJson).find(val => Array.isArray(val)) || [];
      }
    } catch (e) {
      throw new Error("Failed to parse JSON blocks");
    }

    return NextResponse.json({ blocks: parsedBlocks });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
  }
}
