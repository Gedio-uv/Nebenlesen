'use client';

import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

type Block = {
  id: string;
  type: 'h1' | 'h2' | 'p' | 'image';
  content?: string;
  src?: string;
  alt?: string;
};

type NativeReaderProps = {
  blocks: Block[];
  onTextSelected: (text: string) => void;
};

export default function NativeReader({ blocks, onTextSelected }: NativeReaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const lastEmittedText = useRef<string>('');

  // Global selection change listener for cross-device support (Desktop, iPad, Mobile)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleSelectionChange = () => {
      clearTimeout(timeoutId);
      // Debounce the selection to avoid triggering while the user is still dragging
      timeoutId = setTimeout(() => {
        const selection = window.getSelection();
        if (selection) {
          const text = selection.toString().trim();
          // Only trigger if we have text and it's different from the last selection
          // This prevents duplicate API calls
          if (text.length > 0 && text !== lastEmittedText.current) {
            lastEmittedText.current = text;
            onTextSelected(text);
          }
        }
      }, 600);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      clearTimeout(timeoutId);
    };
  }, [onTextSelected]);

  return (
    <div className="w-full h-full flex flex-col bg-[#e5e5e5] dark:bg-[#1f2937]">
      {/* Toolbar */}
      <div className="glass-panel rounded-none border-t-0 border-l-0 border-r-0 border-b border-[var(--color-panel-border)] p-4 flex items-center justify-between z-10 shrink-0 bg-white/70 dark:bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-teal)] to-[var(--color-brand-indigo)] tracking-tight">
            Nebenlesen
          </div>
          <div className="w-px h-6 bg-[var(--color-panel-border)]"></div>
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <span className="font-medium text-sm">Native DOM Render</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="text-[var(--color-brand-teal)] hover:text-white px-3 py-1 glass-card rounded-md cursor-pointer text-sm font-medium"
          >
            {language === 'en' ? '中文' : 'English'}
          </button>
        </div>
      </div>

      {/* Document Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-12 md:p-20 flex justify-center">
        <div className="max-w-4xl w-full bg-white dark:bg-neutral-900 shadow-2xl p-10 md:p-16 rounded-xl text-black dark:text-neutral-100 selection:bg-[var(--color-brand-teal)] selection:text-white">
          {blocks.length === 0 ? (
            <p className="text-center text-gray-500">{t.loadingPdf}</p>
          ) : (
            <div className="flex flex-col gap-6">
              {blocks.map((block) => {
                switch (block.type) {
                  case 'h1':
                    return <h1 key={block.id} className="text-4xl font-extrabold mb-4 mt-6 leading-tight text-neutral-900 dark:text-white">{block.content}</h1>;
                  case 'h2':
                    return <h2 key={block.id} className="text-2xl font-bold mb-3 mt-5 leading-snug text-neutral-800 dark:text-neutral-200">{block.content}</h2>;
                  case 'image':
                    return block.src ? (
                      <div key={block.id} className="w-full my-8 flex justify-center">
                        <img src={block.src} alt={block.alt || 'Extracted image'} className="max-w-full h-auto rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700" />
                      </div>
                    ) : null;
                  case 'p':
                  default:
                    return <p key={block.id} className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300 font-serif tracking-wide">{block.content}</p>;
                }
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
