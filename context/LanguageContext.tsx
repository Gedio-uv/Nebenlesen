'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

type Translations = {
  [key in Language]: {
    uploadTitle: string;
    uploadSubtitle: string;
    loadingPdf: string;
    zoomOut: string;
    zoomIn: string;
    analysis: string;
    readyToLearn: string;
    readyToLearnDesc: string;
    analyzing: string;
    selectedText: string;
    translation: string;
    altMeanings: string;
    type: string;
    article: string;
    tense: string;
    explanation: string;
    autocorrectedFrom: string;
  };
};

const translations: Translations = {
  en: {
    uploadTitle: 'Upload German PDF',
    uploadSubtitle: 'Click to browse or drag and drop',
    loadingPdf: 'Loading PDF...',
    zoomOut: 'Zoom Out',
    zoomIn: 'Zoom In',
    analysis: 'Analysis',
    readyToLearn: 'Ready to Learn',
    readyToLearnDesc: 'Highlight any word or sentence in the PDF to get an instant translation and grammatical breakdown.',
    analyzing: 'Analyzing text...',
    selectedText: 'Selected Text',
    translation: 'Translation',
    altMeanings: 'Alternative Meanings',
    type: 'Type',
    article: 'Article',
    tense: 'Tense',
    explanation: 'Explanation',
    autocorrectedFrom: 'Autocorrected from:',
  },
  zh: {
    uploadTitle: '上传德语 PDF',
    uploadSubtitle: '点击浏览或拖拽文件到此处',
    loadingPdf: '正在加载 PDF...',
    zoomOut: '缩小',
    zoomIn: '放大',
    analysis: '分析',
    readyToLearn: '准备学习',
    readyToLearnDesc: '在 PDF 中高亮显示任何单词或句子，即可获得即时翻译和语法分析。',
    analyzing: '正在分析文本...',
    selectedText: '所选文本',
    translation: '翻译',
    altMeanings: '其他含义',
    type: '词性',
    article: '冠词',
    tense: '时态',
    explanation: '解释',
    autocorrectedFrom: '自动更正自:',
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations['en'];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
