import React, { useState } from 'react';
import { translateText } from '../services/geminiService';
import { LoadingState } from '../types';
import { Languages, ArrowRight, Loader2, Copy, Check } from 'lucide-react';

const LANGUAGES = ['Bengali', 'English', 'Hindi', 'Spanish', 'Arabic'];

export const SmartStudyTranslator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [targetLang, setTargetLang] = useState('Bengali');
  const [outputText, setOutputText] = useState('');
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setStatus(LoadingState.LOADING);
    try {
      const result = await translateText(inputText, targetLang);
      setOutputText(result);
      setStatus(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(LoadingState.ERROR);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div>
        <h2 className="text-3xl font-light text-text">Smart Study Translator</h2>
        <p className="text-textMuted text-sm mt-1">Translate notes and study materials while maintaining academic tone.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Left Column: Input */}
        <div className="flex flex-col bg-surface rounded-2xl border border-surfaceHighlight shadow-lg overflow-hidden">
          <div className="p-4 border-b border-surfaceHighlight bg-surface/50">
            <h3 className="text-sm font-medium text-textMuted uppercase tracking-wider">Input Text</h3>
          </div>
          <textarea
            className="flex-1 bg-transparent p-4 resize-none focus:outline-none text-text leading-relaxed font-light scrollbar-custom"
            placeholder="Paste your notes, questions, or summary here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="p-4 border-t border-surfaceHighlight bg-surface/50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-sm text-textMuted">Translate to:</span>
                <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="bg-background text-text text-sm rounded-lg border border-surfaceHighlight px-3 py-2 focus:outline-none focus:border-primary/50"
                >
                    {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={handleTranslate}
                disabled={status === LoadingState.LOADING || !inputText.trim()}
                className="px-6 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {status === LoadingState.LOADING ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Languages size={16} />
                )}
                Translate Now
            </button>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="flex flex-col bg-surface rounded-2xl border border-surfaceHighlight shadow-lg overflow-hidden relative group">
           <div className="p-4 border-b border-surfaceHighlight bg-surface/50 flex justify-between items-center">
            <h3 className="text-sm font-medium text-textMuted uppercase tracking-wider">Translated Text ({targetLang})</h3>
            {outputText && (
                <button 
                    onClick={handleCopy}
                    className="text-textMuted hover:text-primary transition-colors p-1"
                    title="Copy to clipboard"
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
            )}
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto scrollbar-custom">
            {status === LoadingState.LOADING ? (
                <div className="h-full flex flex-col items-center justify-center text-textMuted opacity-50 gap-3">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-sm">Translating...</p>
                </div>
            ) : outputText ? (
                <p className="text-text leading-relaxed whitespace-pre-wrap animate-fade-in">
                    {outputText}
                </p>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-textMuted opacity-30 gap-3">
                    <ArrowRight size={32} />
                    <p className="text-sm">Translation will appear here</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};