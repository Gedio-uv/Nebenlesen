'use client';

import React, { useState } from 'react';
import { BookOpen, Loader2, Info, BookmarkPlus, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type AnalysisResult = {
  corrected_word?: string;
  translation: string;
  alternative_meanings?: string[];
  type: string;
  gender_and_article?: string;
  verb_tense?: string;
  short_explanation: string;
};

type SidePanelProps = {
  isOpen: boolean;
  isLoading: boolean;
  selectedText: string;
  result: AnalysisResult | null;
  onClose: () => void;
};

export default function SidePanel({ isOpen, isLoading, selectedText, result, onClose }: SidePanelProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset save state when selected text changes
  React.useEffect(() => {
    setSaveSuccess(false);
  }, [selectedText]);

  if (!isOpen) return null;

  const handleSaveToVocabulary = async () => {
    if (!user || !result || !selectedText) return;
    
    setIsSaving(true);
    try {
      const wordToSave = result.corrected_word || selectedText;
      // If it's a long text (sentence), save it as context as well
      const isSentence = wordToSave.split(' ').length > 3;
      
      await addDoc(collection(db, `users/${user.uid}/vocabulary`), {
        word: wordToSave,
        translation: result.translation,
        contextSentence: isSentence ? wordToSave : '', // Basic logic for context
        type: result.type,
        createdAt: serverTimestamp(),
      });
      setSaveSuccess(true);
    } catch (error) {
      console.error("Error saving vocabulary:", error);
      alert("Failed to save vocabulary. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full glass-panel flex flex-col overflow-hidden animate-[slide-in_0.3s_ease-out]">
      <div className="p-6 border-b border-[var(--color-panel-border)] flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gradient flex items-center gap-2">
          <BookOpen size={20} />
          {t.analysis}
        </h2>
        <button 
          onClick={onClose}
          className="text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
        {!selectedText ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[var(--color-text-secondary)] space-y-4 animate-[fade-in_0.3s]">
            <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center mb-2">
              <BookOpen size={28} className="opacity-50" />
            </div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">{t.readyToLearn}</p>
            <p className="text-sm max-w-[200px]">{t.readyToLearnDesc}</p>
          </div>
        ) : isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-brand-teal)] space-y-4 animate-[fade-in_0.3s]">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm text-[var(--color-text-secondary)]">{t.analyzing}</p>
          </div>
        ) : result ? (
          <div className="space-y-6 animate-[fade-in_0.3s] pb-20">
            <div className="glass-card p-4">
              <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">{t.selectedText}</h3>
              <p className="text-lg font-medium text-white break-words">
                {result.corrected_word || selectedText}
              </p>
              {result.corrected_word && result.corrected_word.toLowerCase() !== selectedText.toLowerCase() && (
                <p className="text-xs text-[var(--color-brand-teal)] mt-1">
                  {t.autocorrectedFrom} "{selectedText}"
                </p>
              )}
            </div>
            
            <div className="glass-card p-4 border-l-4 border-l-[var(--color-brand-indigo)]">
              <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">{t.translation}</h3>
              <p className="text-xl font-semibold text-white">{result.translation}</p>
            </div>

            {result.alternative_meanings && result.alternative_meanings.length > 0 && (
              <div className="glass-card p-4 border-l-4 border-l-[var(--color-brand-purple)]">
                <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">{t.altMeanings}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.alternative_meanings.map((meaning, idx) => (
                    <span key={idx} className="bg-[rgba(255,255,255,0.1)] px-2 py-1 rounded text-sm text-[var(--color-text-primary)]">
                      {meaning}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">{t.type}</h3>
                <p className="text-md font-medium text-[var(--color-brand-teal)] capitalize">{result.type}</p>
              </div>
              
              {result.gender_and_article && (
                <div className="glass-card p-4">
                  <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">{t.article}</h3>
                  <p className="text-md font-medium text-[var(--color-brand-purple)] capitalize">{result.gender_and_article}</p>
                </div>
              )}
              
              {result.verb_tense && (
                <div className="glass-card p-4 col-span-2">
                  <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">{t.tense}</h3>
                  <p className="text-md font-medium text-[var(--color-brand-purple)] capitalize">{result.verb_tense}</p>
                </div>
              )}
            </div>

            <div className="glass-card p-4 bg-[rgba(6,182,212,0.05)]">
              <h3 className="text-sm uppercase tracking-wider text-[var(--color-brand-teal)] flex items-center gap-2 mb-2">
                <Info size={16} /> {t.explanation}
              </h3>
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                {result.short_explanation}
              </p>
            </div>
            
            {/* Save Button Floating at Bottom */}
            {user && (
              <div className="absolute bottom-6 left-6 right-6">
                <button
                  onClick={handleSaveToVocabulary}
                  disabled={isSaving || saveSuccess}
                  className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    saveSuccess 
                      ? 'bg-green-500 text-white'
                      : 'bg-gradient-to-r from-[var(--color-brand-teal)] to-[var(--color-brand-indigo)] hover:opacity-90 text-white'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : saveSuccess ? (
                    <>
                      <Check size={20} /> Saved to Vocabulary
                    </>
                  ) : (
                    <>
                      <BookmarkPlus size={20} /> Save to Vocabulary
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
