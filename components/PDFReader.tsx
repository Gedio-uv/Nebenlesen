'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { UploadCloud, FileText } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PDFReaderProps = {
  onTextSelected: (text: string) => void;
};

export default function PDFReader({ onTextSelected }: PDFReaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize observer to handle dynamic PDF scaling
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setNumPages(0);
      setScale(1);
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleMouseUp = () => {
    // A small delay ensures the browser has fully updated the selection boundary
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection) {
        const text = selection.toString().trim();
        if (text.length > 0) {
          onTextSelected(text);
        }
      }
    }, 150);
  };

  if (!file) {
    return (
      <div className="w-full h-full flex flex-col relative items-center justify-center p-8">
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="glass-card px-3 py-1 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
          >
            {language === 'en' ? '中文' : 'English'}
          </button>
        </div>
        <label className="glass-card flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed border-[var(--color-brand-indigo)] border-opacity-50 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud size={48} className="text-[var(--color-brand-teal)] mb-4 group-hover:scale-110 transition-transform" />
            <p className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">{t.uploadTitle}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{t.uploadSubtitle}</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="application/pdf"
            onChange={handleFileChange}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" ref={containerRef}>
      {/* Toolbar */}
      <div className="glass-panel rounded-none border-t-0 border-l-0 border-r-0 border-b border-[var(--color-panel-border)] p-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-teal)] to-[var(--color-brand-indigo)] tracking-tight">
            Nebenlesen
          </div>
          <div className="w-px h-6 bg-[var(--color-panel-border)]"></div>
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FileText size={18} />
            <span className="font-medium truncate max-w-[200px] text-sm">{file.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="text-[var(--color-brand-teal)] hover:text-white px-3 py-1 glass-card rounded-md cursor-pointer text-sm font-medium mr-2"
          >
            {language === 'en' ? '中文' : 'English'}
          </button>

          <button 
            disabled={scale <= 0.5}
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))}
            className="text-[var(--color-text-secondary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 glass-card rounded-md cursor-pointer"
          >
            {t.zoomOut}
          </button>
          <span className="text-sm text-[var(--color-text-secondary)] w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            disabled={scale >= 3}
            onClick={() => setScale(prev => Math.min(3, prev + 0.25))}
            className="text-[var(--color-text-secondary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 glass-card rounded-md cursor-pointer"
          >
            {t.zoomIn}
          </button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div 
        className="flex-1 overflow-auto bg-[#e5e5e5] dark:bg-[#1f2937] p-4 sm:p-8"
        onMouseUp={handleMouseUp}
      >
        <div className="flex flex-col items-center gap-6">
          <Document
            file={file}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full text-[var(--color-brand-teal)] mt-10">
                {t.loadingPdf}
              </div>
            }
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} className="shadow-2xl bg-white mb-6">
                <Page 
                  pageNumber={index + 1} 
                  scale={scale}
                  width={containerWidth ? Math.max(containerWidth - 64, 300) : undefined}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white text-black"
                />
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
