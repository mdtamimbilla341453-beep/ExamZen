import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SubjectData, SubjectTopic } from '../types';
import { MOCK_SUBJECTS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateStudyPlan } from '../services/geminiService';
import { Sparkles, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(MOCK_SUBJECTS[0].id);
  const [suggestion, setSuggestion] = useState<string>('');
  const [loadingSuggestion, setLoadingSuggestion] = useState<boolean>(false);
  
  // Track the last requested topic to prevent duplicate API calls in StrictMode
  const lastRequestRef = useRef<string>('');

  const selectedSubject = useMemo(() => 
    MOCK_SUBJECTS.find(s => s.id === selectedSubjectId) || MOCK_SUBJECTS[0], 
    [selectedSubjectId]
  );

  const sortedTopics = useMemo(() => 
    [...selectedSubject.topics].sort((a, b) => b.frequencyScore - a.frequencyScore),
    [selectedSubject]
  );

  const topTopic = sortedTopics[0];

  useEffect(() => {
    // Unique key for this request
    const requestKey = `${selectedSubject.id}-${topTopic.name}`;
    
    // If we already requested this specific combo, don't fire again
    if (lastRequestRef.current === requestKey) return;

    const fetchSuggestion = async () => {
      lastRequestRef.current = requestKey;
      setLoadingSuggestion(true);
      const plan = await generateStudyPlan(selectedSubject.name, topTopic.name);
      setSuggestion(plan);
      setLoadingSuggestion(false);
    };
    
    fetchSuggestion();
  }, [selectedSubject, topTopic]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-light text-text">Exam Prep Dashboard</h2>
          <p className="text-textMuted text-sm mt-1">Analyze trends and optimize your study schedule.</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-surface p-2 rounded-lg border border-surfaceHighlight">
          <label htmlFor="subject-select" className="text-sm font-medium text-textMuted pl-2">Subject:</label>
          <select 
            id="subject-select"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="bg-transparent text-text focus:outline-none cursor-pointer font-medium"
          >
            {MOCK_SUBJECTS.map(sub => (
              <option key={sub.id} value={sub.id} className="bg-surface text-text">
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Suggestion Card */}
      <div className="bg-gradient-to-r from-surface to-surfaceHighlight p-6 rounded-2xl border border-surfaceHighlight shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={100} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
             <div className="bg-primary/20 p-2 rounded-full">
                <Sparkles className="w-5 h-5 text-primary" />
             </div>
             <h3 className="text-lg font-medium text-primary">Daily Study Suggestion</h3>
          </div>
          
          <div className="space-y-2">
            <p className="text-xl font-light text-text">
              Focus on <span className="font-semibold text-secondary">{topTopic.name}</span> today.
            </p>
            <div className="bg-background/50 p-4 rounded-xl text-sm leading-relaxed text-textMuted border border-white/5">
                {loadingSuggestion ? (
                    <div className="flex items-center gap-2 animate-pulse">
                        <div className="w-4 h-4 rounded-full bg-primary/50"></div>
                        Generating AI strategy...
                    </div>
                ) : (
                    suggestion
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-surfaceHighlight shadow-md">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-medium text-text">Topic Frequency (Last 10 Years)</h3>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedTopics} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={120} 
                            tick={{fill: '#9E9C91', fontSize: 12}} 
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#2A2A2A', borderColor: '#363636', color: '#E8E6D9' }}
                            itemStyle={{ color: '#E8E6D9' }}
                            cursor={{fill: 'transparent'}}
                        />
                        <Bar dataKey="frequencyScore" radius={[0, 4, 4, 0]} barSize={20}>
                            {sortedTopics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#A8B5A6' : '#525252'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Table */}
        <div className="bg-surface p-6 rounded-2xl border border-surfaceHighlight shadow-md overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-medium text-text">Priority Topics List</h3>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-textMuted text-xs uppercase tracking-wider border-b border-white/5">
                            <th className="pb-3 pl-2">Topic Name</th>
                            <th className="pb-3">Freq. Score</th>
                            <th className="pb-3 pr-2 text-right">Last Seen</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {sortedTopics.map((topic, idx) => (
                            <tr key={topic.name} className={`border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${idx === 0 ? 'bg-primary/10' : ''}`}>
                                <td className="py-3 pl-2 font-medium text-text flex items-center gap-2">
                                    {idx === 0 && <AlertCircle className="w-3 h-3 text-primary" />}
                                    {topic.name}
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`${idx === 0 ? 'text-primary' : 'text-textMuted'}`}>{topic.frequencyScore}</span>
                                        <div className="h-1 w-16 bg-surfaceHighlight rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${idx === 0 ? 'bg-primary' : 'bg-gray-600'}`} 
                                                style={{ width: `${topic.frequencyScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 pr-2 text-right text-textMuted">{topic.lastAppeared}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};