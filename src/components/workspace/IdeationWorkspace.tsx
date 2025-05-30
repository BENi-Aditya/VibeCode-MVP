import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, X, Send, Loader, Info, ChevronDown, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ModelOption {
  id: string;
  name: string;
  available: boolean;
}

export function IdeationWorkspace() {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      content: 'Hello! I\'m your AI assistant. What kind of project would you like to build today?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [setupProgress, setSetupProgress] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  // Available models
  const [models] = useState<ModelOption[]>([
    { id: 'gpt-4', name: 'GPT-4.1', available: true },
    { id: 'grok', name: 'Grok', available: false },
    { id: 'gemini', name: 'Gemini', available: false }
  ]);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(models[0]);
  
  // UI refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Waveform visualization data
  const [waveformData, setWaveformData] = useState<number[]>(Array(30).fill(0).map(() => Math.random() * 0.5 + 0.1));

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Only add speech synthesis when component mounts
    speechSynthesisRef.current = new SpeechSynthesisUtterance();
    
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.rate = 1.0;
      speechSynthesisRef.current.pitch = 1.0;
      speechSynthesisRef.current.volume = 1.0;
    }
    
    return () => {
      if (speechSynthesis && speechSynthesisRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Handle waveform animation
  useEffect(() => {
    // Simulate waveform animation with smoother transitions
    if (isRecording || isAiSpeaking) {
      const interval = setInterval(() => {
        setWaveformData(prev => 
          prev.map(value => {
            // Create smoother transitions by limiting the change amount
            const change = Math.random() * 0.3 - 0.15;
            const newValue = Math.max(0.1, Math.min(0.9, value + change));
            return newValue;
          })
        );
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isRecording, isAiSpeaking]);

  // Text-to-speech function for AI responses
  const speakText = (text: string, onEnd?: () => void) => {
    console.log("Speaking text:", text);
    if (!speechSynthesisRef.current) return;
    
    // Cancel any ongoing speech
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    
    // Split the text into sentences to make it sound more natural
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    const speakNextSentence = (index: number) => {
      if (index >= sentences.length) {
        setIsAiSpeaking(false);
        if (onEnd) onEnd();
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Use a female voice if available
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('female') || 
        voice.name.includes('Google') || 
        voice.name.includes('Samantha')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.onend = () => {
        speakNextSentence(index + 1);
      };
      
      speechSynthesis.speak(utterance);
    };
    
    setIsAiSpeaking(true);
    
    // Load voices first (required in some browsers)
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakNextSentence(0);
      };
    } else {
      speakNextSentence(0);
    }
  };

  // Function to start speech recognition
  const startSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return null;
    }
    
    // @ts-ignore - TypeScript doesn't have types for the Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let isListening = true;
    let localTranscription = '';
    
    recognition.onstart = () => {
      setIsRecording(true);
      setTranscription('');
      setCaptions(['Listening...']);
      isListening = true;
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      // Clear the silence timer every time we get a result
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      
      // Set a new silence timer - if we don't get a result in 2s, consider the speech done
      silenceTimer = setTimeout(() => {
        if (isListening) {
          recognition.stop();
        }
      }, 2000);
      
      // Update captions with the interim results
      setCaptions([interimTranscript || 'Listening...']);
      
      // If we have a final transcript, update it
      if (finalTranscript) {
        setTranscription(prev => {
          localTranscription = (prev + ' ' + finalTranscript).trim();
          return localTranscription;
        });
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      setCaptions([]);
      isListening = false;
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      isListening = false;
      
      // Clean up the silence timer
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      
      // If we have a transcription, send it as a message
      if (localTranscription.trim()) {
        setCaptions(['Processing...']);
        
        // Send the message
        const finalTranscription = localTranscription.trim();
        handleSendMessage(finalTranscription, true); // true = voice mode
      } else {
        setCaptions([]);
      }
    };
    
    recognition.start();
    
    recognitionRef.current = recognition;
    
    return recognition;
  }, [transcription]); // Dependencies

  // Send message to OpenAI API
  const handleSendMessage = async (textOrEvent?: string | React.MouseEvent, isVoice?: boolean) => {
    // Check if we're getting a MouseEvent (from the button click) or a string (from speech)
    const messageText = typeof textOrEvent === 'string' 
      ? textOrEvent 
      : inputText;
      
    if (messageText.trim() === '') return;
    
    const userMessage: Message = {
      sender: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setTranscription('');
    setIsAiThinking(true);
    
    try {
      // Real API call with the API key
      const apiKey = import.meta.env.VITE_APP_OPENAI_API_KEY;
      
      // If no API key, fall back to mock response
      if (!apiKey) {
        setTimeout(() => {
          simulateAiResponse(userMessage.content, isVoice);
        }, 1500);
        return;
      }
      
      // Make the actual API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant for software development projects. Help the user plan and develop their project with specific, actionable advice.' },
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            { role: 'user', content: userMessage.content }
          ],
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      const aiMessage: Message = {
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // If in voice mode, use text-to-speech for the response
      if (voiceMode || isVoice) {
        speakText(aiResponse, () => {
          // After AI finishes speaking, auto-start listening again if still in voice mode
          if (voiceMode) {
            setTimeout(() => {
              startSpeechRecognition();
            }, 400);
          }
        });
      }
      
      // Check for environment setup keywords
      if (userMessage.content.toLowerCase().includes('python') || 
          userMessage.content.toLowerCase().includes('web') || 
          userMessage.content.toLowerCase().includes('react')) {
        simulateEnvironmentSetup(
          userMessage.content.toLowerCase().includes('python') ? 'python-game' : 'web-app'
        );
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
      // Fallback to simulation if API fails
      simulateAiResponse(userMessage.content, isVoice);
    } finally {
      setIsAiThinking(false);
    }
  };

  const simulateAiResponse = (userInput: string, isVoice?: boolean) => {
    let response = '';
    
    if (userInput.toLowerCase().includes('python') && userInput.toLowerCase().includes('game')) {
      response = "That sounds like a great Python game project! Could you tell me more about what kind of game you're thinking of? For example, is it a platformer, puzzle game, or something else?";
      
      // Simulate environment setup
      simulateEnvironmentSetup('python-game');
    } else if (userInput.toLowerCase().includes('web') && userInput.toLowerCase().includes('app')) {
      response = "A web application sounds perfect! What functionality would you like your web app to have?";
      
      // Simulate environment setup
      simulateEnvironmentSetup('web-app');
    } else {
      response = "That's an interesting idea! Could you provide more details about your project so I can help set up the right environment?";
    }
    
    const aiMessage: Message = {
      sender: 'ai',
      content: response,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
    
    // If in voice mode, use text-to-speech for the response
    if (voiceMode || isVoice) {
      speakText(response, () => {
        if (voiceMode) {
          setTimeout(() => {
            startSpeechRecognition();
          }, 400);
        }
      });
    }
  };

  const simulateEnvironmentSetup = (projectType: string) => {
    setSetupProgress(["Starting environment setup..."]);
    
    const steps = projectType === 'python-game' 
      ? [
          "Creating Python virtual environment...",
          "Installing Pygame...",
          "Setting up game development environment...",
          "Preparing game asset directory structure...",
          "Environment setup complete! Ready for coding."
        ]
      : [
          "Setting up web application environment...",
          "Installing React framework...",
          "Setting up project directory structure...",
          "Installing required dependencies...",
          "Environment setup complete! Ready for coding."
        ];
    
    let currentStep = 0;
    
    const setupInterval = setInterval(() => {
      currentStep++;
      
      if (currentStep < steps.length) {
        setSetupProgress(prev => [...prev, steps[currentStep]]);
      } else {
        clearInterval(setupInterval);
      }
    }, 2000);
  };

  const toggleVoiceMode = () => {
    if (!voiceMode) {
      // Enter voice mode
      setVoiceMode(true);
      startSpeechRecognition();
    } else {
      // Exit voice mode
      setVoiceMode(false);
      setIsRecording(false);
      setIsAiSpeaking(false);
      setCaptions([]);
      
      // Stop any ongoing speech
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
      
      // Stop and clean up speech recognition/mic
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    }
  };

  // Reset chat function
  const resetChat = () => {
    setMessages([
      {
        sender: 'ai',
        content: 'Hello! I\'m your AI assistant. What kind of project would you like to build today?',
        timestamp: new Date()
      }
    ]);
    setInputText('');
    setTranscription('');
    setSetupProgress([]);
  };

  // Handle multi-line input and send on Enter
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full w-full bg-gradient-to-br from-[#0c0915] via-[#121125] to-[#1b1a2e]">
      {/* Left panel with chat and voice interface */}
      <div className="w-[65%] h-full flex flex-col p-5 relative">
        {/* Header with title and model selector */}
        <div className="flex justify-between items-center mb-5 px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-vibe-purple to-vibe-blue flex items-center justify-center shadow-lg mr-3">
              <img src="/Logo/logo.png" alt="VibeCode Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold text-white">VibeCode Ideation Station</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowInfo(!showInfo)}
                    className="rounded-full bg-white/5 hover:bg-white/10"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-black/70 backdrop-blur-md border border-white/10 z-[100001]">
                  <p>Voice-enabled AI assistant</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={resetChat}
                    className="rounded-full bg-white/5 hover:bg-white/10"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-black/70 backdrop-blur-md border border-white/10 z-[100001]">
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-3 h-9 bg-black/30 backdrop-blur-sm border border-white/10 rounded-full">
                  <span className="mr-2 text-sm text-white">{selectedModel.name}</span>
                  <ChevronDown className="h-4 w-4 text-white/60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="min-w-[180px] bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl"
                align="end"
              >
                {models.map(model => (
                  <DropdownMenuItem
                    key={model.id}
                    disabled={!model.available}
                    className={cn(
                      "text-sm rounded-lg flex items-center justify-between px-3 py-2",
                      model.available 
                        ? "text-white hover:bg-white/10 cursor-pointer" 
                        : "text-white/50 cursor-not-allowed"
                    )}
                    onClick={() => model.available && setSelectedModel(model)}
                  >
                    {model.name}
                    {!model.available && (
                      <span className="text-xs bg-vibe-purple/20 text-vibe-purple px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 mb-4 space-y-4 relative">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={cn(
                "flex max-w-[80%] glass-card animate-fade-in-up transition-all duration-300 p-4 rounded-xl",
                message.sender === 'user' 
                  ? "ml-auto bg-vibe-purple/10 border-vibe-purple/20" 
                  : "mr-auto bg-white/5 border-white/10"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <div 
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center mr-2",
                      message.sender === 'user' 
                        ? "bg-gradient-to-br from-vibe-purple to-vibe-blue" 
                        : "bg-gradient-to-br from-blue-500 to-cyan-500"
                    )}
                  >
                    <span className="text-white text-xs font-bold">
                      {message.sender === 'user' ? 'U' : 'AI'}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="mt-2 text-white/90">
                  {message.sender === 'ai' ? (
                    <React.Fragment>
                      <ReactMarkdown components={{
                        p: ({node, ...props}) => <span {...props} />,
                      }}>
                        {message.content}
                      </ReactMarkdown>
                    </React.Fragment>
                  ) : (
                    message.content
                  )}
                </p>
              </div>
            </div>
          ))}
          
          {isAiThinking && (
            <div className="flex max-w-[80%] glass-card animate-fade-in-up transition-all duration-300 p-4 rounded-xl mr-auto bg-white/5 border-white/10">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <p className="text-sm text-white/60">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="mt-2 flex items-center">
                  <div className="animate-pulse flex space-x-1">
                    <div className="h-2 w-2 bg-white/60 rounded-full"></div>
                    <div className="h-2 w-2 bg-white/60 rounded-full animation-delay-200"></div>
                    <div className="h-2 w-2 bg-white/60 rounded-full animation-delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
        
        {/* Voice Mode Overlay */}
        {voiceMode && (
          <div className="absolute inset-0 z-[99990] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            {/* Close Button */}
            <div className="absolute top-6 right-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleVoiceMode}
                className="rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Voice Circle */}
            <div 
              className={cn(
                "relative w-40 h-40 rounded-full flex items-center justify-center",
                isRecording 
                  ? "bg-vibe-purple/20 animate-pulse-slow" 
                  : isAiThinking
                    ? "bg-yellow-500/20 animate-pulse-slow"
                    : isAiSpeaking 
                      ? "bg-blue-500/20 animate-pulse-slow" 
                      : "bg-white/10"
              )}
            >
              {/* Border */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-full border-2 animate-pulse-slow",
                  isRecording 
                    ? "border-vibe-purple/50" 
                    : isAiThinking
                      ? "border-yellow-500/50"
                      : isAiSpeaking 
                        ? "border-blue-500/50" 
                        : "border-white/20"
                )}
              ></div>
              
              {/* Waveform */}
              {(isRecording || isAiSpeaking) && (
                <div className="absolute inset-0 flex items-center justify-center" ref={waveformRef}>
                  <div className="flex items-end h-16 space-x-1">
                    {waveformData.map((height, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "w-1 rounded-full animate-waveform",
                          isRecording ? "bg-vibe-purple" : "bg-blue-500"
                        )}
                        style={{ 
                          height: `${height * 100}%`,
                          animationDelay: `${i * 30}ms`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Loading spinner when AI is thinking */}
              {isAiThinking && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Status text */}
              <div className="absolute -bottom-16 text-center">
                <p className="text-white/80 text-lg font-medium">
                  {isRecording 
                    ? "Listening..." 
                    : isAiThinking
                      ? "Processing..." 
                      : isAiSpeaking 
                        ? "Speaking..." 
                        : "Click microphone to start"
                  }
                </p>
                {captions.length > 0 && isRecording && (
                  <div className="mt-2 max-w-md">
                    <p className="text-white/60 text-sm">{captions[0]}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Instructions */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-white/60 text-sm">
                {isRecording 
                  ? "Speak now..." 
                  : isAiThinking
                    ? "Processing..." 
                    : isAiSpeaking 
                      ? "Listening to AI..." 
                      : "Tap the circle to start speaking"}
              </p>
            </div>
          </div>
        )}
        
        {/* Input area */}
        <div className="flex items-end gap-3 px-4 pb-4">
          <textarea
            className="flex-1 min-h-[44px] max-h-40 resize-none rounded-xl px-4 py-3 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-vibe-purple/50 transition-all duration-200"
            placeholder="Type your message... (Shift+Enter for new line)"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={1}
            spellCheck={true}
            data-interactive
          />
          <Button
            onClick={handleSendMessage}
            className="rounded-full h-12 w-12 flex items-center justify-center bg-gradient-to-br from-vibe-purple to-vibe-blue shadow-lg hover:scale-105 transition-all duration-300"
            data-interactive
            disabled={isAiThinking || inputText.trim() === ''}
          >
            <Send className="h-5 w-5" />
          </Button>
          <Button
            onClick={toggleVoiceMode}
            className={cn(
              "rounded-full h-12 w-12 flex items-center justify-center bg-gradient-to-br from-vibe-blue to-vibe-purple shadow-lg hover:scale-105 transition-all duration-300",
              voiceMode && "ring-2 ring-vibe-purple"
            )}
            data-interactive
            aria-label="Toggle Voice Mode"
            disabled={isAiThinking}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Right panel with environment setup */}
      <div className="w-[35%] h-full p-4 bg-black/20 backdrop-blur-lg border-l border-white/10">
        <Card className="h-full rounded-xl overflow-hidden border-white/20 bg-white/5 backdrop-blur-lg shadow-xl" data-glass>
          <div className="p-6">
            <h3 className="text-lg font-medium mb-6 flex items-center text-white/90">
              <Loader className="h-5 w-5 animate-spin mr-3 text-vibe-purple" />
              Environment Setup Progress
            </h3>
            
            <div className="space-y-4">
              {setupProgress.length === 0 ? (
                <p className="text-white/60 p-4 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
                  Describe your project in the chat to start the setup process.
                </p>
              ) : (
                setupProgress.map((step, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex p-4 rounded-lg animate-fade-in transition-all duration-300",
                      index === setupProgress.length - 1 
                        ? "bg-vibe-purple/10 border border-vibe-purple/30 shadow-[0_0_15px_rgba(138,43,226,0.2)]" 
                        : "bg-white/5 border border-white/10"
                    )}
                    data-glass={index === setupProgress.length - 1 ? null : true}
                    data-glow={index === setupProgress.length - 1 ? 'purple' : null}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 mr-3 transition-all duration-300",
                      index === setupProgress.length - 1 
                        ? "bg-vibe-purple animate-pulse-slow"
                        : "bg-white/40"
                    )}></div>
                    <p className={index === setupProgress.length - 1 ? "text-white/90" : "text-white/60"}>
                      {step}
                    </p>
                  </div>
                ))
              )}
              
              {setupProgress.length > 0 && setupProgress.length < 5 && (
                <div className="flex items-center mt-4 text-sm text-white/70 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10" data-glass>
                  <div className="animate-spin mr-3">
                    <Loader className="h-4 w-4 text-vibe-purple" />
                  </div>
                  <span>Setting up environment...</span>
                </div>
              )}
            </div>

            {/* Framework Selection Cards */}
            {setupProgress.length > 0 && setupProgress.includes("Setting up web application environment...") && (
              <div className="mt-8">
                <h4 className="text-sm font-medium mb-4 text-white/80">Select Framework</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['React', 'Vue'].map((framework) => (
                    <div 
                      key={framework}
                      className="p-5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20 
                        transition-all duration-300 cursor-pointer flex flex-col items-center
                        hover:bg-white/10 hover:border-white/30 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)]
                        hover:transform hover:translate-y-[-5px]"
                      data-interactive
                      data-glass
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-vibe-purple/30 to-vibe-blue/30 
                        flex items-center justify-center mb-3 shadow-inner border border-white/20
                        transition-all duration-300 hover:shadow-[0_0_10px_rgba(138,43,226,0.5)]">
                        <span className="text-white text-lg font-medium">{framework === 'React' ? 'R' : 'V'}</span>
                      </div>
                      <span className="text-sm font-medium text-white/80">{framework}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Code Snippet Box */}
            {setupProgress.length > 0 && setupProgress.includes("Installing Pygame...") && (
              <div className="mt-8">
                <h4 className="text-sm font-medium mb-4 text-white/80">Setup Command</h4>
                <div className="p-1 rounded-xl bg-[#1E1E2F] border border-white/10 font-mono text-sm overflow-hidden shadow-lg" data-interactive>
                  <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs text-white/60">Terminal</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200" data-interactive>
                      Copy
                    </Button>
                  </div>
                  <div className="p-4 bg-[#121212]">
                    <pre className="text-white/90">
                      <span className="text-green-400">$</span> pip install pygame
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Info Modal */}
      {showInfo && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowInfo(false)}
        >
          <div 
            className="max-w-md w-full p-6 glass-card rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">About VibeCode</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowInfo(false)}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4 text-white/80">
              <p>
                VibeCode helps you ideate and develop software projects with AI assistance.
              </p>
              <p>
                <strong>Voice Controls:</strong> Click the microphone button to speak your ideas.
              </p>
              <p>
                <strong>Models:</strong> Currently supporting GPT-4.1, with more models coming soon.
              </p>
              <p>
                The Ideation workspace helps you brainstorm and plan your project before moving to the coding stages.
              </p>
            </div>
            
            <Button 
              className="w-full mt-6 bg-gradient-to-r from-vibe-purple to-vibe-blue hover:from-vibe-purple/90 hover:to-vibe-blue/90"
              onClick={() => setShowInfo(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
