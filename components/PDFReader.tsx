'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { UploadCloud, ZoomIn, ZoomOut } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { BookMarked, LogOut } from 'lucide-react';
import DrivePicker from './DrivePicker';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  onTextSelected: (text: string) => void;
  onViewModeChange: (mode: 'reader' | 'vocabulary') => void;
  onFileLoad: () => void;
}

export default function PDFReader({ onTextSelected, onViewModeChange, onFileLoad }: PDFReaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastEmittedText = useRef<string>('');
  
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
      onFileLoad(); // Tell the parent to open the SidePanel
    }
  }

  function handleDriveFileLoaded(driveFile: File) {
    setFile(driveFile);
    onFileLoad(); // Tell the parent to open the SidePanel
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const onPageLoadSuccess = async (page: any) => {
    // Only check the first page to determine if it's a scanned PDF
    if (page.pageNumber === 1) {
      try {
        const textContent = await page.getTextContent();
        if (!textContent || textContent.items.length === 0) {
          alert('This PDF appears to be a scanned image without readable text. Please upload a standard text-based PDF for translation to work.');
          setFile(null);
          setNumPages(0);
        }
      } catch (e) {
        console.error('Error reading PDF text:', e);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-bg-dark)]">
      {/* Top Toolbar */}
      <div className="glass-panel rounded-none border-t-0 border-l-0 border-r-0 border-b border-[var(--color-panel-border)] p-4 flex items-center justify-between z-10 shrink-0 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => { setFile(null); setNumPages(0); }}
            title="Upload a different file"
            className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-teal)] to-[var(--color-brand-indigo)] tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          >
            Nebenlesen
          </div>
          
          {file && (
            <>
              <div className="w-px h-6 bg-[var(--color-panel-border)]"></div>
              <div className="flex items-center gap-2">
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
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {file && (
            <button 
              onClick={() => onViewModeChange('vocabulary')}
              className="px-3 py-1.5 text-sm font-medium rounded text-[var(--color-brand-teal)] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <BookMarked size={16} /> My Vocabulary
            </button>
          )}
          
          <div className="w-px h-6 bg-[var(--color-panel-border)]"></div>
          
          <button 
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="text-[var(--color-brand-teal)] hover:text-white px-3 py-1 glass-card rounded-md cursor-pointer text-sm font-medium"
          >
            {language === 'en' ? '中文' : 'English'}
          </button>

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <img src={user.photoURL || ''} alt="Profile" className="w-8 h-8 rounded-full border border-[var(--color-panel-border)]" />
              <button 
                onClick={signOut}
                title="Sign out"
                className="p-2 rounded text-[var(--color-text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="px-4 py-1.5 text-sm font-semibold rounded bg-white text-black hover:bg-gray-200 transition-colors ml-2"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto flex items-start justify-center p-8 bg-[var(--color-bg-dark)] relative"
      >
        {!file ? (
          <div className="flex flex-col gap-4 mt-20">
            <label className="glass-card flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed border-[var(--color-brand-indigo)] border-opacity-50 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer group">
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
            <div className="flex justify-center">
              <DrivePicker onFileLoaded={handleDriveFileLoaded} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full pb-20">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="p-20 text-white">{t.loadingPdf}</div>}
              className="flex flex-col items-center gap-8 w-full"
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} className="relative shadow-2xl rounded-sm overflow-hidden bg-white pdf-container">
                  <Page 
                    pageNumber={index + 1} 
                    width={containerWidth ? containerWidth * scale : undefined}
                    scale={containerWidth ? 1 : scale} 
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="select-text"
                    onLoadSuccess={index === 0 ? onPageLoadSuccess : undefined}
                  />
                </div>
              ))}
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
