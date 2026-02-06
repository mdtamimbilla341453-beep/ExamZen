
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Lock, User, LogIn, UserPlus, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    const success = await authService.login(username, password);
    
    if (success) {
      onLogin();
    } else {
      setError('ভুল ইউজারনেম বা পাসওয়ার্ড (অথবা সার্ভার সংযোগ নেই)');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('সব ফিল্ড পূরণ করুন');
      return;
    }
    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const success = await authService.signup(username, password);
    
    if (success) {
      // User requested explicit flow: Show success message and ask to login
      setSuccessMsg('Account created! Please Login.');
      setIsLoginTab(true); // Switch to Login tab automatically
      setPassword(''); // Clear password for security
      setConfirmPassword('');
    } else {
      setError('Username already taken or server error.');
    }
    setLoading(false);
  };

  const toggleTab = (login: boolean) => {
    setIsLoginTab(login);
    setError('');
    setSuccessMsg(''); // Clear success message when manually switching tabs
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-surfaceHighlight rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-surfaceHighlight/30 p-8 text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center text-background mb-4 shadow-lg shadow-primary/20">
                <Lock size={32} />
            </div>
            <h1 className="text-2xl font-light text-text">ExamZen</h1>
            <p className="text-textMuted text-sm">আপনার স্টুডেন্ট অ্যাকাউন্টে প্রবেশ করুন</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surfaceHighlight">
            <button 
                className={`flex-1 py-4 text-sm font-medium transition-colors ${isLoginTab ? 'bg-surface text-primary border-b-2 border-primary' : 'bg-surfaceHighlight/10 text-textMuted hover:text-text'}`}
                onClick={() => toggleTab(true)}
            >
                প্রবেশ করুন
            </button>
            <button 
                className={`flex-1 py-4 text-sm font-medium transition-colors ${!isLoginTab ? 'bg-surface text-primary border-b-2 border-primary' : 'bg-surfaceHighlight/10 text-textMuted hover:text-text'}`}
                onClick={() => toggleTab(false)}
            >
                নিবন্ধন করুন
            </button>
        </div>

        {/* Form Area */}
        <div className="p-8">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm mb-6 animate-fade-in">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-200 p-3 rounded-lg flex items-center gap-2 text-sm mb-6 animate-fade-in">
                    <CheckCircle size={16} />
                    {successMsg}
                </div>
            )}

            <form onSubmit={isLoginTab ? handleLogin : handleSignup} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs text-textMuted uppercase tracking-wider font-medium">ইউজারনেম</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-background border border-surfaceHighlight rounded-xl py-3 pl-10 pr-4 text-text focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="আপনার নাম লিখুন"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-textMuted uppercase tracking-wider font-medium">পাসওয়ার্ড</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-surfaceHighlight rounded-xl py-3 pl-10 pr-4 text-text focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="গোপন পাসওয়ার্ড"
                            disabled={loading}
                        />
                    </div>
                </div>

                {!isLoginTab && (
                    <div className="space-y-1 animate-fade-in-up">
                        <label className="text-xs text-textMuted uppercase tracking-wider font-medium">পাসওয়ার্ড নিশ্চিত করুন</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-background border border-surfaceHighlight rounded-xl py-3 pl-10 pr-4 text-text focus:outline-none focus:border-primary/50 transition-colors"
                                placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>অপেক্ষা করুন <Loader2 size={18} className="animate-spin"/></>
                    ) : isLoginTab ? (
                        <>লগইন <LogIn size={18} /></>
                    ) : (
                        <>অ্যাকাউন্ট তৈরি করুন <UserPlus size={18} /></>
                    )}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
