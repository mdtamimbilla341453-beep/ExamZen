import React, { useRef, useState, Dispatch, SetStateAction, useEffect } from 'react';
import { analyzeChapter } from '../services/geminiService';
import { LoadingState, AnalysisResult, ImageInput } from '../types';
import { X, FileText, Tag, BrainCircuit, Loader2, ScanLine, AlertCircle, Layers, BookOpen } from 'lucide-react';

interface SmartQuestionAnalyzerProps {
  images: ImageInput[];
  setImages: Dispatch<SetStateAction<ImageInput[]>>;
  result: AnalysisResult | null;
  setResult: Dispatch<SetStateAction<AnalysisResult | null>>;
}

export const SmartQuestionAnalyzer: React.FC<SmartQuestionAnalyzerProps> = ({ images, setImages, result, setResult }) => {
  const [previews, setPreviews] = useState<string[]>(images.map(img => `data:${img.mimeType};base64,${img.base64}`));
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [loadingStep, setLoadingStep] = useState<string>('স্ক্যানিং শুরু হচ্ছে...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'ছবি প্রসেস করা হচ্ছে...',
    'AI-এর কাছে পাঠানো হচ্ছে...',
    'তথ্য বিশ্লেষণ করা হচ্ছে...',
    'সারাংশ তৈরি করা হচ্ছে...',
    'প্রশ্নাবলী সাজানো হচ্ছে...'
  ];

  useEffect(() => {
    let interval: any;
    if (status === LoadingState.LOADING) {
      let stepIdx = 0;
      interval = setInterval(() => {
        stepIdx = (stepIdx + 1) % steps.length;
        setLoadingStep(steps[stepIdx]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setResult(null);
    setStatus(LoadingState.IDLE);
    setImages([]); 
    setPreviews([]);

    Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          
          setPreviews(prev => [...prev, base64String]);
          setImages(prev => [...prev, { base64: base64Data, mimeType: file.type }]);
        };
        reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setStatus(LoadingState.LOADING);
    try {
      const data = await analyzeChapter(images);
      setResult(data);
      setStatus(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(LoadingState.ERROR);
    }
  };

  const handleClear = () => {
    setImages([]);
    setPreviews([]);
    setResult(null);
    setStatus(LoadingState.IDLE);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setPreviews(prev => prev.filter((_, i) => i !== index));
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-light text-text">Chapter Scanner</h2>
          <p className="text-textMuted text-sm mt-1">দ্রুত অ্যানালাইসিস এর জন্য ছবি আপলোড করুন।</p>
        </div>
        {images.length > 0 && (
             <button 
                onClick={handleClear}
                className="text-textMuted hover:text-red-400 text-sm flex items-center gap-1 transition-colors"
             >
                <X size={14} /> Clear All
             </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        
        {/* Left Column: Upload & Preview */}
        <div className="flex flex-col gap-6 overflow-hidden">
            {images.length === 0 ? (
                <div 
                    className="flex-1 border-2 border-dashed border-surfaceHighlight rounded-2xl flex flex-col items-center justify-center p-8 transition-all hover:border-textMuted hover:bg-surface/50 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        multiple
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleImageUpload}
                    />
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-surfaceHighlight rounded-full flex items-center justify-center mx-auto text-textMuted">
                            <Layers size={32} />
                        </div>
                        <div>
                            <p className="text-text font-medium text-lg">Upload Chapter Pages</p>
                            <p className="text-textMuted text-sm">Select multiple images (JPG, PNG)</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-surface border border-surfaceHighlight rounded-2xl p-4 overflow-y-auto scrollbar-custom">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-sm font-medium text-textMuted uppercase tracking-wider">Preview Pages ({images.length})</h3>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-primary text-xs hover:underline"
                        >
                            + Add More
                        </button>
                         <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg" 
                            multiple
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleImageUpload}
                        />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {previews.map((src, idx) => (
                            <div key={idx} className="relative aspect-[3/4] group">
                                <img src={src} alt={`Page ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-surfaceHighlight" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <button 
                                        onClick={(e) => removeImage(idx, e)}
                                        className="p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {images.length > 0 && status !== LoadingState.SUCCESS && (
                <button
                    onClick={handleAnalyze}
                    disabled={status === LoadingState.LOADING}
                    className="w-full py-4 bg-primary text-background font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {status === LoadingState.LOADING ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> {loadingStep}
                        </>
                    ) : (
                        <>
                            <BrainCircuit size={20} /> Analyze Chapter
                        </>
                    )}
                </button>
            )}

            {status === LoadingState.ERROR && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p>Analysis failed. Please try again (Check API Key/Quota).</p>
                </div>
            )}
        </div>

        {/* Right Column: Results */}
        <div className="bg-surface rounded-2xl border border-surfaceHighlight p-6 shadow-xl overflow-y-auto scrollbar-custom relative">
            {!result ? (
                <div className="h-full flex flex-col items-center justify-center text-textMuted opacity-50 space-y-4">
                    <ScanLine size={48} strokeWidth={1} />
                    <p className="text-sm font-light">বিশ্লেষণ করলে এখানে ফলাফল দেখা যাবে</p>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="bg-background/30 p-5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <BookOpen size={18} />
                            <h3 className="font-medium tracking-wide uppercase text-xs">সারসংক্ষেপ</h3>
                        </div>
                        <p className="text-text leading-relaxed text-sm whitespace-pre-line">
                            {result.summary}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4 text-secondary">
                            <Tag size={18} />
                            <h3 className="font-medium tracking-wide uppercase text-xs">মূল ট্যাগ</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {result.topics?.map((topic, i) => (
                                <span key={i} className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-sm font-light">
                                    #{topic}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5"></div>

                    <div>
                        <div className="flex items-center gap-2 mb-4 text-accent">
                            <FileText size={18} />
                            <h3 className="font-medium tracking-wide uppercase text-xs">গুরুত্বপূর্ণ প্রশ্ন</h3>
                        </div>
                        <div className="space-y-3">
                            {result.questions?.map((q, i) => (
                                <div key={i} className="p-4 bg-background/50 border border-surfaceHighlight rounded-xl group">
                                    <p className="text-text font-light leading-relaxed">{q}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};