import React, { useState, useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { codingWorkspaceInstructions } from '../../lib/customInstructions';
import ReactMarkdown from 'react-markdown';

// --- Terminal Output ---
function Terminal({ output, isRunning, onClear, height }: { output: string[]; isRunning: boolean; onClear: () => void; height: number }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    terminalRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output, isRunning]);
  return (
    <div className="w-full bg-[#181825] border-t-2 border-vibe-purple/30 rounded-b-2xl shadow-xl flex flex-col" style={{ minHeight: 80, height }}>
      <div className="flex items-center px-4 py-2 gap-2 border-b border-vibe-purple/30 rounded-t-xl bg-[#181825]">
        <span className="w-4 h-4 bg-vibe-purple rounded-full mr-2" />
        <span className="text-vibe-purple font-bold">Terminal</span>
        <button className="ml-auto text-vibe-purple hover:bg-vibe-purple/10 rounded px-2 py-1 text-xs" onClick={onClear}>Clear</button>
      </div>
      <div className="p-4 font-mono text-xs text-vibe-green flex-1 overflow-y-auto animate-fade-in" style={{ minHeight: 40 }}>
        {output.map((line, i) => (
          <div key={i} className="whitespace-pre-line">{line}</div>
        ))}
        {isRunning && <div className="animate-pulse text-vibe-purple">▋</div>}
        <div ref={terminalRef} />
      </div>
    </div>
  );
}

// --- Draggable Divider ---
function DragBar({ onDrag }: { onDrag: (deltaY: number) => void }) {
  const dragging = useRef(false);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging.current) onDrag(e.movementY);
    };
    const handleMouseUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onDrag]);
  return (
    <div
      className="w-full h-3 flex items-center justify-center cursor-ns-resize bg-gradient-to-r from-vibe-purple/30 to-vibe-blue/20 hover:from-vibe-purple/60 hover:to-vibe-blue/40 transition-all"
      style={{ marginTop: -2, marginBottom: -2, zIndex: 20 }}
      onMouseDown={() => { dragging.current = true; }}
    >
      <div className="w-16 h-1.5 rounded-full bg-vibe-purple/60 opacity-80" />
    </div>
  );
}

