import React, { useState, useEffect, useRef } from 'react';
import { Note, LoadingState } from '../types';
import { extractTextFromImage } from '../services/geminiService';
import { Plus, Save, Image as ImageIcon, Trash2, Shuffle, Loader2, FileText, X } from 'lucide-react';

export const SmartNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note>({ id: '', title: '', content: '', date: '' });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [ocrStatus, setOcrStatus] = useState<LoadingState>(LoadingState.IDLE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedNotes = localStorage.getItem('examzen_notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('examzen_notes', JSON.stringify(notes));
  }, [notes]);

  const handleSaveNote = () => {
    if (!currentNote.title.trim() && !currentNote.content.trim()) return;

    const newNote = {
      ...currentNote,
      id: currentNote.id || Date.now().toString(),
      date: new Date().toLocaleDateString()
    };

    if (currentNote.id) {
      setNotes(prev => prev.map(n => n.id === currentNote.id ? newNote : n));
    } else {
      setNotes(prev => [newNote, ...prev]);
    }
    
    setCurrentNote({ id: '', title: '', content: '', date: '' });
    setIsEditing(false);
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setIsEditing(true);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (currentNote.id === id) {
        setCurrentNote({ id: '', title: '', content: '', date: '' });
        setIsEditing(false);
    }
  };

  const handleNewNote = () => {
    setCurrentNote({ id: '', title: '', content: '', date: '' });
    setIsEditing(true);
  };

  const handleRevisionMode = () => {
    if (notes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * notes.length);
    setCurrentNote(notes[randomIndex]);
    setIsEditing(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOcrStatus(LoadingState.LOADING);
    
    if (!isEditing) {
        setIsEditing(true);
        setCurrentNote(prev => ({ ...prev, title: `Scanned ${new Date().toLocaleTimeString()}` }));
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        const extractedText = await extractTextFromImage(base64Data, file.type);
        
        setCurrentNote(prev => ({
          ...prev,
          content: prev.content ? `${prev.content}\n\n[OCR]: ${extractedText}` : extractedText
        }));
        setOcrStatus(LoadingState.SUCCESS);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setOcrStatus(LoadingState.ERROR);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-fade-in">
      
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 bg-surface rounded-2xl border border-surfaceHighlight flex flex-col overflow-hidden shadow-lg">
        <div className="p-4 border-b border-surfaceHighlight flex justify-between items-center bg-surface/50">
          <h3 className="font-medium text-text">Notes</h3>
          <div className="flex gap-2">
            <button onClick={handleRevisionMode} className="p-2 rounded-lg bg-surfaceHighlight hover:bg-white/10 text-secondary transition-colors" title="Revision">
                <Shuffle size={18} />
            </button>
            <button onClick={handleNewNote} className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors" title="New">
                <Plus size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-textMuted text-sm">
                    <FileText size={32} className="mb-2 opacity-20" />
                    <p>No notes yet.</p>
                </div>
            ) : (
                notes.map(note => (
                    <div key={note.id} onClick={() => handleEditNote(note)} className={`p-3 rounded-xl cursor-pointer transition-all border ${currentNote.id === note.id ? 'bg-white/5 border-primary/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="text-text font-medium truncate pr-2">{note.title || "Untitled"}</h4>
                            <button onClick={(e) => handleDeleteNote(note.id, e)} className="text-textMuted hover:text-red-400">
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <p className="text-xs text-textMuted line-clamp-2">{note.content}</p>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-surface rounded-2xl border border-surfaceHighlight flex flex-col shadow-lg overflow-hidden relative">
        {!isEditing ? (
             <div className="flex-1 flex flex-col items-center justify-center text-textMuted p-6 text-center">
                <FileText size={48} className="mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-text">Start a New Note</h3>
                <button onClick={handleNewNote} className="mt-6 px-8 py-2 bg-primary text-background font-medium rounded-full hover:bg-primary/90 transition-colors">
                    Create New
                </button>
             </div>
        ) : (
            <>
                <div className="p-4 border-b border-surfaceHighlight flex items-center gap-4 bg-surface/50">
                    <button 
                        onClick={handleSaveNote}
                        className="p-2 px-5 rounded-lg bg-primary text-background font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        <span>Save</span>
                    </button>

                    <input 
                        type="text" 
                        value={currentNote.title}
                        onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Title..."
                        className="bg-transparent text-xl font-medium text-text focus:outline-none flex-1"
                    />
                    
                    <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={ocrStatus === LoadingState.LOADING}
                            className="p-2 rounded-lg bg-surfaceHighlight hover:bg-white/10 text-accent transition-colors"
                        >
                            {ocrStatus === LoadingState.LOADING ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                        </button>
                    </div>
                </div>

                <textarea 
                    value={currentNote.content}
                    onChange={(e) => setCurrentNote(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Type or upload a photo..."
                    className="flex-1 bg-transparent p-6 text-text resize-none focus:outline-none leading-relaxed"
                />
            </>
        )}
      </div>
    </div>
  );
};