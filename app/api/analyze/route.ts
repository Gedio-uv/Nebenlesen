import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    const targetLang = language === 'zh' ? 'Simplified Chinese' : 'English';

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY is not set. Returning mock response for UI testing.");
      // Return a mock response if API key is missing so the user can test the UI
      return NextResponse.json({
        translation: "[Mock] The girl",
        type: "noun",
        gender_and_article: "das",
        short_explanation: "API key is missing. This is a mock response to verify the UI.",
      });
    }

    const systemPrompt = `You are a strict German language expert API. The user will provide a German word or sentence, which might be slightly cut off due to PDF selection issues (e.g., "zuers" instead of "zuerst").
Your goal is to identify the correct word/sentence, translate it to ${targetLang}, and provide grammatical context for a B1 level student. 
CRITICAL: ALL text values in your JSON response (including translation, alternative meanings, part of speech, tense, and explanation) MUST be written entirely in ${targetLang}. Do not use English or German for these descriptions if ${targetLang} is Simplified Chinese.
You MUST respond strictly with a valid JSON object. No markdown formatting, no code blocks, just raw JSON.
The JSON must have the following structure:
{
  "corrected_word": "The complete, grammatically correct German word or sentence in German. Fix any missing letters.",
  "translation": "${targetLang} translation in the given context",
  "alternative_meanings": ["meaning 1 in ${targetLang}", "meaning 2 in ${targetLang}"], 
  "type": "Part of speech (e.g., noun, verb, phrase) translated to ${targetLang}",
  "gender_and_article": "If it is a noun, provide the definite article (der, die, das). Otherwise, omit this field or set to null.",
  "verb_tense": "If it is a verb or sentence with a clear tense, provide the tense name translated to ${targetLang}. Otherwise, omit or set to null.",
  "short_explanation": "Brief context regarding the grammatical rule or case, written in ${targetLang}."
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      model: 'llama-3.1-8b-instant', // Using a fast, active model
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from Groq");
    }

    const parsedJson = JSON.parse(content);
    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error('Error analyzing text:', error);
    return NextResponse.json({ error: 'Failed to analyze text' }, { status: 500 });
  }
}
