'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { UploadCloud, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  onTextSelected: (text: string) => void;
}

export default function PDFReader({ onTextSelected }: PDFReaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const lastEmittedText = useRef<string>('');

  // iOS Safari touch selection fix
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleSelection = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const selection = window.getSelection();
        if (selection) {
          const text = selection.toString().trim();
          if (text.length > 0 && text !== lastEmittedText.current) {
            lastEmittedText.current = text;
            onTextSelected(text);
          }
        }
      }, 500); // Debounce to allow user to finish selecting
    };

    // Listen globally for selection changes and touch/mouse releases
    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('touchend', handleSelection);
    document.addEventListener('mouseup', handleSelection);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('mouseup', handleSelection);
      clearTimeout(timeoutId);
    };
  }, [onTextSelected]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPageNumber(1);
    }
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-bg-dark)]">
      {/* Top Toolbar */}
      <div className="glass-panel rounded-none border-t-0 border-l-0 border-r-0 border-b border-[var(--color-panel-border)] p-4 flex items-center justify-between z-10 shrink-0 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-teal)] to-[var(--color-brand-indigo)] tracking-tight">
            Nebenlesen
          </div>
          <div className="w-px h-6 bg-[var(--color-panel-border)]"></div>
          
          {file && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-[var(--color-text-secondary)] hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium text-[var(--color-text-secondary)] min-w-[3rem] text-center">
                {pageNumber} / {numPages}
              </span>
              <button 
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-[var(--color-text-secondary)] hover:text-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
              
              <div className="w-px h-6 bg-[var(--color-panel-border)] mx-2"></div>
              
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1 rounded hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                <ZoomOut size={18} />
              </button>
              <span className="text-xs font-medium text-[var(--color-text-secondary)] min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-1 rounded hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                <ZoomIn size={18} />
              </button>
            </div>
          )}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-[var(--color-bg-dark)]">
        {!file ? (
          <label className="glass-card flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed border-[var(--color-brand-indigo)] border-opacity-50 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer group mt-20">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloud size={48} className="text-[var(--color-brand-teal)] mb-4 group-hover:scale-110 transition-transform" />
              <p className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">{t.uploadTitle}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{t.uploadSubtitle}</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="application/pdf"
              onChange={onFileChange}
            />
          </label>
        ) : (
          <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white mb-20 pdf-container">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="p-20 text-black">{t.loadingPdf}</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="select-text"
              />
            </Document>
            
            {/* Global style overrides for the react-pdf text layer to improve selection visibility */}
            <style jsx global>{`
              .react-pdf__Page__textContent {
                opacity: 0.2; /* slightly visible for debugging if needed, but react-pdf handles it */
              }
              .react-pdf__Page__textContent ::selection {
                background: rgba(45, 212, 191, 0.4);
                color: transparent;
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
