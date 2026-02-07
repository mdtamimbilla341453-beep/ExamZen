import React, { useRef, useState, Dispatch, SetStateAction, useEffect } from 'react';
import { analyzeChapter } from '../services/geminiService';
import { LoadingState, AnalysisResult, ImageInput } from '../types';
import { X, FileText, Tag, BrainCircuit, Loader2, ScanLine, AlertCircle, Layers, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'সবগুলো পাতা পড়া হচ্ছে...',
    'বিষয়বস্তু বিশ্লেষণ করা হচ্ছে...',
    'পরীক্ষকের দৃষ্টিতে দেখা হচ্ছে...',
    'প্রশ্নাবলী সাজানো হচ্ছে...',
    'সারাংশ তৈরি করা হচ্ছে...'
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

    setStatus(LoadingState.IDLE);

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
    
    if (event.target) event.target.value = '';
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setStatus(LoadingState.LOADING);
    setResult(null); 
    try {
      // Processes all images together as requested
      const data = await analyzeChapter(images);
      setResult(data);
      setStatus(LoadingState.SUCCESS);
      setIsPreviewExpanded(false); // Collapse preview to show result
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
    setIsPreviewExpanded(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setPreviews(prev => prev.filter((_, i) => i !== index));
      setImages(prev => prev.filter((_, i) => i !== index));
      if (images.length <= 1) {
          setResult(null);
          setIsPreviewExpanded(true);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col pb-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-light text-text">Exam Examiner Scanner</h2>
          <p className="text-textMuted text-sm mt-1">সম্পূর্ণ চ্যাপ্টার আপলোড করুন (১০+ পাতার সাপোর্ট)।</p>
        </div>
        {images.length > 0 && (
             <button 
                onClick={handleClear}
                className="text-textMuted hover:text-red-400 text-sm flex items-center gap-1 transition-colors bg-surfaceHighlight/30 px-3 py-1 rounded-lg"
             >
                <X size={14} /> রিসেট করুন
             </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden">
        
        {/* Left Column: Sequential Upload & Preview Gallery */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
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
                        <div className="w-20 h-20 bg-surfaceHighlight rounded-full flex items-center justify-center mx-auto text-textMuted shadow-inner">
                            <Layers size={32} />
                        </div>
                        <div>
                            <p className="text-text font-medium text-lg">পুরো চ্যাপ্টারের ছবি দিন</p>
                            <p className="text-textMuted text-sm">একসাথে ১০+ ছবি আপলোড করা যাবে</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`flex flex-col bg-surface border border-surfaceHighlight rounded-2xl overflow-hidden transition-all duration-300 ${isPreviewExpanded ? 'flex-1' : 'h-16'}`}>
                    <div 
                        className="flex justify-between items-center p-4 border-b border-surfaceHighlight bg-surfaceHighlight/10 cursor-pointer"
                        onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                    >
                        <div className="flex items-center gap-2">
                           <h3 className="text-sm font-medium text-text uppercase tracking-wider">Preview Pages ({images.length})</h3>
                        </div>
                        <div className="flex items-center gap-4">
                           <button 
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="text-primary text-xs font-medium hover:underline"
                            >
                                + Add More
                            </button>
                            {isPreviewExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                         <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg" 
                            multiple
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleImageUpload}
                        />
                    </div>
                    {isPreviewExpanded && (
                        <div className="flex-1 p-4 overflow-y-auto scrollbar-custom grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {previews.map((src, idx) => (
                                <div key={idx} className="relative aspect-[3/4] group">
                                    <img src={src} alt={`Page ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-surfaceHighlight shadow-sm" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                        <button 
                                            onClick={(e) => removeImage(idx, e)}
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-1 left-1 bg-black/70 text-[10px] px-2 py-0.5 rounded text-white font-bold">
                                        P. {idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {images.length > 0 && (
                <button
                    onClick={handleAnalyze}
                    disabled={status === LoadingState.LOADING}
                    className="w-full py-5 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                >
                    {status === LoadingState.LOADING ? (
                        <>
                            <Loader2 size={24} className="animate-spin" /> {loadingStep}
                        </>
                    ) : (
                        <>
                            <BrainCircuit size={24} /> Analyze Full Chapter ({images.length} Pages)
                        </>
                    )}
                </button>
            )}

            {status === LoadingState.ERROR && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3 animate-shake">
                    <AlertCircle size={20} />
                    <p className="text-sm">বিশ্লেষণ ব্যর্থ হয়েছে। আপনার ইন্টারনেট সংযোগ বা এপিআই কী চেক করুন।</p>
                </div>
            )}
        </div>

        {/* Right Column: Examiner Results */}
        <div className="bg-surface rounded-2xl border border-surfaceHighlight p-6 shadow-2xl overflow-y-auto scrollbar-custom relative">
            {!result ? (
                <div className="h-full flex flex-col items-center justify-center text-textMuted opacity-50 space-y-6">
                    <ScanLine size={64} strokeWidth={1} className="animate-pulse" />
                    <div className="text-center space-y-2">
                       <p className="text-lg font-light">পরীক্ষক আপনার উত্তরপত্র/বই দেখার জন্য প্রস্তুত।</p>
                       <p className="text-sm">সবগুলো ছবি আপলোড করে 'Analyze' বাটনে ক্লিক করুন।</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="flex items-center gap-3 border-b border-surfaceHighlight pb-4">
                        <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-text">Examiner's Comprehensive Summary</h3>
                            <p className="text-xs text-textMuted uppercase tracking-widest">পুরো চ্যাপ্টারের মূলভাব</p>
                        </div>
                    </div>

                    <div className="bg-background/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                        <p className="text-text leading-relaxed text-sm whitespace-pre-line">
                            {result.summary}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-3 text-secondary">
                                <Tag size={16} />
                                <h4 className="text-xs font-bold tracking-widest uppercase">মূল টপিক</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {result.topics?.map((topic, i) => (
                                    <span key={i} className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-[10px] font-bold">
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-accent border-b border-surfaceHighlight pb-2">
                            <FileText size={20} />
                            <h3 className="text-sm font-bold tracking-wider uppercase">Top 10 Most Likely Exam Questions</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {result.questions?.slice(0, 10).map((q, i) => (
                                <div key={i} className="p-4 bg-background/50 border border-surfaceHighlight rounded-xl flex gap-4 group hover:border-accent/40 transition-all hover:bg-surfaceHighlight/20">
                                    <span className="text-2xl font-black text-accent opacity-20 group-hover:opacity-40 transition-opacity">
                                        {(i + 1).toString().padStart(2, '0')}
                                    </span>
                                    <p className="text-text font-light leading-relaxed self-center">
                                        {q}
                                    </p>
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
