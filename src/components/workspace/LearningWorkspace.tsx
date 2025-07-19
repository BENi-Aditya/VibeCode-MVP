import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import MonacoEditor from '@monaco-editor/react';
import TerminalComponent, { TerminalHandle } from '../../../components/Terminal';
// --- VibeCode UI imports ---
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Book, GraduationCap, Check, X as XIcon, Lock, Hourglass, Send, Wrench } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';

const LEVELS = [
  { key: 'beginner', label: 'Beginner', subtitle: "I'm brand new" },
  { key: 'intermediate', label: 'Intermediate', subtitle: "I've written some scripts" },
  { key: 'advanced', label: 'Advanced', subtitle: "I'm comfortable but want deeper knowledge" },
];

const TOPICS = {
  beginner: [
    { key: 'data-types', label: 'Data Types & Variables', description: 'Do you know about variables & data types?' },
    { key: 'strings', label: 'Strings & String Methods', description: 'Do you know about strings and formatting?' },
    { key: 'lists', label: 'Lists, Tuples, and Dictionaries', description: 'Do you know about lists, tuples, and dictionaries?' },
    { key: 'control-flow', label: 'Control Flow: if, elif, else', description: 'Do you know about if/elif/else?' },
    { key: 'loops', label: 'Looping: for and while', description: 'Do you know about for and while loops?' },
    { key: 'functions', label: 'Functions', description: 'Do you know how to define and call functions?' },
    { key: 'file-io', label: 'Basic File I/O', description: 'Do you know how to read and write files?' },
    { key: 'error-handling', label: 'Error Handling', description: 'Do you know about try/except?' },
    { key: 'modules', label: 'Modules & Imports', description: 'Do you know how to use modules and imports?' },
    { key: 'projects', label: 'Simple Projects', description: 'Ready to put it all together?' },
  ],
  intermediate: [
    { key: 'intermediate-1', label: 'Intermediate Topic 1', description: 'Do you know about this topic?' },
  ],
  advanced: [
    { key: 'advanced-1', label: 'Advanced Topic 1', description: 'Do you know about this topic?' },
  ],
};

const CANNED_FOLLOWUPS = [
  "I don't understand",
  "Can you give an example?",
  "Show me another exercise",
  "Yes, I understand"
];

function getTeachingSystemPrompt(topicLabel: string) {
  return `You are an interactive Python tutor. Teach the user the concept of ${topicLabel} from absolute scratch. Use clear examples, code snippets, and check for understanding before moving on. Respond in a step-by-step, conversational style. Use markdown for formatting, and code blocks for code. Do not move to the next concept until the user is comfortable.`;
}

function CodeBlock({ node, inline, className, children, ...props }: any) {
  const code = String(children).replace(/\n$/, '');
  return !inline ? (
    <div className="relative my-4">
      <Button
        size="sm"
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-vibe-purple/90 text-white rounded shadow hover:bg-vibe-blue/90 border border-white/10"
        onClick={() => navigator.clipboard.writeText(code)}
        title="Copy code"
      >
        Copy
      </Button>
      <pre className="bg-[#2d2346] text-white rounded-xl p-4 overflow-x-auto text-sm font-mono border border-vibe-purple/20 shadow-md" style={{ fontFamily: 'JetBrains Mono, Fira Mono, Menlo, Monaco, Consolas, monospace' }}>
        <code className={className}>{code}</code>
      </pre>
    </div>
  ) : (
    <code className="bg-vibe-purple/30 text-white px-1.5 py-0.5 rounded font-mono text-sm">{children}</code>
  );
}

