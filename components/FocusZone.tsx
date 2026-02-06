import React, { useState } from 'react';
import { WELLNESS_TIPS, ALPHA_WAVES_URL } from '../constants';
import { Play, Pause, RefreshCw, Heart, Music, Volume2 } from 'lucide-react';

export const FocusZone: React.FC = () => {
  const [currentTip, setCurrentTip] = useState<string>(WELLNESS_TIPS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handleRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * WELLNESS_TIPS.length);
    setCurrentTip(WELLNESS_TIPS[randomIndex]);
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full max-w-5xl mx-auto items-center">
      
      {/* Exam Fear Tips */}
      <div className="bg-surface p-8 rounded-3xl border border-surfaceHighlight shadow-xl relative overflow-hidden h-80 flex flex-col justify-center text-center group">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-secondary to-accent"></div>
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
                <Heart className="text-secondary w-6 h-6" />
            </div>
            
            <h3 className="text-2xl font-light text-text mb-6">Exam Anxiety Relief</h3>
            
            <p className="text-lg text-textMuted italic font-light min-h-[4rem] animate-fade-in">
              "{currentTip}"
            </p>
            
            <button 
                onClick={handleRandomTip}
                className="mt-8 flex items-center gap-2 text-sm text-secondary hover:text-white transition-colors uppercase tracking-widest font-medium"
            >
                <RefreshCw size={14} /> New Tip
            </button>
        </div>
      </div>

      {/* Focus Music Player */}
      <div className="bg-gradient-to-br from-[#252525] to-[#1e1e1e] p-8 rounded-3xl border border-surfaceHighlight shadow-xl h-80 flex flex-col justify-between relative overflow-hidden">
         {/* Visualizer Placeholder */}
         <div className="absolute inset-0 opacity-20 flex items-center justify-center gap-1 pointer-events-none">
            {[...Array(10)].map((_, i) => (
                <div 
                    key={i} 
                    className={`w-2 bg-primary rounded-full transition-all duration-700 ease-in-out ${isPlaying ? 'animate-pulse' : 'h-2'}`}
                    style={{ height: isPlaying ? `${Math.random() * 60 + 20}%` : '4px', animationDelay: `${i * 0.1}s` }}
                ></div>
            ))}
         </div>

         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <Music className="text-primary w-5 h-5" />
                <span className="text-primary text-sm font-medium tracking-wide">FOCUS MODE</span>
            </div>
            <h3 className="text-3xl text-text font-light">Alpha Waves</h3>
            <p className="text-textMuted text-sm mt-1">Binaural beats for deep concentration.</p>
         </div>

         <div className="relative z-10 flex items-center justify-between mt-8">
            <button 
                onClick={toggleAudio}
                className="w-16 h-16 rounded-full bg-primary text-background flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>

            <div className="flex items-center gap-2 text-textMuted">
                 <Volume2 size={16} />
                 <div className="w-24 h-1 bg-surfaceHighlight rounded-full">
                    <div className="w-2/3 h-full bg-textMuted rounded-full"></div>
                 </div>
            </div>
         </div>

         <audio ref={audioRef} src={ALPHA_WAVES_URL} loop />
      </div>

    </div>
  );
};
