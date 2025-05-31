import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, X, Send, Loader, Info, ChevronDown, Trash2, Edit, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
// Import custom instructions as raw text
import customInstructions from '/Users/tripathd/Downloads/Manual Library/Projects/VibeCode/Custom_Prompts/Custom_instructions.txt?raw';
import canvasPromptContent from '/Users/tripathd/Downloads/Manual Library/Projects/VibeCode/Custom_Prompts/canvas_prompt.txt?raw';
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
  const [canvasContent, setCanvasContent] = useState('');
  
  // New voice mode states
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'processing' | 'speaking' | 'idle'>('idle');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [continuousMode, setContinuousMode] = useState(false);
  
  // Available models
  const [models] = useState<ModelOption[]>([
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 nano', available: true },
    { id: 'grok', name: 'Grok', available: false },
    { id: 'gemini', name: 'Gemini', available: false }
  ]);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(models[0]);
  
  // UI refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Enhanced waveform visualization data
  const [waveformData, setWaveformData] = useState<number[]>(Array(50).fill(0));
  const [circleScale, setCircleScale] = useState(1);

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
  
  // Enhanced voice visualization with real audio analysis
  const startAudioVisualization = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context and analyser
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Configure analyser
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      microphoneRef.current.connect(analyserRef.current);
      
      // Start visualization loop
      const visualize = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const normalizedVolume = average / 255;
        
        // Update volume for circle scaling
        setVoiceVolume(normalizedVolume);
        setCircleScale(1 + normalizedVolume * 0.5);
        
        // Update waveform data
        const newWaveformData = Array.from({ length: 50 }, (_, i) => {
          const index = Math.floor((i / 50) * bufferLength);
          return (dataArray[index] || 0) / 255;
        });
        setWaveformData(newWaveformData);
        
        animationFrameRef.current = requestAnimationFrame(visualize);
      };
      
      visualize();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, []);
  
  const stopAudioVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setWaveformData(Array(50).fill(0));
    setVoiceVolume(0);
    setCircleScale(1);
  }, []);

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

  // Enhanced speech recognition with continuous conversation support
  const startContinuousListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }
    
    // @ts-ignore - TypeScript doesn't have types for the Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let finalTranscript = '';
    
    recognition.onstart = () => {
      setVoiceStatus('listening');
      setCurrentTranscript('');
      startAudioVisualization();
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update current transcript display
      setCurrentTranscript(finalTranscript + interimTranscript);
      
      // Clear existing silence timer
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      
      // Set new silence timer - stop listening after 3 seconds of silence
      silenceTimer = setTimeout(() => {
        recognition.stop();
      }, 3000);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setVoiceStatus('idle');
      stopAudioVisualization();
      
      // Restart listening if in continuous mode and error is not fatal
      if (continuousMode && event.error !== 'aborted') {
        setTimeout(() => {
          startContinuousListening();
        }, 1000);
      }
    };
    
    recognition.onend = () => {
      stopAudioVisualization();
      
      // Clean up silence timer
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      
      // Process the final transcript if we have one
      if (finalTranscript.trim()) {
        setVoiceStatus('processing');
        processVoiceInput(finalTranscript.trim());
      } else if (continuousMode) {
        // Restart listening if no input was captured but we're in continuous mode
        setTimeout(() => {
          startContinuousListening();
        }, 500);
      } else {
        setVoiceStatus('idle');
      }
    };
    
    recognition.start();
    recognitionRef.current = recognition;
  }, [continuousMode, startAudioVisualization, stopAudioVisualization]);
  
  // Process voice input and get AI response
  const processVoiceInput = useCallback(async (transcript: string) => {
    try {
      // Add user message to chat
      const userMessage: Message = {
        sender: 'user',
        content: transcript,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Get AI response
      const apiKey = import.meta.env.VITE_APP_OPENAI_API_KEY;
      
      if (!apiKey) {
        // Fallback to simulation
        setTimeout(() => {
          simulateVoiceResponse(transcript);
        }, 1000);
        return;
      }
      
      // Make API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: [
            { role: 'system', content: customInstructions },
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            { role: 'user', content: transcript }
          ],
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResponseText = data.choices[0].message.content;
      
      // Add AI message to chat
      const aiMessage: Message = {
        sender: 'ai',
        content: aiResponseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response
      speakAiResponse(aiResponseText);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      simulateVoiceResponse(transcript);
    }
  }, [messages, selectedModel.id]);
  
  // Simulate AI response for fallback
  const simulateVoiceResponse = useCallback((userInput: string) => {
    let response = "I understand you're interested in that. Could you tell me more about what you'd like to build?";
    
    if (userInput.toLowerCase().includes('python')) {
      response = "Python is a great choice! What kind of Python project are you thinking about?";
    } else if (userInput.toLowerCase().includes('web')) {
      response = "Web development sounds exciting! Are you thinking of a frontend or full-stack application?";
    }
    
    const aiMessage: Message = {
      sender: 'ai',
      content: response,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);
    
    speakAiResponse(response);
  }, []);
  
  // Enhanced text-to-speech with continuous mode support
  const speakAiResponse = useCallback((text: string) => {
    setVoiceStatus('speaking');
    setAiResponse(text);
    
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a pleasant voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Samantha') || 
      voice.name.includes('Google') ||
      voice.name.includes('female')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => {
      // Simulate speaking animation
      const speakingInterval = setInterval(() => {
        const randomData = Array.from({ length: 50 }, () => Math.random() * 0.6 + 0.2);
        setWaveformData(randomData);
        setCircleScale(1 + Math.random() * 0.3);
      }, 100);
      
      utterance.onend = () => {
        clearInterval(speakingInterval);
        setWaveformData(Array(50).fill(0));
        setCircleScale(1);
        setVoiceStatus('idle');
        setAiResponse('');
        
        // Continue listening if in continuous mode
        if (continuousMode && voiceMode) {
          setTimeout(() => {
            startContinuousListening();
          }, 800);
        }
      };
    };
    
    speechSynthesis.speak(utterance);
  }, [continuousMode, voiceMode, startContinuousListening]);

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
console.log('API Key Loaded:', !!apiKey); // Verify key loading
      
      // If no API key, fall back to mock response
      if (!apiKey) {
        setTimeout(() => {
          simulateAiResponse(userMessage.content, isVoice);
        }, 1500);
        return;
      }
      
      // Add basic rate limiting - prevent rapid successive calls
      const lastCallTime = sessionStorage.getItem('lastApiCallTime');
      const now = Date.now();
      const minTimeBetweenCalls = 1000; // 1 second minimum between calls
      
      if (lastCallTime && now - parseInt(lastCallTime) < minTimeBetweenCalls) {
        throw new Error('Please wait a moment before sending another message');
      }
      
      // Update last call time
      sessionStorage.setItem('lastApiCallTime', now.toString());
      
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
            { role: 'system', content: customInstructions },
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            { role: 'user', content: userMessage.content }
          ],
          temperature: 0.7
        })
      });

      console.log('API Response Status:', response.status);
      
      if (response.status === 401) {
        console.error('Authentication Failed - Verify API Key Validity');
        throw new Error('Invalid API key - Please check dashboard.openai.com');
      }

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
              startContinuousListening();
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
      
      // Provide more specific error messages
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error instanceof Response && error.status === 429) {
        errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Add a user-friendly error message
      const errorResponse: Message = {
        sender: 'ai',
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
      
      // Don't fallback to simulation for rate limit errors
      if (!(error instanceof Response && error.status === 429)) {
        // Fallback to simulation if API fails for other reasons
        simulateAiResponse(userMessage.content, isVoice);
      }
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
            startContinuousListening();
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

  // Enhanced voice mode toggle with full-screen overlay
  const toggleVoiceMode = useCallback(() => {
    if (!voiceMode) {
      // Enter voice mode
      setVoiceMode(true);
      setContinuousMode(true);
      setVoiceStatus('idle');
      setCurrentTranscript('');
      setAiResponse('');
      
      // Start listening immediately
      setTimeout(() => {
        startContinuousListening();
      }, 500);
    } else {
      // Exit voice mode
      setVoiceMode(false);
      setContinuousMode(false);
      setVoiceStatus('idle');
      setCurrentTranscript('');
      setAiResponse('');
      
      // Stop all voice activities
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      
      stopAudioVisualization();
    }
  }, [voiceMode, startContinuousListening, stopAudioVisualization]);
  
  // Handle clicking the voice circle to manually trigger listening
  const handleVoiceCircleClick = useCallback(() => {
    if (voiceStatus === 'idle') {
      startContinuousListening();
    } else if (voiceStatus === 'listening') {
      // Stop current recognition to process what was said
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [voiceStatus, startContinuousListening]);

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
  
  // Toast for notifications
  const { toast } = useToast();

  // Function to download canvas content as a .txt file
  const handleDownloadCanvas = () => {
    if (!canvasContent || canvasContent.startsWith('⚠️ Error')) {
      toast({
        title: 'Cannot Download Canvas',
        description: 'There is no valid content to download or an error occurred.',
        variant: 'destructive',
      });
      return;
    }

    const blob = new Blob([canvasContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'VibeCode_Canvas_Response.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({
      title: 'Canvas Downloaded',
      description: 'The canvas content has been downloaded as VibeCode_Canvas_Response.txt.',
      variant: 'default',
    });
  };

  // Handle Generate Canvas button click
  const handleGenerateCanvas = async () => {
    try {
      setIsAiThinking(true);
      setCanvasContent(''); // Clear previous content

      const apiKey = import.meta.env.VITE_APP_OPENAI_API_KEY; // Use the main OpenAI API key
      if (!apiKey) {
        toast({
          title: 'API Key Missing',
          description: 'OpenAI API key is not configured. Cannot generate canvas.',
          variant: 'destructive',
        });
        const mockResponse = "This is a mock canvas response because the API key is missing. Configure VITE_APP_OPENAI_API_KEY in your .env file. The prompt was: " + canvasPromptContent;
        setCanvasContent(mockResponse);
        console.log('Mock canvas_response.txt content:', mockResponse);
        setIsAiThinking(false);
        return;
      }

      // Prepare messages for the API call, including custom instructions and chat history
      const apiMessages = [
        { role: 'system', content: customInstructions }, // Add custom instructions as a system message
        ...messages.map(msg => ({ // Add existing chat history for context
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: canvasPromptContent } // Add the canvas prompt itself
      ];

      // Send canvas_prompt.txt content along with history and custom instructions to OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel.id, // Use the currently selected model
          messages: apiMessages,
          temperature: 0.5 // Adjust temperature as needed for canvas generation
        })
      });

      if (response.status === 401) {
        console.error('Authentication Failed - Verify API Key Validity');
        throw new Error('Invalid API key for canvas generation. Please check your OpenAI dashboard.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
        throw new Error(`API error during canvas generation: ${response.statusText}. ${errorData.error?.message || ''}`);
      }

      const data = await response.json();
      // Defensive check for the expected structure
      const aiCanvasResponse = data?.choices?.[0]?.message?.content;

      if (typeof aiCanvasResponse === 'string') {
        setCanvasContent(aiCanvasResponse);
      } else {
        console.error('Unexpected API response structure for canvas:', data);
        // This error will be caught by the outer catch block and displayed in the canvas
        throw new Error('Received unexpected data structure from API for canvas content.');
      }

      // Display in the Idea Refinement Canvas panel
      // setCanvasContent(aiCanvasResponse); // Moved inside the if block

      // Simulate saving to canvas_response.txt (in a real app, this would be a backend call or fs operation if in Node.js)
      console.log('Simulated save to canvas_response.txt with content:', aiCanvasResponse);
      // In a browser environment, you can't directly write to files without user interaction or a server.
      // For now, we'll just log it and display it.

      toast({
        title: 'Canvas Generated',
        description: 'The idea refinement canvas has been updated.',
        variant: 'default'
      });

    } catch (error) {
      console.error('Error generating canvas:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while generating the canvas.';
      setCanvasContent(`⚠️ Error generating canvas: ${errorMessage}`);
      toast({
        title: 'Error Generating Canvas',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsAiThinking(false);
    }
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
        
        {/* Enhanced Voice Mode Overlay */}
        {voiceMode && (
          <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-lg">
            {/* Close Button */}
            <div className="absolute top-8 right-8">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleVoiceMode}
                className="rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20"
              >
                <X className="h-6 w-6 text-white" />
              </Button>
            </div>
            
            {/* Main Voice Interface */}
            <div className="flex flex-col items-center justify-center space-y-8">
              {/* Enhanced Voice Circle */}
              <div 
                className="relative cursor-pointer transition-all duration-300 hover:scale-105 flex items-center justify-center w-[280px] h-[280px]"
                onClick={handleVoiceCircleClick}
              >
                {/* Outer Ring */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full border-4 transition-all duration-500",
                    voiceStatus === 'listening' 
                      ? "border-green-400/60 animate-pulse scale-110" 
                      : voiceStatus === 'processing'
                        ? "border-yellow-400/60 animate-pulse scale-105"
                        : voiceStatus === 'speaking' 
                          ? "border-blue-400/60 animate-pulse scale-110" 
                          : "border-white/30 scale-100"
                  )}
                  style={{
                    transform: `scale(${circleScale})`
                  }}
                ></div>
                
                {/* Main Circle */}
                <div 
                  className={cn(
                    "relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl backdrop-blur-sm",
                    voiceStatus === 'listening' 
                      ? "bg-gradient-to-br from-green-400/30 to-emerald-500/30 border-2 border-green-400/50" 
                      : voiceStatus === 'processing'
                        ? "bg-gradient-to-br from-yellow-400/30 to-orange-500/30 border-2 border-yellow-400/50"
                        : voiceStatus === 'speaking' 
                          ? "bg-gradient-to-br from-blue-400/30 to-purple-500/30 border-2 border-blue-400/50" 
                          : "bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20"
                  )}
                  style={{
                    transform: `scale(${circleScale})`
                  }}
                >
                  {/* Waveform Visualization */}
                  {(voiceStatus === 'listening' || voiceStatus === 'speaking') && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-end h-24 space-x-1">
                        {waveformData.slice(0, 30).map((height, i) => (
                          <div 
                            key={i}
                            className={cn(
                              "w-1.5 rounded-full transition-all duration-100",
                              voiceStatus === 'listening' ? "bg-green-400" : "bg-blue-400"
                            )}
                            style={{ 
                              height: `${Math.max(height * 80, 4)}px`,
                              opacity: 0.7 + height * 0.3
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Processing Spinner */}
                  {voiceStatus === 'processing' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {/* Idle State Icon */}
                  {voiceStatus === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Mic className="h-16 w-16 text-white/60" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status Display */}
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-white">
                  {voiceStatus === 'listening' && 'Listening...'}
                  {voiceStatus === 'processing' && 'Processing...'}
                  {voiceStatus === 'speaking' && 'Speaking...'}
                  {voiceStatus === 'idle' && 'Ready to Listen'}
                </h2>
                
                {/* Live Transcript */}
                {currentTranscript && (
                  <div className="max-w-2xl mx-auto p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <p className="text-white/90 text-lg leading-relaxed">
                      <span className="text-green-400 font-medium">You: </span>
                      {currentTranscript}
                    </p>
                  </div>
                )}
                
                {/* AI Response */}
                {aiResponse && voiceStatus === 'speaking' && (
                  <div className="max-w-2xl mx-auto p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <p className="text-white/90 text-lg leading-relaxed">
                      <span className="text-blue-400 font-medium">AI: </span>
                      {aiResponse}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Instructions */}
            <div className="absolute bottom-8 left-0 right-0 text-center space-y-2">
              <p className="text-white/80 text-lg font-medium">
                {voiceStatus === 'idle' && 'Click the circle to start speaking'}
                {voiceStatus === 'listening' && 'Speak now... Click again to stop'}
                {voiceStatus === 'processing' && 'Processing your request...'}
                {voiceStatus === 'speaking' && 'AI is responding...'}
              </p>
              <p className="text-white/60 text-sm">
                Continuous conversation mode is active • Press ESC or click X to exit
              </p>
            </div>
            
            {/* Keyboard shortcut handler */}
            <div 
              className="absolute inset-0 -z-10"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  toggleVoiceMode();
                }
              }}
              tabIndex={-1}
            ></div>
          </div>
        )}
        
        {/* Input area */}
        <div className="flex items-end gap-3 px-4 pb-4">
          <textarea
            className="flex-1 min-h-[44px] max-h-40 resize-none rounded-xl px-4 py-3 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-200"
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
            className="rounded-full h-12 w-12 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-400 shadow-md hover:shadow-blue-400/50 hover:shadow-lg transition-all duration-300"
            data-interactive
            disabled={isAiThinking || inputText.trim() === ''}
          >
            <Send className="h-5 w-5" />
          </Button>
          <Button
            onClick={toggleVoiceMode}
            className={cn(
              "rounded-full h-12 w-12 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-400 shadow-md hover:shadow-blue-400/50 hover:shadow-lg transition-all duration-300",
              voiceMode && "ring-2 ring-purple-300"
            )}
            data-interactive
            aria-label="Toggle Voice Mode"
            disabled={isAiThinking}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Right panel for Idea Refinement Canvas */}
      <div className="w-[35%] h-full p-4 bg-black/20 backdrop-blur-lg border-l border-white/10">
        <Card className="h-full rounded-2xl overflow-hidden border-white/20 bg-white/5 backdrop-blur-lg shadow-xl" data-glass>
          <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white/90">Idea Refinement Canvas</h2>
                <div className="flex items-center space-x-2">
                  {canvasContent && !canvasContent.startsWith('⚠️ Error') && (
                    <Button
                      onClick={handleDownloadCanvas}
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-blue-400 to-purple-400 text-white border-blue-400/50 hover:border-blue-400/70 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 shadow-md hover:shadow-blue-400/50 hover:shadow-lg active:scale-95 rounded-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            
            {/* Content area for the canvas response */}
            <div className="flex-grow overflow-y-auto p-1 rounded-xl bg-black/20 border border-white/10 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent backdrop-blur-sm">
              {isAiThinking && !canvasContent && (
                <div className="flex items-center justify-center h-full">
                  <Loader className="h-8 w-8 animate-spin text-vibe-purple" />
                  <p className="ml-3 text-white/70">Generating canvas...</p>
                </div>
              )}
              {canvasContent ? (
                <div className="prose prose-sm prose-invert max-w-none p-3 text-white/90">
                  <ReactMarkdown 
                    components={{
                      p: ({node, ...props}) => <p className="mb-2" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 text-vibe-blue" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-semibold mb-2 text-vibe-purple" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-md font-medium mb-1" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 pl-4" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 pl-4" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      code: ({node, inline, className, children, ...props}) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <pre className="bg-black/40 p-2 rounded-md my-2 overflow-x-auto text-sm"><code>{String(children).replace(/\n$/, '')}</code></pre>
                        ) : (
                          <code className="bg-black/40 px-1 py-0.5 rounded-sm text-vibe-pink text-xs" {...props}>
                            {children}
                          </code>
                        );
                      },
                      a: ({node, ...props}) => <a className="text-vibe-green hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                    }}
                  >
                    {canvasContent}
                  </ReactMarkdown>
                </div>
              ) : (
                !isAiThinking && <p className="text-center text-white/50 p-4">Click "Generate Canvas" to see the AI-refined breakdown of your idea here.</p>
              )}
            </div>

          
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
            
            {/* Generate Canvas Button - positioned at the bottom */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <Button 
                className="w-full py-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white font-medium shadow-md hover:shadow-blue-400/50 hover:shadow-lg border border-white/10 backdrop-blur-sm transition-all duration-200 ease-in-out active:scale-95 flex items-center justify-center"
                data-interactive
                onClick={handleGenerateCanvas}
                disabled={isAiThinking}
              >
                {isAiThinking && !canvasContent ? (
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  // Optional: Add an icon like <Lightbulb className="mr-2 h-5 w-5" /> or similar
                  null
                )}
                Generate Canvas
              </Button>
            </div>
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
                className="rounded-full bg-white/10 hover:shadow-purple-500/40 hover:shadow-lg transition-all duration-300"
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
                <strong>Models:</strong> Currently supporting GPT-4.1 nano, with more models coming soon.
              </p>
              <p>
                The Ideation workspace helps you brainstorm and plan your project before moving to the coding stages.
              </p>
            </div>
            
            <Button 
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-full shadow-md hover:shadow-purple-500/50 hover:shadow-xl transition-all duration-300"
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
