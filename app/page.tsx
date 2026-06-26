'use client';

import React, { useState, useEffect } from 'react';
import SidePanel, { AnalysisResult } from '@/components/SidePanel';
import NativeReader from '@/components/NativeReader';
import { useLanguage } from '@/context/LanguageContext';
import { UploadCloud } from 'lucide-react';

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // New state for Native Reader
  const [blocks, setBlocks] = useState<any[] | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setIsExtracting(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Extraction failed');
        }
        
        const data = await response.json();
        if (data.blocks) {
          setBlocks(data.blocks);
        }
      } catch (err: any) {
        console.error(err);
        alert(`Failed to extract PDF text: ${err.message || 'Unknown error'}`);
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleTextSelected = async (text: string) => {
    setSelectedText(text);
    setIsPanelOpen(true);
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error(error);
      setAnalysisResult({
        translation: 'Error',
        type: 'error',
        short_explanation: 'Failed to fetch analysis from server.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full h-screen overflow-hidden flex bg-[var(--color-bg-dark)]">
      {/* Main Document Area */}
      <div 
        className={`flex-1 h-full transition-all duration-300 ease-in-out ${
          isPanelOpen ? 'lg:mr-[400px] xl:mr-[450px]' : ''
        }`}
      >
        {mounted && (
          blocks ? (
            <NativeReader blocks={blocks} onTextSelected={handleTextSelected} />
          ) : (
            <div className="w-full h-full flex flex-col relative items-center justify-center p-8 bg-[var(--color-bg-dark)]">
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                  className="glass-card px-3 py-1 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
                >
                  {language === 'en' ? '中文' : 'English'}
                </button>
              </div>
              <label className="glass-card flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed border-[var(--color-brand-indigo)] border-opacity-50 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  {isExtracting ? (
                    <>
                      <div className="w-12 h-12 rounded-full border-4 border-t-[var(--color-brand-teal)] border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4"></div>
                      <p className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">Extracting and Cleaning Text...</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">AI is fixing ligatures and formatting.</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={48} className="text-[var(--color-brand-teal)] mb-4 group-hover:scale-110 transition-transform" />
                      <p className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">{t.uploadTitle}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{t.uploadSubtitle}</p>
                    </>
                  )}
                </div>
                {!isExtracting && (
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                  />
                )}
              </label>
            </div>
          )
        )}
      </div>

      {/* Side Panel Area */}
      <div 
        className={`fixed top-0 right-0 h-full w-[400px] xl:w-[450px] transition-transform duration-300 ease-in-out shadow-2xl z-20 ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <SidePanel 
          isOpen={isPanelOpen} 
          isLoading={isLoading} 
          selectedText={selectedText} 
          result={analysisResult} 
          onClose={() => setIsPanelOpen(false)} 
        />
      </div>
    </main>
  );
}
