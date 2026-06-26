'use client';

import React, { useState, useEffect } from 'react';
import SidePanel, { AnalysisResult } from '@/components/SidePanel';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/context/LanguageContext';

const PDFReader = dynamic(() => import('@/components/PDFReader'), { ssr: false });

export default function Home() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        {mounted && <PDFReader onTextSelected={handleTextSelected} />}
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
