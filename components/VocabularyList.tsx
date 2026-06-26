'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { BookOpen, LogOut } from 'lucide-react';

interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  contextSentence: string;
  createdAt: any;
}

interface VocabularyListProps {
  onViewModeChange: (mode: 'reader' | 'vocabulary') => void;
}

export default function VocabularyList({ onViewModeChange }: VocabularyListProps) {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [vocab, setVocab] = useState<VocabularyItem[]>([]);

  useEffect(() => {
    if (!user) {
      setVocab([]);
      return;
    }
    
    const q = query(
      collection(db, `users/${user.uid}/vocabulary`),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: VocabularyItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as VocabularyItem);
      });
      setVocab(items);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-bg-dark)] overflow-hidden">
      {/* Top Toolbar */}
      <div className="glass-panel rounded-none border-t-0 border-l-0 border-r-0 border-b border-[var(--color-panel-border)] p-4 flex items-center justify-between z-10 shrink-0 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-teal)] to-[var(--color-brand-indigo)] tracking-tight">
            Nebenlesen
          </div>
          <div className="w-px h-6 bg-[var(--color-panel-border)]"></div>
          <button 
            onClick={() => onViewModeChange('reader')}
            className="px-3 py-1.5 text-sm font-medium rounded text-[var(--color-text-secondary)] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <BookOpen size={16} /> Back to Reader
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
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
              className="px-4 py-1.5 text-sm font-semibold rounded bg-white text-black hover:bg-gray-200 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Vocabulary</h1>
            <p className="text-[var(--color-text-secondary)]">
              {user ? 'Gather your words and sentences to master the language.' : 'Sign in to start saving your vocabulary.'}
            </p>
          </div>

          {user && (
            <div className="glass-panel rounded-xl overflow-hidden border border-[var(--color-panel-border)] bg-black/20">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--color-panel-border)] bg-white/5 font-semibold text-sm text-[var(--color-text-secondary)] tracking-wider uppercase">
                <div className="col-span-3">Word / Sentence</div>
                <div className="col-span-3">Translation</div>
                <div className="col-span-6">Context</div>
              </div>
              
              <div className="divide-y divide-[var(--color-panel-border)]">
                {vocab.length === 0 ? (
                  <div className="p-12 text-center text-[var(--color-text-secondary)]">
                    No vocabulary saved yet. Highlight a word in a PDF and click "Save to Vocabulary"!
                  </div>
                ) : (
                  vocab.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition-colors group">
                      <div className="col-span-3 font-medium text-[var(--color-brand-teal)] pr-4">
                        {item.word}
                      </div>
                      <div className="col-span-3 text-white pr-4">
                        {item.translation}
                      </div>
                      <div className="col-span-6 text-[var(--color-text-secondary)] italic leading-relaxed text-sm">
                        {item.contextSentence || '-'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