// --- AI Chat Panel ---
interface Message { sender: 'user' | 'ai'; content: string; timestamp: Date; }
function AIAssistantPanel({ setCode }: { setCode: (code: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', content: "Hi! I'm your AI coding assistant. Ask me for code, refactoring, or help!", timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Auto-expand textarea height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMessage: Message = { sender: 'user', content: inputText.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);
    try {
      const apiKey = import.meta.env.VITE_APP_OPENAI_API_KEY;
      if (!apiKey) throw new Error('No OpenAI API key configured.');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            { role: 'system', content: codingWorkspaceInstructions },
            ...messages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content })),
            { role: 'user', content: userMessage.content }
          ],
          temperature: 0.7
        })
      });
      if (!response.ok) throw new Error('API error: ' + response.statusText);
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { sender: 'ai', content: aiResponse, timestamp: new Date() }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { sender: 'ai', content: `⚠️ ${e.message}`, timestamp: new Date() }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Otherwise, allow Shift+Enter for new lines
  };

  // Utility to extract triple-quote code blocks from a string
  function extractTripleQuoteBlocks(text: string) {
    const regex = /"""([\w./-]+)"""\s*([\s\S]*?)\s*"""/g;
    let match;
    const blocks = [];
    let lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      blocks.push({ type: 'code', filename: match[1], code: match[2] });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      blocks.push({ type: 'text', content: text.slice(lastIndex) });
    }
    return blocks;
  }

  return (
    <div className="w-[32%] max-w-[420px] h-full bg-black/20 backdrop-blur-lg border border-white/10 flex-shrink-0 rounded-2xl shadow-2xl flex flex-col">
      <div className="h-full rounded-2xl overflow-hidden border-white/20 bg-white/5 backdrop-blur-lg shadow-xl flex flex-col" data-glass>
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white/90">AI Coding Assistant</h2>
            <button className="bg-gradient-to-r from-blue-400 to-purple-400 text-white border-blue-400/50 hover:border-blue-400/70 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 shadow-md hover:shadow-blue-400/50 hover:shadow-lg active:scale-95 rounded-full w-9 h-9 flex items-center justify-center" onClick={() => setMessages([{ sender: 'ai', content: "Hi! I'm your AI coding assistant. Ask me for code, refactoring, or help!", timestamp: new Date() }])}>＋</button>
          </div>
          <div className="flex-1 overflow-y-auto p-1 rounded-xl bg-black/20 border border-white/10 scrollbar-thin backdrop-blur-sm chat-panel">
            {messages.map((msg, i) => (
              <div key={i} className={`vibe-ai-message flex max-w-[80%] glass-card animate-fade-in-up transition-all duration-300 p-4 rounded-xl mb-2 ${msg.sender === 'user' ? 'ml-auto bg-vibe-purple/10 border-vibe-purple/20' : 'mr-auto bg-white/5 border-white/10'}`}
                style={{minWidth: 0}}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${msg.sender === 'user' ? 'bg-gradient-to-br from-vibe-purple to-vibe-blue' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                      <span className="text-white text-xs font-bold">{msg.sender === 'user' ? 'U' : 'AI'}</span>
                    </div>
                    <p className="text-xs text-white/60">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-white/90 text-sm min-w-0">
                    {extractTripleQuoteBlocks(msg.content).map((block, idx) => {
                      if (block.type === 'code') {
                        // Guess language from filename extension
                        const ext = block.filename.split('.').pop() || '';
                        const lang = ext === 'py' ? 'python' : ext === 'js' ? 'javascript' : ext;
                        return (
                          <div className="relative vibe-codeblock" key={idx}>
                            <div className="vibe-codeblock-header flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/15 rounded-t-[0.7rem]">
                              <span className="text-xs font-mono text-white/70">{block.filename}</span>
                              <div className="flex gap-2">
                                <button
                                  className="vibe-codeblock-copy"
                                  onClick={() => {navigator.clipboard.writeText(block.code)}}
                                  title="Copy"
                                  style={{zIndex: 10}}
                                >
                                  Copy
                                </button>
                                <button
                                  className="vibe-codeblock-copy"
                                  onClick={() => setCode(block.code)}
                                  title="Apply"
                                  style={{zIndex: 10}}
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                            <div className="vibe-codeblock-body" style={{maxHeight: '340px', overflow: 'auto', borderRadius: '0 0 0.7rem 0.7rem'}}>
                              <pre className={`vibe-codeblock-pre vibe-codeblock-wrap`} tabIndex={0}>
                                <code className={`language-${lang}`}>{block.code}</code>
                              </pre>
                            </div>
                          </div>
                        );
                      } else {
                        // Render normal markdown for non-code
                        return <ReactMarkdown key={idx}>{block.content}</ReactMarkdown>;
                      }
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex max-w-[80%] glass-card animate-fade-in-up transition-all duration-300 p-4 rounded-xl mr-auto bg-white/5 border-white/10">
                <div className="flex-1 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <div className="ml-2 animate-pulse flex space-x-1">
                    <div className="h-2 w-2 bg-white/60 rounded-full"></div>
                    <div className="h-2 w-2 bg-white/60 rounded-full animation-delay-200"></div>
                    <div className="h-2 w-2 bg-white/60 rounded-full animation-delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <textarea
              ref={inputRef}
              className="flex-1 chat-input"
              placeholder="Ask the AI for help..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              rows={1}
              spellCheck={true}
              data-interactive
              style={{ minHeight: 44, maxHeight: 180 }}
            />
            <button className="bg-gradient-to-br from-vibe-purple to-vibe-blue text-white rounded-full px-4 py-2 font-bold shadow hover:scale-105 transition-transform" onClick={handleSend} disabled={isThinking || !inputText.trim()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Coding Workspace ---
export function CodingWorkspace() {
  const [code, setCode] = useState("print('Hello, VibeCode!')\n# Write your code here!");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  // Calculate available height for the main coding area (minus header/tabs)
  const HEADER_HEIGHT = 54 + 36; // px, header + tabs
  const [containerHeight, setContainerHeight] = useState(window.innerHeight - 2 * 16); // minus padding
  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight - 2 * 16);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const defaultTerminalHeight = Math.round((containerHeight - HEADER_HEIGHT) * 0.3);
  const defaultEditorHeight = (containerHeight - HEADER_HEIGHT) - defaultTerminalHeight;
  const [editorHeight, setEditorHeight] = useState(defaultEditorHeight);
  const [terminalHeight, setTerminalHeight] = useState(defaultTerminalHeight);

  // Run code using Piston API (fully correct format)
  const handleRun = async () => {
    setIsRunning(true);
    setTerminalOutput([`$ python main.py`]);
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python3',
          version: '*',
          files: [{ name: 'main.py', content: code }],
          stdin: '',
          args: [],
        })
      });
      const data = await response.json();
      // Piston returns 'run.stdout' and 'run.stderr' in the new API
      const outputLines = [
        ...(data.run?.stdout ? data.run.stdout.split('\n') : []),
        ...(data.run?.stderr ? data.run.stderr.split('\n') : []),
      ];
      setTerminalOutput(prev => [...prev, ...outputLines]);
    } catch (e: any) {
      setTerminalOutput(prev => [...prev, `Error: ${e.message}`]);
    }
    setIsRunning(false);
  };

  // Handle resizing
  const handleDrag = (deltaY: number) => {
    setEditorHeight(h => Math.max(100, h + deltaY));
    setTerminalHeight(h => Math.max(80, h - deltaY));
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-[#0c0915] via-[#121125] to-[#1b1a2e] p-4 gap-4">
      {/* File Explorer */}
      <div className="w-60 bg-black/30 border border-white/10 flex flex-col rounded-2xl shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 rounded-t-2xl bg-black/40">
          <span className="text-xs font-bold text-white tracking-widest">EXPLORER</span>
          <div className="flex gap-1">
            {/* Add file/folder buttons here */}
            <button className="w-7 h-7 rounded-full bg-gradient-to-br from-vibe-purple to-vibe-blue text-white shadow-md hover:scale-105 transition-transform" />
            <button className="w-7 h-7 rounded-full bg-gradient-to-br from-vibe-blue to-vibe-purple text-white shadow-md hover:scale-105 transition-transform" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 text-white/80 text-xs select-none">
          {/* File tree placeholder */}
          <div className="animate-pulse text-white/40">File tree coming soon…</div>
        </div>
      </div>
      {/* Main coding area: header, tabs, editor, terminal */}
      <div className="flex-1 flex flex-col bg-black/20 border border-white/10 rounded-2xl shadow-2xl min-w-0 relative" style={{height: containerHeight}}>
        {/* Header - Thinner, compact */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-white/10 bg-gradient-to-r from-vibe-purple/40 to-vibe-blue/30 rounded-t-2xl shadow-lg relative min-h-[54px]">
          <div className="flex items-center gap-3">
            <span className="text-white/90 font-mono text-base font-bold tracking-wide drop-shadow-lg">main.py</span>
            <span className="ml-3 px-2 py-0.5 rounded-full bg-vibe-purple/20 text-vibe-purple text-xs font-semibold tracking-widest shadow">PYTHON</span>
          </div>
          {/* Floating Run Button - compact, modern */}
          <button
            className="relative group flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-br from-vibe-purple to-vibe-blue shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-vibe-blue/30 border border-white/10"
            style={{ top: '0.1rem', right: '0.1rem' }}
            onClick={handleRun}
            disabled={isRunning}
            aria-label="Run Code"
          >
            <span className="relative flex items-center justify-center w-6 h-6">
              <span className="absolute inline-flex h-full w-full rounded-full bg-vibe-blue opacity-40 group-hover:animate-ping"></span>
              <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18l15-9L5 3z" /></svg>
            </span>
            <span className="text-white font-bold text-sm tracking-wide drop-shadow">{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
        {/* Tabs (placeholder) */}
        <div className="flex items-center gap-2 px-6 py-1 border-b border-white/10 bg-black/30">
          <div className="flex items-center px-3 py-1 rounded-lg mr-2 bg-vibe-purple/30 text-white font-bold shadow">
            <span className="mr-2">main.py</span>
            <button className="ml-1 text-white/60 hover:text-red-400">×</button>
            </div>
        </div>
        {/* Editor */}
        <div style={{ height: editorHeight }}>
          <MonacoEditor
            height="100%"
            language="python"
            value={code}
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
            onChange={v => setCode(v || '')}
          />
        </div>
        {/* Draggable divider */}
        <DragBar onDrag={handleDrag} />
        {/* Terminal always visible at the bottom, matches editor width and border radius */}
        <Terminal output={terminalOutput} isRunning={isRunning} onClear={() => setTerminalOutput([])} height={terminalHeight} />
      </div>
      {/* AI Chat Panel */}
      <AIAssistantPanel setCode={setCode} />
    </div>
  );
}