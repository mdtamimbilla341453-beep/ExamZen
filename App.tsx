
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SmartNotes } from './components/SmartNotes';
import { FocusZone } from './components/FocusZone';
import { SmartQuestionAnalyzer } from './components/SmartQuestionAnalyzer';
import { SmartStudyTranslator } from './components/SmartStudyTranslator';
import { SmartQuiz } from './components/SmartQuiz';
import { SmartTutor } from './components/SmartTutor';
import { LoginPage } from './components/LoginPage';
import { authService } from './services/authService';
import { ViewState, ImageInput, AnalysisResult } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // Lifted State for "Module 1: The Scanner"
  const [sharedImages, setSharedImages] = useState<ImageInput[]>([]);
  const [sharedAnalysis, setSharedAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      setIsLoadingAuth(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentView(ViewState.DASHBOARD);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.NOTES:
        return <SmartNotes />;
      case ViewState.FOCUS:
        return <FocusZone />;
      case ViewState.ANALYZER:
        return (
          <SmartQuestionAnalyzer 
            images={sharedImages} 
            setImages={setSharedImages} 
            result={sharedAnalysis} 
            setResult={setSharedAnalysis} 
          />
        );
      case ViewState.TRANSLATOR:
        return <SmartStudyTranslator />;
      case ViewState.QUIZ:
        return <SmartQuiz images={sharedImages} onNavigate={setCurrentView} />;
      case ViewState.CHAT:
        return <SmartTutor images={sharedImages} onNavigate={setCurrentView} />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-textMuted">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col md:flex-row font-sans selection:bg-primary/30 selection:text-white">
      {/* Navigation */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-20 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-7xl mx-auto h-full">
            {/* Header / Top Bar (Mobile Only Logo) */}
            <div className="md:hidden flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-background">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10v6M12 2v20M12 12H2M12 12h10M12 12l-7-7M12 12l7-7"/></svg>
                </div>
                <h1 className="text-xl font-medium tracking-tight">ExamZen</h1>
            </div>

            {/* View Content */}
            <div className="animate-fade-in h-full">
                {renderContent()}
            </div>
        </div>
      </main>
    </div>
  );
}