export function LearningWorkspace() {
  const [step, setStep] = useState<'choose-level' | 'quiz-topics' | 'teaching-topic'>('choose-level');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [overlayFade, setOverlayFade] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [topicResults, setTopicResults] = useState<{ [key: string]: 'yes' | 'no' }>({});
  const [teachingTopic, setTeachingTopic] = useState<{ key: string; label: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: 'ai' | 'user'; content: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [rehydrated, setRehydrated] = useState(false);
  const [ideOpen, setIdeOpen] = useState(false);
  const [ideCode, setIdeCode] = useState("print('Try it yourself!')\n# Write your code here!");
  const ideTerminalRef = useRef<TerminalHandle>(null);
  // Use env variable for wsUrl. Only use fallback in local dev.
  let wsUrl = import.meta.env.VITE_TERMINAL_WS_URL;
  if (!wsUrl) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      wsUrl = 'ws://localhost:8081/';
    }
  }

  // --- Persistence ---
  // Save state to localStorage
  useEffect(() => {
    const state = {
      step, selectedLevel, overlayFade, quizIndex, topicResults, teachingTopic, chatMessages
    };
    localStorage.setItem('vibecode-learning-state', JSON.stringify(state));
  }, [step, selectedLevel, overlayFade, quizIndex, topicResults, teachingTopic, chatMessages]);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vibecode-learning-state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.step) setStep(state.step);
        if (state.selectedLevel) setSelectedLevel(state.selectedLevel);
        if (typeof state.overlayFade === 'boolean') setOverlayFade(state.overlayFade);
        if (typeof state.quizIndex === 'number') setQuizIndex(state.quizIndex);
        if (state.topicResults) setTopicResults(state.topicResults);
        if (state.teachingTopic) setTeachingTopic(state.teachingTopic);
        if (Array.isArray(state.chatMessages)) setChatMessages(state.chatMessages);
      } catch {}
    }
    setRehydrated(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isThinking]);

  // Handle level select with fade-out
  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    setOverlayFade(true);
    setTimeout(() => {
      setStep('quiz-topics');
    }, 400);
  };

  // Handle quiz answer
  const handleQuizAnswer = (answer: 'yes' | 'no') => {
    const topics = TOPICS[selectedLevel as keyof typeof TOPICS] || [];
    const topic = topics[quizIndex];
    setTopicResults(prev => ({ ...prev, [topic.key]: answer }));
    if (answer === 'no') {
      setTeachingTopic(topic);
      setStep('teaching-topic');
      setChatMessages([]);
      // Start lesson with AI
      startTeachingChat(topic.label);
      return;
    }
    if (quizIndex < topics.length - 1) {
      setQuizIndex(i => i + 1);
    } else {
      // TODO: Move to summary or finish
    }
  };

  // Progress bar
  const topics = selectedLevel ? TOPICS[selectedLevel as keyof typeof TOPICS] : [];
  const progress = step === 'quiz-topics' ? ((quizIndex + 1) / topics.length) * 100 : 0;

  // Teaching chat: OpenAI integration
  async function startTeachingChat(topicLabel: string) {
    setIsThinking(true);
    const apiKey = import.meta.env.VITE_APP_OPENAI_API_KEY;
    if (!apiKey) {
      setChatMessages([{ sender: 'ai', content: '⚠️ No OpenAI API key configured.' }]);
      setIsThinking(false);
      return;
    }
    try {
      const systemPrompt = getTeachingSystemPrompt(topicLabel);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Please teach me ${topicLabel} from scratch.` }
          ],
          temperature: 0.7
        })
      });
      if (!response.ok) throw new Error('API error: ' + response.statusText);
      const data = await response.json();
      let aiResponse = data.choices?.[0]?.message?.content;
      if (typeof aiResponse !== 'string') aiResponse = JSON.stringify(aiResponse);
      setChatMessages([{ sender: 'ai', content: aiResponse }]);
    } catch (e: any) {
      setChatMessages([{ sender: 'ai', content: `⚠️ ${e.message}` }]);
    } finally {
      setIsThinking(false);
    }
  }

  async function sendTeachingMessage(userMsg: string) {
    setChatMessages(prev => [...prev, { sender: 'user', content: userMsg }]);
    setIsThinking(true);
    const apiKey = import.meta.env.VITE_APP_OPENAI_API_KEY;
    if (!apiKey) {
      setChatMessages(prev => [...prev, { sender: 'ai', content: '⚠️ No OpenAI API key configured.' }]);
      setIsThinking(false);
      return;
    }
    try {
      const systemPrompt = getTeachingSystemPrompt(teachingTopic?.label || 'this topic');
      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatMessages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content })),
        { role: 'user', content: userMsg }
      ];
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages,
          temperature: 0.7
        })
      });
      if (!response.ok) throw new Error('API error: ' + response.statusText);
      const data = await response.json();
      let aiResponse = data.choices?.[0]?.message?.content;
      if (typeof aiResponse !== 'string') aiResponse = JSON.stringify(aiResponse);
      setChatMessages(prev => [...prev, { sender: 'ai', content: aiResponse }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { sender: 'ai', content: `⚠️ ${e.message}` }]);
    } finally {
      setIsThinking(false);
    }
  }

  // Canned follow-ups
  const handleFollowup = (msg: string) => {
    sendTeachingMessage(msg);
  };

  // Input send
  const handleSend = () => {
    if (!inputText.trim()) return;
    sendTeachingMessage(inputText.trim());
    setInputText('');
  };

  // Back to quiz
  const handleBackToQuiz = () => {
    setStep('quiz-topics');
    setTeachingTopic(null);
    setChatMessages([]);
  };

  // --- UI ---
  if (!rehydrated) {
    return <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#0c0915] via-[#121125] to-[#1b1a2e] text-white text-lg">Loading…</div>;
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <ParticleBackground variant="learning" />
      {/* Sidebar always visible (handled by parent layout) */}
      <div className="absolute inset-0 z-10 flex h-full w-full">
        {/* Onboarding Panel */}
        {step === 'choose-level' && (
          <div className={`fixed inset-y-0 left-16 right-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xl transition-opacity duration-400 ${overlayFade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Card className="p-10 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full flex flex-col items-center animate-fade-in-up glass-card" style={{ minHeight: 380 }}>
              <CardHeader className="mb-4">
                <CardTitle className="text-3xl font-extrabold text-white text-center drop-shadow-lg tracking-tight">Let's get started!<br/>How comfortable are you with Python?</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-8 w-full mt-2">
                {LEVELS.map(lvl => {
                  const isComingSoon = lvl.key !== 'beginner';
                  return (
                    <Button
                      key={lvl.key}
                      className={`w-full px-8 py-9 rounded-3xl text-white font-semibold text-xl shadow-lg transition-all duration-200 border flex flex-col items-center group overflow-hidden
                        bg-gradient-to-r from-[#a78bfa] to-[#38bdf8] border-white/10
                        ${lvl.key !== 'beginner' ? 'bg-gradient-to-r from-[#312e81] to-[#0ea5e9] opacity-70 cursor-not-allowed border-4 border-[length:4px]' : ''}
                        hover:shadow-[0_0_40px_10px_rgba(56,189,248,0.45)] hover:ring-2 hover:ring-vibe-blue/40`}
                      style={{
                        minWidth: 320,
                        maxWidth: 540,
                        minHeight: 130,
                        boxShadow: '0 0 32px 0 #a78bfa55',
                        position: 'relative',
                        borderImage: lvl.key !== 'beginner' ? 'repeating-linear-gradient(135deg,#facc15_0_12px,#000_12px_24px)' : undefined,
                        borderImageSlice: lvl.key !== 'beginner' ? 1 : undefined,
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 0,
                      }}
                      onClick={() => {
                        if (lvl.key !== 'beginner') {
                          setShowComingSoon(true);
                          return;
                        }
                        handleLevelSelect(lvl.key);
                      }}
                      disabled={lvl.key !== 'beginner'}
                    >
                      <span className="text-2xl font-bold tracking-wide drop-shadow text-white w-full text-center break-words" style={{ wordBreak: 'break-word', whiteSpace: 'normal', maxWidth: 420, margin: '0 auto', textWrap: 'balance' }}>{lvl.label}</span>
                      <span className={`mt-2 font-normal w-full text-center break-words ${lvl.key === 'advanced' ? 'text-lg text-white/70 leading-snug' : 'text-lg text-white/80'}`} style={{ wordBreak: 'break-word', whiteSpace: 'normal', maxWidth: 420, margin: '0 auto', textWrap: 'balance', fontSize: lvl.key === 'advanced' ? '1.08rem' : undefined, lineHeight: lvl.key === 'advanced' ? '1.35' : undefined }}>{lvl.subtitle}</span>
                      {isComingSoon && (
                        <span className="mt-3 text-base font-bold text-yellow-400 w-full text-center break-words" style={{ wordBreak: 'break-word', whiteSpace: 'normal', maxWidth: 420, margin: '0 auto', textWrap: 'balance' }}>
                          Coming Soon
                        </span>
                      )}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
            {showComingSoon && (
              <div className="fixed inset-y-0 left-16 right-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xl" onClick={() => setShowComingSoon(false)}>
                <Card className="p-8 rounded-2xl shadow-2xl border border-white/10 max-w-xs w-full flex flex-col items-center animate-fade-in-up glass-card" onClick={e => e.stopPropagation()}>
                  <Badge className="mb-3 bg-yellow-400/90 text-black font-bold px-3 py-1 rounded-full border-2 border-yellow-700/60 flex items-center gap-1 shadow-md" style={{ background: 'repeating-linear-gradient(135deg, #facc15 0 10px, #000 10px 20px)' }}>
                    <Wrench className="w-4 h-4 mr-1 text-black/80" />
                    <span>Under Construction</span>
                  </Badge>
                  <h3 className="text-2xl font-bold text-yellow-300 mb-2">Coming Soon!</h3>
                  <p className="text-white/80 text-center mb-4">Intermediate and Advanced learning paths are coming soon. Stay tuned!</p>
                  <Button className="mt-2 px-6 py-2 rounded-full bg-gradient-to-r from-vibe-purple to-vibe-blue text-white font-semibold shadow border border-white/10" onClick={() => setShowComingSoon(false)}>OK</Button>
                </Card>
              </div>
            )}
          </div>
        )}
        {/* Topic Comfort Survey */}
        {step === 'quiz-topics' && topics[quizIndex] && (
          <div className="fixed inset-y-0 left-16 right-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-fade-in">
            <Card className="p-10 rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full flex flex-col items-center animate-fade-in-up glass-card" style={{ minHeight: 320 }}>
              <CardHeader className="mb-2 w-full">
                <CardTitle className="text-2xl font-bold text-white text-center drop-shadow-lg">{topics[quizIndex].label}</CardTitle>
              </CardHeader>
              <p className="text-lg text-white/80 mb-8 text-center max-w-md">{topics[quizIndex].description}</p>
              <Progress value={progress} className="w-full h-3 mb-6 bg-white/10 rounded-full overflow-hidden" />
              <div className="flex gap-6 w-full mt-2 justify-center">
                <Button
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-vibe-purple to-vibe-blue text-white font-bold text-lg shadow-lg border border-white/10 flex items-center justify-center gap-2 hover:ring-2 hover:ring-vibe-blue/40 transition-all"
                  onClick={() => handleQuizAnswer('yes')}
                >
                  <Check className="w-5 h-5 mr-2" /> Yes, I know this
                </Button>
                <Button
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-vibe-purple text-white font-bold text-lg shadow-lg border border-white/10 flex items-center justify-center gap-2 hover:ring-2 hover:ring-pink-400/40 transition-all"
                  onClick={() => handleQuizAnswer('no')}
                >
                  <XIcon className="w-5 h-5 mr-2" /> No, please teach me
                </Button>
                {/* Example Coming Soon button (if needed) */}
                {/* <span className="flex-1 flex items-center justify-center">
                  <Badge className="bg-yellow-400/90 text-black font-bold px-3 py-1 rounded-full border-2 border-yellow-700/60 flex items-center gap-1 shadow-md" style={{ background: 'repeating-linear-gradient(135deg, #facc15 0 10px, #000 10px 20px)' }}>
                    <Wrench className="w-4 h-4 mr-1 text-black/80" />
                    <span>Under Construction</span>
                  </Badge>
                </span> */}
              </div>
            </Card>
          </div>
        )}
        {/* Teaching Mode: Centered, immersive chat */}
        {step === 'teaching-topic' && teachingTopic && (
          <div className="absolute inset-0 z-30 flex h-full w-full animate-fade-in">
            {/* Chat (left) */}
            <div className={`flex flex-col transition-all duration-300 h-full ${ideOpen ? 'w-full md:w-[60%]' : 'w-full max-w-2xl mx-auto'} items-center justify-center pt-8 pb-4 max-w-2xl mx-auto px-2 md:px-6`} style={{ minHeight: 0 }}>
              {/* Header: Topic name and Back button */}
              <div className="flex items-center gap-3 mb-6 w-full justify-between border-b border-white/10 pb-4 flex-shrink-0 bg-transparent z-10">
                <h2 className="text-xl font-bold text-white drop-shadow-lg">Learning: <span className="text-vibe-purple">{teachingTopic.label}</span></h2>
                <Button
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-vibe-purple to-vibe-blue text-white font-semibold shadow border border-white/10 hover:ring-2 hover:ring-vibe-blue/40"
                  onClick={handleBackToQuiz}
                >
                  ← Back to Topics
                </Button>
              </div>
              {/* Scrollable chat content */}
              <ScrollArea className="flex-1 w-full flex flex-col gap-6 items-center justify-center custom-canvas-scroll py-2" style={{ minHeight: 0, maxHeight: 'calc(100vh - 220px)' }}>
                {chatMessages.map((msg, i) =>
                  msg.sender === 'ai' ? (
                    <div key={i} className="w-full flex justify-center">
                      <div className="prose prose-invert max-w-none text-white text-base leading-relaxed custom-learning-markdown px-2 py-1">
                        <ReactMarkdown
                          rehypePlugins={[rehypeHighlight]}
                          components={{ code: CodeBlock }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="w-full flex justify-center">
                      <div className="bg-vibe-purple/30 text-white px-6 py-3 rounded-2xl shadow-lg max-w-lg text-base font-medium border border-vibe-purple/30 backdrop-blur-md" style={{ boxShadow: '0 0 16px 0 #a78bfa33' }}>
                        {msg.content}
                      </div>
                    </div>
                  )
                )}
                {isThinking && (
                  <div className="w-full flex justify-center items-center mt-2">
                    <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-vibe-purple/70 border-opacity-60 mr-3" />
                    <span className="text-white/70 text-base">BENi is thinking…</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </ScrollArea>
              {/* Canned follow-ups */}
              <div className="flex flex-wrap gap-3 w-full mt-6 mb-2 justify-center flex-shrink-0 bg-transparent z-10">
                {CANNED_FOLLOWUPS.map((txt, i) => (
                  <Button
                    key={i}
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-vibe-purple to-vibe-blue text-white font-medium shadow-md border border-white/10 hover:ring-2 hover:ring-vibe-blue/40 transition-all text-sm pill-glow"
                    style={{ boxShadow: '0 0 8px 0 #a78bfa55' }}
                    onClick={() => handleFollowup(txt)}
                    disabled={isThinking}
                  >
                    {txt}
                  </Button>
                ))}
              </div>
              {/* Input + IDE Button */}
              <div className="flex items-center gap-2 w-full mt-2 px-2 md:px-6 flex-shrink-0 bg-transparent z-10">
                <Input
                  className="flex-1 chat-input rounded-full border border-white/10 bg-black/40 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-vibe-blue/30 shadow-md placeholder:text-white/60"
                  placeholder="Ask a question..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  disabled={isThinking}
                />
                <Button
                  className="bg-gradient-to-br from-vibe-purple to-vibe-blue text-white rounded-full px-5 py-3 font-bold shadow-md border border-white/10 hover:ring-2 hover:ring-vibe-blue/40 transition-all ml-1"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isThinking}
                >
                  <Send className="w-5 h-5" />
                </Button>
                {/* Open IDE Button */}
                {!ideOpen && (
                  <Button
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-vibe-purple to-vibe-blue text-white font-bold shadow-lg border border-white/10 ml-2 hover:ring-2 hover:ring-vibe-blue/40"
                    style={{ minWidth: 56 }}
                    onClick={() => setIdeOpen(true)}
                    title="Open IDE"
                  >
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8v8H8z" /></svg>
                    <span className="hidden md:inline">Open IDE</span>
                  </Button>
                )}
              </div>
            </div>
            {/* IDE Panel (right) */}
            {ideOpen && (
              <div className="hidden md:flex flex-col w-[40%] bg-gradient-to-br from-[#18152a]/80 to-[#1b1a2e]/90 border-l border-white/10 shadow-2xl animate-fade-in relative justify-center" style={{ maxHeight: 1000, height: 1000, minHeight: 0, margin: 'auto 0' }}>
                {/* IDE Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-gradient-to-r from-vibe-purple/40 to-vibe-blue/30 rounded-t-2xl shadow-lg min-h-[54px]">
                  <div className="flex items-center gap-3">
                    <span className="text-white/90 font-mono text-base font-bold tracking-wide drop-shadow-lg">lesson.py</span>
                    <span className="ml-3 px-2 py-0.5 rounded-full bg-vibe-purple/20 text-vibe-purple text-xs font-semibold tracking-widest shadow">PYTHON</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Run Button */}
                    <Button
                      className="relative group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-vibe-purple to-vibe-blue shadow-xl border border-white/10 hover:ring-2 hover:ring-vibe-blue/40"
                      aria-label="Run Code"
                      onClick={() => {
                        if (ideTerminalRef.current) {
                          const hereDoc = [
                            'clear',
                            'echo "--- Running lesson.py ---"',
                            'cat <<EOF > lesson.py',
                            ...ideCode.split('\n'),
                            'EOF',
                            'echo -e "\x1b[36m"', // Set color to cyan
                            'python lesson.py',
                            'echo -e "\x1b[0m"', // Reset color
                            ''
                          ].join('\n');
                          ideTerminalRef.current.sendToTerminal(hereDoc);
                        }
                      }}
                    >
                      <span className="relative flex items-center justify-center w-6 h-6">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-vibe-blue opacity-40 group-hover:animate-ping"></span>
                        <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18l15-9L5 3z" /></svg>
                      </span>
                    </Button>
                    {/* Download Button */}
                    <Button
                      className="relative group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-vibe-blue to-vibe-purple shadow-xl border border-white/10 hover:ring-2 hover:ring-vibe-blue/40"
                      aria-label="Download Code"
                      onClick={() => {
                        const blob = new Blob([ideCode], { type: 'text/x-python' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = 'lesson.py';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(link.href);
                      }}
                    >
                      <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>
                    </Button>
                    {/* Close Button */}
                    <Button
                      className="relative group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-vibe-purple shadow-xl border border-white/10 hover:ring-2 hover:ring-red-400/40"
                      aria-label="Close IDE"
                      onClick={() => setIdeOpen(false)}
                    >
                      <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                  </div>
                </div>
                {/* Monaco Editor */}
                <div style={{ flex: '0 0 65%', minHeight: 0, maxHeight: '65%' }} className="w-full border-b-2 border-vibe-purple/30 min-h-0">
                  <MonacoEditor
                    height="100%"
                    language="python"
                    value={ideCode}
                    theme="vs-dark"
                    options={{
                      fontSize: 16,
                      fontFamily: 'JetBrains Mono, Fira Mono, Menlo, Monaco, Consolas, monospace',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      automaticLayout: true,
                      smoothScrolling: true,
                      lineNumbers: 'on',
                      renderLineHighlight: 'all',
                      autoClosingBrackets: 'always',
                      autoClosingQuotes: 'always',
                      matchBrackets: 'always',
                      suggestOnTriggerCharacters: true,
                      tabSize: 4,
                      insertSpaces: true,
                      cursorBlinking: 'smooth',
                      cursorSmoothCaretAnimation: 'on'
                    }}
                    onChange={v => setIdeCode(v || '')}
                  />
                </div>
                {/* Terminal */}
                <div style={{ flex: '0 0 35%', minHeight: 0, maxHeight: '35%' }} className="w-full border-t-2 border-vibe-purple/30 rounded-b-2xl shadow-xl flex flex-col animate-fade-in vibe-terminal-bg min-h-0">
                  <div className="flex items-center px-4 py-1 gap-2 border-b border-vibe-purple/30 rounded-t-xl bg-gradient-to-r from-[#2d2346]/80 to-[#3a2d5c]/80 relative z-10" style={{minHeight:32}}>
                    <span className="w-4 h-4 bg-vibe-purple rounded-full mr-2" />
                    <span className="text-vibe-purple font-bold">Terminal (Interactive)</span>
                  </div>
                  <TerminalComponent ref={ideTerminalRef} wsUrl={wsUrl} height={120} className="vibe-terminal-bg" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 