# Nebenlesen

Nebenlesen is an elegant, AI-powered PDF reader designed specifically for language learners. It allows you to seamlessly read German texts and instantly translate, autocorrect, and grammatically analyze any word or phrase you highlight using Groq's high-speed LLM APIs.

## Features
- **Instant Translation & Grammar**: Highlight any word or sentence to see its translation, alternative meanings, part of speech, tense, article, and grammatical explanation.
- **AI Autocorrect**: In case of PDF text layer selection cutoff (e.g., highlighting "zuers" instead of "zuerst"), the AI automatically detects and corrects the intended word.
- **Continuous Smooth Scrolling**: Effortlessly scroll through all PDF pages without pagination interruptions, complete with zoom controls.
- **Full Localization**: Toggle the entire UI and the AI analysis output language between English and Simplified Chinese instantly.
- **Premium UI**: Built with a sleek, responsive, glassmorphic design featuring seamless side-panel animations.

## Getting Started

First, set your Groq API key in a `.env.local` file:
```env
GROQ_API_KEY=your_api_key_here
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Upload a German PDF and start learning!
