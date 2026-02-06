
import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, BookOpen, Coffee, GraduationCap, ScanSearch, Languages, BrainCircuit, MessageSquare, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout }) => {
  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.ANALYZER, label: 'Scanner', icon: ScanSearch },
    { id: ViewState.QUIZ, label: 'Quiz', icon: BrainCircuit },
    { id: ViewState.CHAT, label: 'Tutor', icon: MessageSquare },
    { id: ViewState.TRANSLATOR, label: 'Translator', icon: Languages },
    { id: ViewState.NOTES, label: 'Notes', icon: BookOpen },
    { id: ViewState.FOCUS, label: 'Focus', icon: Coffee },
  ];

  return (
    <aside className="fixed bottom-0 left-0 w-full md:w-20 md:h-screen md:top-0 md:left-0 bg-surface md:border-r border-t md:border-t-0 border-surfaceHighlight z-50 flex md:flex-col items-center justify-between p-2 md:py-8 shadow-2xl overflow-x-auto md:overflow-visible scrollbar-none">
      <div className="hidden md:flex flex-col items-center gap-2 mb-8">
         <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-background shadow-lg shadow-primary/20">
            <GraduationCap size={24} />
         </div>
      </div>

      <div className="flex-1 w-full flex md:flex-col items-center justify-start md:gap-4 overflow-x-auto md:overflow-visible scrollbar-none px-2 md:px-0">
        <nav className="flex md:flex-col justify-start md:justify-around w-full md:w-auto gap-1 md:gap-4 min-w-max md:min-w-0">
            {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
                <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`p-3 rounded-xl transition-all duration-300 group relative flex flex-col items-center gap-1 md:gap-0 shrink-0 ${
                    isActive 
                    ? 'bg-white/10 text-primary' 
                    : 'text-textMuted hover:text-text hover:bg-white/5'
                }`}
                >
                <item.icon size={24} strokeWidth={1.5} className={isActive ? 'stroke-current' : 'stroke-current'} />
                <span className="text-[10px] md:hidden font-medium">{item.label}</span>
                
                {/* Desktop Tooltip */}
                <span className="absolute left-14 bg-surfaceHighlight text-text text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block pointer-events-none border border-white/5 z-50">
                    {item.label}
                </span>
                
                {isActive && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full hidden md:block shadow-[0_0_10px_rgba(168,181,166,0.5)]"></div>
                )}
                </button>
            );
            })}
        </nav>
      </div>

      <div className="hidden md:flex flex-col gap-4">
        <button
            onClick={onLogout}
            className="p-3 rounded-xl text-textMuted hover:text-red-400 hover:bg-white/5 transition-all group relative"
        >
            <LogOut size={24} strokeWidth={1.5} />
            <span className="absolute left-14 bg-surfaceHighlight text-text text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block pointer-events-none border border-white/5 z-50">
                Logout
            </span>
        </button>
      </div>
    </aside>
  );
};
