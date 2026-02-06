import React, { useState } from 'react';
import { generateQuiz } from '../services/geminiService';
import { ImageInput, QuizQuestion, LoadingState, ViewState } from '../types';
import { BrainCircuit, CheckCircle, XCircle, Award, ArrowRight, RefreshCw, Loader2, SkipForward } from 'lucide-react';

interface SmartQuizProps {
  images: ImageInput[];
  onNavigate: (view: ViewState) => void;
}

export const SmartQuiz: React.FC<SmartQuizProps> = ({ images, onNavigate }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleGenerateQuiz = async () => {
    setStatus(LoadingState.LOADING);
    try {
      const qs = await generateQuiz(images);
      setQuestions(qs);
      setStatus(LoadingState.SUCCESS);
      setCurrentQuestionIdx(0);
      setScore(0);
      setQuizFinished(false);
      setSelectedOption(null);
      setIsAnswered(false);
    } catch (e) {
      console.error(e);
      setStatus(LoadingState.ERROR);
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return; // Prevent changing answer after selection
    
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === questions[currentQuestionIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleSkipQuestion = () => {
    // Strictly move to next without scoring
    handleMoveToNext();
  };

  const handleMoveToNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(p => p + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  if (images.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-surfaceHighlight rounded-full">
           <BrainCircuit size={48} className="text-textMuted" />
        </div>
        <h2 className="text-2xl font-light">কোনো অধ্যায় লোড করা হয়নি</h2>
        <p className="text-textMuted">অনুগ্রহ করে স্ক্যানারে আগে অধ্যায়ের ছবি আপলোড করুন।</p>
        <button 
          onClick={() => onNavigate(ViewState.ANALYZER)}
          className="px-6 py-2 bg-primary text-background font-medium rounded-full hover:bg-primary/90 transition-colors"
        >
          স্ক্যানারে যান
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-light text-text">ইন্টার্যাক্টিভ কুইজ</h2>
          <p className="text-textMuted text-sm mt-1">গভীর বিশ্লেষণ এবং বিস্তারিত প্রশ্নোত্তর।</p>
        </div>
        {questions.length > 0 && !quizFinished && (
           <div className="px-4 py-2 bg-surfaceHighlight rounded-full text-sm font-medium text-primary">
              স্কোর: {score} / {questions.length}
           </div>
        )}
      </div>

      {status === LoadingState.IDLE && (
         <div className="flex-1 flex flex-col items-center justify-center">
            <button 
              onClick={handleGenerateQuiz}
              className="w-full max-w-md py-4 bg-primary text-background font-bold text-lg rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            >
               <BrainCircuit size={24} /> গভীর বিশ্লেষণ শুরু করুন
            </button>
            <p className="mt-4 text-textMuted text-sm">AI আপনার চ্যাপ্টার থেকে ১৫-২০টি বা তার বেশি প্রশ্ন তৈরি করবে।</p>
         </div>
      )}

      {status === LoadingState.LOADING && (
         <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 size={48} className="animate-spin text-primary" />
            <p className="text-lg font-light animate-pulse">বিস্তারিত প্রশ্ন তৈরি হচ্ছে...</p>
         </div>
      )}

      {status === LoadingState.SUCCESS && !quizFinished && questions.length > 0 && (
         <div className="flex-1 bg-surface rounded-3xl border border-surfaceHighlight p-8 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 text-sm text-textMuted">
               <span>প্রশ্ন {currentQuestionIdx + 1} / {questions.length}</span>
               <span className="uppercase tracking-widest text-[10px]">কুইজ মোড</span>
            </div>

            <h3 className="text-xl md:text-2xl font-medium text-text mb-8 leading-relaxed">
               {questions[currentQuestionIdx].question}
            </h3>

            <div className="space-y-3 flex-1">
               {questions[currentQuestionIdx].options.map((opt, idx) => {
                  let borderClass = 'border-surfaceHighlight hover:border-textMuted';
                  let bgClass = 'bg-background/50';
                  let icon = null;

                  if (isAnswered) {
                     if (idx === questions[currentQuestionIdx].correctAnswer) {
                        borderClass = 'border-green-500/50';
                        bgClass = 'bg-green-500/10';
                        icon = <CheckCircle size={20} className="text-green-500" />;
                     } else if (idx === selectedOption) {
                        borderClass = 'border-red-500/50';
                        bgClass = 'bg-red-500/10';
                        icon = <XCircle size={20} className="text-red-500" />;
                     } else {
                        bgClass = 'opacity-30';
                     }
                  } else {
                     // Default hover state when not yet answered
                     borderClass = 'border-surfaceHighlight hover:border-primary/50';
                  }

                  return (
                     <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        disabled={isAnswered}
                        className={`w-full p-4 rounded-xl border ${borderClass} ${bgClass} text-left transition-all flex items-center justify-between group`}
                     >
                        <span className={`text-text transition-colors ${!isAnswered ? 'group-hover:text-white' : ''}`}>{opt}</span>
                        {icon}
                     </button>
                  );
               })}
            </div>

            {isAnswered && (
               <div className={`mt-6 p-4 rounded-xl border animate-fade-in-up ${
                    selectedOption === questions[currentQuestionIdx].correctAnswer 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
               }`}>
                  <div className="flex items-center gap-2 mb-2">
                      {selectedOption === questions[currentQuestionIdx].correctAnswer ? (
                          <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle size={16}/> সঠিক!</span>
                      ) : (
                          <span className="text-red-400 font-bold flex items-center gap-1"><XCircle size={16}/> ভুল!</span>
                      )}
                  </div>
                  <p className="text-sm text-textMuted">
                      <span className="text-primary font-medium">ব্যাখ্যা:</span> {questions[currentQuestionIdx].explanation}
                  </p>
               </div>
            )}

            <div className="mt-8 flex justify-end gap-3 h-12">
               {!isAnswered ? (
                  <button 
                    onClick={handleSkipQuestion}
                    className="px-6 py-2 bg-surfaceHighlight text-textMuted hover:text-white hover:bg-surfaceHighlight/80 font-medium rounded-xl transition-colors flex items-center gap-2"
                  >
                     বাদ দিন <SkipForward size={16} />
                  </button>
               ) : (
                   currentQuestionIdx < questions.length - 1 ? (
                      <button 
                         onClick={handleMoveToNext}
                         className="px-6 py-2 bg-secondary text-background font-bold rounded-xl hover:bg-secondary/90 transition-colors flex items-center gap-2 animate-fade-in"
                      >
                         পরের প্রশ্ন <ArrowRight size={18} />
                      </button>
                   ) : (
                      <button 
                         onClick={handleMoveToNext}
                         className="px-6 py-2 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 animate-fade-in"
                      >
                         ফলাফল দেখুন <Award size={18} />
                      </button>
                   )
               )}
            </div>
         </div>
      )}

      {quizFinished && (
         <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
             <div className="w-24 h-24 bg-surfaceHighlight rounded-full flex items-center justify-center mb-6 shadow-2xl">
                 <Award size={48} className="text-primary" />
             </div>
             <h2 className="text-4xl font-light text-text mb-2">কুইজ সমাপ্ত!</h2>
             <p className="text-xl text-textMuted mb-8">আপনার স্কোর: <span className="text-primary font-bold">{score}</span> / {questions.length}</p>
             
             <button 
               onClick={handleGenerateQuiz}
               className="px-8 py-3 bg-surface border border-surfaceHighlight text-text hover:bg-white/5 rounded-full transition-colors flex items-center gap-2"
             >
                <RefreshCw size={18} /> নতুন কুইজ
             </button>
         </div>
      )}
    </div>
  );
};