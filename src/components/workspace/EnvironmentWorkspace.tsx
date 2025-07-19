import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, Copy, Play, FlaskConical, X, Clock } from 'lucide-react';
import TerminalComponent, { TerminalHandle } from '../../../components/Terminal';
import { ScrollArea } from '@/components/ui/scroll-area';

const VITE_TERMINAL_WS_URL = import.meta.env.VITE_TERMINAL_WS_URL || (window.location.hostname === 'localhost' ? 'ws://localhost:8081/' : '');

export function EnvironmentWorkspace() {
  const [requirements, setRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTerminalTip, setShowTerminalTip] = useState(true);
  const terminalRef = useRef<TerminalHandle>(null);

  // New: Create Virtual Environment
  const handleCreateVenv = () => {
    if (terminalRef.current) {
      terminalRef.current.sendToTerminal('python -m venv venv\n');
    }
  };

  // Responsive terminal height (30% of workspace by default)
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);
  React.useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const HEADER_HEIGHT = 64 + 56; // header + section header/buttons
  const defaultTerminalHeight = Math.round((containerHeight - HEADER_HEIGHT) * 0.3);
  const [terminalHeight, setTerminalHeight] = useState(defaultTerminalHeight);

  // Drag bar only resizes from the top of the terminal
  const dragging = useRef(false);
  const handleDrag = (e: React.MouseEvent) => {
    dragging.current = true;
    const startY = e.clientY;
    const startHeight = terminalHeight;
    const onMove = (moveEvent: MouseEvent) => {
      if (dragging.current) {
        const delta = moveEvent.clientY - startY;
        setTerminalHeight(h => Math.max(180, startHeight - delta));
      }
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Fetch requirements from OpenAI
  const handleLoadRequirements = async () => {
    setLoading(true);
    setError(null);
    setRequirements([]);
    try {
      const apiKey = import.meta.env.VITE_APP_OPENAI_API_KEY;
      if (!apiKey) throw new Error('No OpenAI API key configured.');
      const prompt = `List ONLY the shell commands and package requirements needed to set up this project. No explanations, just the commands, one per line. Example: pip install numpy\nnpm install express\napt-get install ffmpeg`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are an expert developer. Only output the required shell commands and package requirements for the user project, one per line, no explanations.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        })
      });
      if (!response.ok) throw new Error('Failed to fetch requirements.');
      const data = await response.json();
      const text = data.choices[0].message.content.trim();
      const lines = text.split('\n').filter(Boolean);
      setRequirements(lines);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // New: Load requirements from Ideation chat
  const handleLoadFromChat = async () => {
    setLoading(true);
    setError(null);
    setRequirements([]);
    try {
      const apiKey = import.meta.env.VITE_APP_OPENAI_API_KEY;
      if (!apiKey) throw new Error('No OpenAI API key configured.');
      // Get chat from localStorage
      const chatRaw = localStorage.getItem('vibecode-ideation-chat');
      let chatContext = '';
      if (chatRaw) {
        try {
          const chatArr = JSON.parse(chatRaw);
          chatContext = chatArr.map((m: any) => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
        } catch {}
      }
      const prompt = `Given the following project idea and discussion, list ONLY the shell commands and package requirements needed to set up the project. No explanations, just the commands, one per line.\n\n${chatContext}`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are an expert developer. Only output the required shell commands and package requirements for the user project, one per line, no explanations.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        })
      });
      if (!response.ok) throw new Error('Failed to fetch requirements.');
      const data = await response.json();
      const text = data.choices[0].message.content.trim();
      const lines = text.split('\n').filter(Boolean);
      setRequirements(lines);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
  };

  // Run command in terminal
  const handleRun = (cmd: string) => {
    if (terminalRef.current) {
      terminalRef.current.sendToTerminal(cmd + '\n');
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gradient-to-br from-[#0c0915] via-[#121125] to-[#1b1a2e] p-6">
      <div className="w-full max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <FlaskConical className="h-8 w-8 text-vibe-purple" />
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Environment Setup</h1>
        </div>
        <div className="mb-6 text-base text-white/70 font-normal leading-relaxed w-full" style={{letterSpacing: '0.01em'}}>
          This workspace helps you prepare your development environment. Please create a virtual environment first before installing any dependencies. Once the environment is set up, use the options below to fetch and install project requirements.
        </div>

        {/* Main Content: Two Columns */}
        <div className="flex flex-row gap-8 w-full items-stretch" style={{minHeight: 540}}>
          {/* Left Column: Actions & Requirements */}
          <div className="flex-1 flex flex-col justify-start">
            {/* Button Group */}
            <div className="w-full flex flex-col gap-3 mb-4">
              <Button
                className="vibe-glow-btn w-full transition-transform duration-150 hover:scale-105"
                style={{ minWidth: 0, borderRadius: '1rem', minHeight: 52 }}
                onClick={handleCreateVenv}
              >
                <Play className="h-5 w-5" />
                Create Virtual Environment
              </Button>
              <div className="flex gap-3 w-full">
                <Button
                  className="vibe-glow-btn flex-1 transition-transform duration-150 hover:scale-105"
                  style={{ minWidth: 0, borderRadius: '1rem', minHeight: 52 }}
                  onClick={handleLoadRequirements}
                  disabled={loading}
                >
                  {loading ? <Loader className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                  {loading ? 'Loading...' : 'Load Setup Requirements'}
                </Button>
                <Button
                  className="vibe-glow-btn-blue flex-1 transition-transform duration-150 hover:scale-105"
                  style={{ minWidth: 0, borderRadius: '1rem', minHeight: 52 }}
                  onClick={handleLoadFromChat}
                  disabled={loading}
                >
                  {loading ? <Loader className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                  {loading ? 'Loading...' : 'Load from Idea Chat'}
                </Button>
              </div>
            </div>

            {/* Requirements Card */}
            <div className="w-full flex flex-col flex-1">
              <h2 className="text-lg md:text-xl font-bold text-white mb-3 pl-1">Setup Commands</h2>
              <ScrollArea className="h-full max-h-[340px] rounded-xl bg-black/20 border border-white/10 p-4 custom-canvas-scroll mb-4 overflow-y-auto">
                {requirements.length === 0 && !loading && (
                  <div className="text-white/60 text-center py-12 select-none">No requirements loaded yet. Click a button above to fetch setup commands.</div>
                )}
                <div className="grid gap-4">
                  {requirements.map((cmd, idx) => (
                    <Card key={idx} className="bg-vibe-codeblock border-vibe-purple/20 rounded-xl shadow-lg relative overflow-hidden">
                      <CardContent className="py-4 px-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-white text-sm break-all">{cmd}</span>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" className="vibe-codeblock-copy" title="Copy" onClick={() => handleCopy(cmd)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="vibe-codeblock-copy" title="Run in Terminal" onClick={() => handleRun(cmd)}>
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Column: Terminal */}
          <div className="flex-1 flex flex-col justify-start" style={{minWidth: 420, maxWidth: 540}}>
            <div className="flex flex-col justify-start rounded-xl shadow-xl vibe-terminal-bg border-t-2 border-vibe-purple/30 animate-fade-in h-full" style={{minHeight: 540}}>
              <div className="flex items-center px-4 py-1 gap-2 border-b-2 border-vibe-purple/70 rounded-t-xl bg-gradient-to-r from-[#2d2346]/80 to-[#3a2d5c]/80 shadow-xl relative z-10" style={{ minHeight: 32 }}>
                <span className="w-4 h-4 bg-vibe-purple rounded-full mr-2" />
                <span className="text-white font-bold text-lg drop-shadow" style={{ letterSpacing: '0.02em' }}>Terminal (Interactive)</span>
              </div>
              <TerminalComponent ref={terminalRef} wsUrl={VITE_TERMINAL_WS_URL} height={480} className="vibe-terminal-bg rounded-b-xl" />
            </div>
            
            {/* Terminal Startup Tip Popup */}
            {showTerminalTip && (
              <div className="relative mt-3">
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Clock className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-amber-200 font-semibold text-sm mb-1">Terminal Initialization</h4>
                      <p className="text-amber-100/90 text-sm leading-relaxed">
                        The interactive terminal takes ~30 seconds to start initially as it sets up the containerized environment. 
                        This only happens once per session for security and isolation.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-6 w-6 text-amber-300 hover:text-amber-100 hover:bg-amber-400/20 rounded-lg"
                      onClick={() => setShowTerminalTip(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
