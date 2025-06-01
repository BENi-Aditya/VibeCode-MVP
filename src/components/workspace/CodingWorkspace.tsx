// IMPORTANT: Set VITE_TERMINAL_WS_URL in your Render frontend environment variables to the deployed terminal backend's WebSocket URL (e.g., wss://your-terminal-service.onrender.com/). The terminal will not work in production without this.
import React, { useState, useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { codingWorkspaceInstructions } from '../../lib/customInstructions';
import ReactMarkdown from 'react-markdown';
import TerminalComponent, { TerminalHandle } from '../../../components/Terminal';
import rehypeHighlight from 'rehype-highlight';
import { Download } from 'lucide-react';
import { ExploreExamplesBox } from '@/components/ui/ExploreExamplesBox';

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
  const [ideaContext, setIdeaContext] = useState<string | null>(null);

  // Load idea context from localStorage (set by IdeationWorkspace)
  useEffect(() => {
    // Try both canvasContent and a dedicated key for robustness
    const canvas = localStorage.getItem('vibecode-ideation-canvas') || localStorage.getItem('vibecode-ideation-canvasContent');
    if (canvas && typeof canvas === 'string' && canvas.length > 0) {
      setIdeaContext(canvas);
    }
  }, []);

  useEffect(() => {
    const savedChat = localStorage.getItem('vibecode-coding-chat');
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vibecode-coding-chat', JSON.stringify(messages));
  }, [messages]);

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
      // Compose system prompt with idea context if available
      let systemPrompt = codingWorkspaceInstructions;
      if (ideaContext) {
        systemPrompt = `${codingWorkspaceInstructions}\n\n---\n\n# Project Idea Context (from Ideation Workspace):\n${ideaContext}\n---\n`;
      }
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
            ...messages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content })),
            { role: 'user', content: userMessage.content }
          ],
          temperature: 0.7
        })
      });
      if (!response.ok) throw new Error('API error: ' + response.statusText);
      const data = await response.json();
      // Fix: Always treat the AI response as a string
      let aiResponse = data.choices?.[0]?.message?.content;
      if (typeof aiResponse !== 'string') {
        aiResponse = JSON.stringify(aiResponse);
      }
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

  // Utility: Detect if a string looks like code (basic heuristic)
  function isLikelyCode(text: string) {
    // Heuristic: lots of indents, semicolons, or lines starting with def/class/for/if/while/return
    const lines = text.split('\n');
    const codeLines = lines.filter(l => l.match(/^(\s{2,}|def |class |for |if |while |return |import |print\()/));
    return codeLines.length > 2 || /def |class |import |print\(/.test(text);
  }

  // Fallback: Wrap plain code in markdown if missing backticks
  function ensureMarkdownCodeBlock(text: string) {
    // If already contains triple backticks, return as is
    if (/```/.test(text)) return text;
    // If it looks like code, wrap it
    if (isLikelyCode(text)) {
      // Try to guess language (default python)
      let lang = 'python';
      if (/function |const |let |var /.test(text)) lang = 'javascript';
      if (/public |private |class |void /.test(text)) lang = 'java';
      return `\
\`\`\`${lang}\n${text}\n\`\`\``;
    }
    return text;
  }

  // Utility: Extract code string from children (handles array, string, object)
  function extractCodeString(children: any): string {
    if (Array.isArray(children)) {
      return children.map(extractCodeString).join('');
    } else if (typeof children === 'string') {
      return children;
    } else if (typeof children === 'object' && children && 'props' in children) {
      return extractCodeString(children.props.children);
    }
    return '';
  }

  // Custom code block renderer for copy/apply buttons
  function CodeBlock({node, inline, className, children, ...props}: any) {
    const match = /language-(\w+)/.exec(className || '');
    const code = extractCodeString(children).replace(/\n$/, '');
    // Show filename if language is detected
    let filename = '';
    if (match && match[1]) {
      if (match[1] === 'python') filename = 'main.py';
      else if (match[1] === 'javascript') filename = 'main.js';
      else filename = `file.${match[1]}`;
    }
    return !inline ? (
      <div className="relative vibe-codeblock">
        <div className="vibe-codeblock-header flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/15 rounded-t-[0.7rem]">
          <span className="text-xs font-mono text-white/70">{filename || (match ? match[1] : '')}</span>
          <div className="flex gap-2">
            <button
              className="vibe-codeblock-copy"
              onClick={() => {navigator.clipboard.writeText(code)}}
              title="Copy"
              style={{zIndex: 10}}
            >
              Copy
            </button>
            <button
              className="vibe-codeblock-copy"
              onClick={() => setCode(code)}
              title="Apply"
              style={{zIndex: 10}}
            >
              Apply
            </button>
          </div>
        </div>
        <div className="vibe-codeblock-body" style={{maxHeight: '340px', overflow: 'auto', borderRadius: '0 0 0.7rem 0.7rem'}}>
          <pre className={`vibe-codeblock-pre vibe-codeblock-wrap`} tabIndex={0}>
            <code className={className}>{code}</code>
          </pre>
        </div>
      </div>
    ) : (
      <code className={className} {...props}>{children}</code>
    );
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
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${msg.sender === 'user' ? 'bg-gradient-to-br from-vibe-purple to-vibe-blue' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}> <span className="text-white text-xs font-bold">{msg.sender === 'user' ? 'U' : 'AI'}</span> </div>
                    <p className="text-xs text-white/60">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-white/90 text-sm min-w-0">
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={{code: (props) => <CodeBlock {...props} />}}>
                      {msg.sender === 'ai' ? ensureMarkdownCodeBlock(msg.content) : msg.content}
                    </ReactMarkdown>
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
          <ExploreExamplesBox
            examples={[
              'Create a Python function to check if a number is prime.',
              'Write a basic calculator in Python using functions.',
              'Write a Python script that renames all files in a folder to lowercase.',
              'Generate a Python script that sends an email alert if CPU usage crosses 80%.',
              'Create a Python script that reads a CSV and prints the sum of a column.'
            ]}
            onExampleClick={setInputText}
            className="mb-2 mt-4"
          />
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
  const [containerHeight, setContainerHeight] = useState(window.innerHeight - 2 * 16);
  const HEADER_HEIGHT = 54 + 36;
  const defaultTerminalHeight = Math.round((containerHeight - HEADER_HEIGHT) * 0.3);
  const defaultEditorHeight = (containerHeight - HEADER_HEIGHT) - defaultTerminalHeight;
  const [editorHeight, setEditorHeight] = useState(defaultEditorHeight);
  const terminalRef = useRef<TerminalHandle>(null);

  // Use env variable for wsUrl. Only use fallback in local dev.
  let wsUrl = import.meta.env.VITE_TERMINAL_WS_URL;
  if (!wsUrl) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      wsUrl = 'ws://localhost:8081/';
    }
  }

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight - 2 * 16);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedCode = localStorage.getItem('vibecode-coding-code');
    if (savedCode) setCode(savedCode);
  }, []);

  useEffect(() => {
    localStorage.setItem('vibecode-coding-code', code);
  }, [code]);

  const handleDrag = (deltaY: number) => {
    setEditorHeight(h => Math.max(100, h + deltaY));
  };

  // Send code to terminal on Run Code
  const handleRunCode = () => {
    if (terminalRef.current) {
      const hereDoc = [
        'clear',
        'echo "--- Running main.py ---"',
        'cat <<EOF > main.py',
        ...code.split('\n'),
        'EOF',
        'echo -e "\x1b[36m"', // Set color to cyan
        'python main.py',
        'echo -e "\x1b[0m"', // Reset color
        ''
      ].join('\n');
      terminalRef.current.sendToTerminal(hereDoc);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-[#0c0915] via-[#121125] to-[#1b1a2e] p-4 gap-4">
      {/* File Explorer */}
      <div className="w-60 bg-black/30 border border-white/10 flex flex-col rounded-2xl shadow-lg backdrop-blur-xl h-full">
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
      <div className="flex-1 flex flex-col bg-black/20 border border-white/10 rounded-2xl shadow-2xl min-w-0 relative h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-white/10 bg-gradient-to-r from-vibe-purple/40 to-vibe-blue/30 rounded-t-2xl shadow-lg relative min-h-[54px]">
          <div className="flex items-center gap-3">
            <span className="text-white/90 font-mono text-base font-bold tracking-wide drop-shadow-lg">main.py</span>
            <span className="ml-3 px-2 py-0.5 rounded-full bg-vibe-purple/20 text-vibe-purple text-xs font-semibold tracking-widest shadow">PYTHON</span>
          </div>
          {/* Run Button */}
          <div className="flex items-center gap-3">
            <button
              className="relative group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-vibe-purple to-vibe-blue shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-vibe-blue/30 border border-white/10"
              style={{ top: '0.1rem', right: '0.1rem' }}
              aria-label="Run Code"
              onClick={handleRunCode}
            >
              <span className="relative flex items-center justify-center w-6 h-6">
                <span className="absolute inline-flex h-full w-full rounded-full bg-vibe-blue opacity-40 group-hover:animate-ping"></span>
                <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18l15-9L5 3z" /></svg>
              </span>
            </button>
            <button
              className="relative group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-vibe-blue to-vibe-purple shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-vibe-blue/30 border border-white/10"
              aria-label="Download Code"
              onClick={() => {
                const blob = new Blob([code], { type: 'text/x-python' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'main.py';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
              }}
            >
              <Download className="w-5 h-5 text-white drop-shadow" />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 py-1 border-b border-white/10 bg-black/30">
          <div className="flex items-center px-3 py-1 rounded-lg mr-2 bg-vibe-purple/30 text-white font-bold shadow">
            <span className="mr-2">main.py</span>
            <button className="ml-1 text-white/60 hover:text-red-400">×</button>
          </div>
        </div>
        {/* Editor + Terminal (flex layout) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div style={{ flex: '1 1 0%', minHeight: 0 }}>
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
          {/* Terminal */}
          <div style={{ flex: '0 0 260px', minHeight: 0 }} className="w-full border-t-2 border-vibe-purple/30 rounded-b-2xl shadow-xl flex flex-col animate-fade-in vibe-terminal-bg mt-2">
            <div className="flex items-center px-4 py-1 gap-2 border-b border-vibe-purple/30 rounded-t-xl bg-gradient-to-r from-[#2d2346]/80 to-[#3a2d5c]/80 relative z-10" style={{minHeight:32}}>
              <span className="w-4 h-4 bg-vibe-purple rounded-full mr-2" />
              <span className="text-vibe-purple font-bold">Terminal (Interactive)</span>
            </div>
            <TerminalComponent ref={terminalRef} wsUrl={wsUrl} height={208} className="vibe-terminal-bg" />
          </div>
        </div>
      </div>
      {/* AI Chat Panel */}
      <AIAssistantPanel setCode={setCode} />
    </div>
  );
}