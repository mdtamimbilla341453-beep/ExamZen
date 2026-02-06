import React, { useRef, useState, Dispatch, SetStateAction } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Reset previous results if uploading new batch
    setResult(null);
    setStatus(LoadingState.IDLE);
    setImages([]); // Clear old images from state
    setPreviews([]);

    Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          
          setPreviews(prev => [...prev, base64String]);
          setImages(prev => {
              const newImages = [...prev, { base64: base64Data, mimeType: file.type }];
              // Hacky way to update parent state inside loop, but React batches updates usually. 
              // Better to collect and set once, but for simplicity in this flow:
              return newImages; 
          });
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
      const newPreviews = previews.filter((_, i) => i !== index);
      const newImages = images.filter((_, i) => i !== index);
      setPreviews(newPreviews);
      setImages(newImages);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-light text-text">Chapter Scanner</h2>
          <p className="text-textMuted text-sm mt-1">Upload pages to unlock Quiz and Tutor features.</p>
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
                                <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 rounded">
                                    {idx + 1}
                                </span>
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
                            <Loader2 size={20} className="animate-spin" /> Analyzing Chapter...
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
                    <p>Analysis failed. Please try again.</p>
                </div>
            )}
        </div>

        {/* Right Column: Results */}
        <div className="bg-surface rounded-2xl border border-surfaceHighlight p-6 shadow-xl overflow-y-auto scrollbar-custom relative">
            {!result ? (
                <div className="h-full flex flex-col items-center justify-center text-textMuted opacity-50 space-y-4">
                    <ScanLine size={48} strokeWidth={1} />
                    <p className="text-sm font-light">Upload pages and analyze to see insights</p>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in-up">
                    
                    {/* Summary Section */}
                    <div className="bg-background/30 p-5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <BookOpen size={18} />
                            <h3 className="font-medium tracking-wide uppercase text-xs">সারসংক্ষেপ</h3>
                        </div>
                        <p className="text-text leading-relaxed text-sm whitespace-pre-line">
                            {result.summary}
                        </p>
                    </div>

                    {/* Key Topics */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-secondary">
                            <Tag size={18} />
                            <h3 className="font-medium tracking-wide uppercase text-xs">প্রধান আলোচ্য বিষয়</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {result.topics && result.topics.length > 0 ? (
                                result.topics.map((topic, i) => (
                                    <span key={i} className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-sm font-light">
                                        #{topic}
                                    </span>
                                ))
                            ) : (
                                <p className="text-textMuted text-sm italic">No specific topics detected.</p>
                            )}
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5"></div>

                    {/* Questions */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-accent">
                            <FileText size={18} />
                            <h3 className="font-medium tracking-wide uppercase text-xs">গুরুত্বপূর্ণ প্রশ্নাবলী</h3>
                        </div>
                        <div className="space-y-3">
                            {result.questions && result.questions.length > 0 ? (
                                result.questions.map((q, i) => (
                                    <div key={i} className="p-4 bg-background/50 border border-surfaceHighlight rounded-xl hover:border-accent/30 transition-colors group">
                                        <div className="flex gap-3">
                                            <span className="text-accent/50 font-mono text-sm">{(i + 1).toString().padStart(2, '0')}</span>
                                            <p className="text-text font-light leading-relaxed group-hover:text-white transition-colors">
                                                {q}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-textMuted text-sm italic">No questions generated.</p>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
      </div>
    </div>
  );
};