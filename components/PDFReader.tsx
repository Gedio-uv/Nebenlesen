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
  const [containerWidth, setContainerWidth] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastEmittedText = useRef<string>('');
  
  // OCR State
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrWords, setOcrWords] = useState<any[]>([]);

  // Measure container width for responsive PDF sizing
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Subtract 64px for the p-8 (32px) padding on each side
        setContainerWidth(entry.contentRect.width - 64);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Reset OCR when page changes
  useEffect(() => {
    setOcrWords([]);
  }, [pageNumber, file]);

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

  const runOCR = async () => {
    // Find the canvas rendered by react-pdf
    const canvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('Could not find the PDF canvas. Please wait for it to load completely.');
      return;
    }

    setIsOcrRunning(true);
    setOcrProgress(0);
    setOcrWords([]);

    try {
      const Tesseract = (await import('tesseract.js')).default;
      
      const result = await Tesseract.recognize(
        canvas,
        'deu', // German language model
        { 
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          } 
        }
      );

      // Extract words and their bounding boxes
      const words = (result.data as any).words.map((w: any) => ({
        text: w.text,
        bbox: w.bbox
      }));
      
      setOcrWords(words);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to run OCR. See console for details.');
    } finally {
      setIsOcrRunning(false);
    }
  };

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
                disabled={pageNumber <= 1 || isOcrRunning}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-[var(--color-text-secondary)] hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium text-[var(--color-text-secondary)] min-w-[3rem] text-center">
                {pageNumber} / {numPages}
              </span>
              <button 
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages || isOcrRunning}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-[var(--color-text-secondary)] hover:text-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
              
              <div className="w-px h-6 bg-[var(--color-panel-border)] mx-2"></div>
              
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} disabled={isOcrRunning} className="p-1 rounded hover:bg-white/10 disabled:opacity-30 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                <ZoomOut size={18} />
              </button>
              <span className="text-xs font-medium text-[var(--color-text-secondary)] min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button onClick={() => setScale(s => Math.min(3, s + 0.25))} disabled={isOcrRunning} className="p-1 rounded hover:bg-white/10 disabled:opacity-30 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                <ZoomIn size={18} />
              </button>

              <div className="w-px h-6 bg-[var(--color-panel-border)] mx-2"></div>
              
              {/* OCR Button */}
              <button 
                onClick={runOCR}
                disabled={isOcrRunning || ocrWords.length > 0}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-[var(--color-brand-indigo)] hover:bg-[var(--color-brand-teal)] text-white disabled:opacity-50 disabled:bg-neutral-600 transition-colors flex items-center gap-2"
              >
                {isOcrRunning ? `Scanning... ${ocrProgress}%` : ocrWords.length > 0 ? 'OCR Active' : 'Scan Text (OCR)'}
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
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto flex items-start justify-center p-8 bg-[var(--color-bg-dark)] relative"
      >
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
              <div className="relative">
                <Page 
                  pageNumber={pageNumber} 
                  width={containerWidth ? containerWidth * scale : undefined}
                  scale={containerWidth ? 1 : scale} 
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="select-text"
                />
                
                {/* Artificial OCR Text Layer overlay */}
                {ocrWords.length > 0 && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-auto select-text" style={{ zIndex: 10 }}>
                    {ocrWords.map((word, i) => (
                      <span 
                        key={i}
                        className="absolute text-transparent select-text"
                        style={{
                          left: `${word.bbox.x0}px`,
                          top: `${word.bbox.y0}px`,
                          width: `${word.bbox.x1 - word.bbox.x0}px`,
                          height: `${word.bbox.y1 - word.bbox.y0}px`,
                          lineHeight: `${word.bbox.y1 - word.bbox.y0}px`,
                          fontSize: `${word.bbox.y1 - word.bbox.y0}px`,
                        }}
                      >
                        {word.text}{' '}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Document>
            
            {/* Global style overrides for the react-pdf text layer to improve selection visibility */}
            <style jsx global>{`
              .react-pdf__Page__textContent {
                opacity: 0.2;
              }
              .react-pdf__Page__textContent ::selection,
              .pdf-container span::selection {
                background: rgba(253, 224, 71, 0.6) !important; /* Noticeable bright yellow */
                color: transparent !important;
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
