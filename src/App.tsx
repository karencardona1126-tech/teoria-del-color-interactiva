/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Info, 
  RefreshCw, 
  Copy, 
  Check,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Send,
  X,
  Loader2,
  Bot,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Types ---

type HarmonyMode = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic' | 'square' | 'monochromatic';

interface ColorResult {
  h: number;
  s: number;
  l: number;
  hex: string;
  label: string;
}

// --- Utils ---

const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const getHarmonyOffsets = (mode: HarmonyMode): number[] => {
  switch (mode) {
    case 'complementary': return [0, 180];
    case 'analogous': return [0, 30, -30];
    case 'triadic': return [0, 120, 240];
    case 'split-complementary': return [0, 150, 210];
    case 'tetradic': return [0, 60, 180, 240];
    case 'square': return [0, 90, 180, 270];
    case 'monochromatic': return [0]; // Handled differently with lightness
    default: return [0];
  }
};

const HARMONY_INFO: Record<HarmonyMode, { title: string; description: string }> = {
  complementary: {
    title: 'Complementaria',
    description: 'Colores opuestos en el círculo. Crean el máximo contraste y vibración visual.'
  },
  analogous: {
    title: 'Análoga',
    description: 'Colores situados uno al lado del otro. Son armoniosos y agradables a la vista, comunes en la naturaleza.'
  },
  triadic: {
    title: 'Triádica',
    description: 'Tres colores equidistantes. Ofrece un alto contraste pero manteniendo el equilibrio.'
  },
  'split-complementary': {
    title: 'Complementaria Dividida',
    description: 'Un color base y los dos colores adyacentes a su complementario. Menos agresivo que la complementaria pura.'
  },
  tetradic: {
    title: 'Tetrádica (Rectangular)',
    description: 'Dos pares de colores complementarios. Ofrece mucha variedad pero requiere cuidado para equilibrar.'
  },
  square: {
    title: 'Cuadrada',
    description: 'Cuatro colores equidistantes en el círculo. Similar a la tetrádica pero con espaciado uniforme.'
  },
  monochromatic: {
    title: 'Monocromática',
    description: 'Variaciones de luminosidad y saturación de un mismo tono. Muy elegante y fácil de combinar.'
  }
};

// --- Components ---

interface Message {
  role: 'user' | 'model';
  text: string;
}

function ChatAssistant({ currentHue, currentMode, currentColors }: { currentHue: number, currentMode: string, currentColors: ColorResult[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy ColorBot, tu experto en teoría del color. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const context = `
        Contexto actual del usuario:
        - Tono seleccionado: ${currentHue}°
        - Modo de armonía: ${currentMode}
        - Colores generados: ${currentColors.map(c => `${c.label}: ${c.hex}`).join(', ')}
      `;

      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: `Eres "ColorBot", un asistente experto en teoría del color y diseño visual. 
          Tu objetivo es ayudar al usuario a entender cómo combinar colores, explicar conceptos de diseño y dar sugerencias basadas en su selección actual.
          Habla siempre en español. Sé amable, creativo y profesional.
          Usa el contexto proporcionado sobre la selección actual del usuario para dar respuestas personalizadas.
          Si el usuario pregunta algo no relacionado con el color o el diseño, redirígelo amablemente al tema.`,
        },
      });

      const response = await chat.sendMessage({ message: `${context}\n\nUsuario: ${userMessage}` });
      const text = response.text;

      setMessages(prev => [...prev, { role: 'model', text: text || 'Lo siento, no pude procesar tu solicitud.' }]);
    } catch (error) {
      console.error("Error with ColorBot:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Hubo un error al conectar con mi cerebro artificial. Por favor, inténtalo de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">ColorBot</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">En línea</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-stone-900 text-white rounded-tr-none' 
                        : 'bg-white text-stone-800 border border-stone-100 shadow-sm rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                    <span className="text-xs text-stone-400 font-medium">ColorBot está pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-stone-100 bg-white">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Pregunta sobre color..."
                  className="w-full pl-4 pr-12 py-3 bg-stone-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-stone-900 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: '#f59eeb' }}
        className="w-14 h-14 text-white rounded-full shadow-2xl flex items-center justify-center group relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notification Badge */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-bounce" />
        )}
      </motion.button>
    </div>
  );
}

function VoiceAssistant({ currentHue, currentMode, currentColors }: { currentHue: number, currentMode: string, currentColors: ColorResult[] }) {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const stopCall = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  const playNextChunk = useCallback(() => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0 || isPlayingRef.current) return;

    isPlayingRef.current = true;
    const pcmData = audioQueueRef.current.shift()!;
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768.0;
    }

    const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      playNextChunk();
    };
    source.start();
  }, []);

  const startCall = async () => {
    if (isActive || isConnecting) return;
    setIsConnecting(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: `Eres Rainbow, una asistente profesional y experta en diseño con un acento colombiano/paisa de Medellín elegante y formal, sin exagerarlo. 
          Tu tono es educado, respetuoso y utilizas el "usted" de manera natural, como es común en la cultura paisa formal.
          Evita el uso de jergas informales como "parce", "mijo" o expresiones excesivamente coloquiales. 
          En su lugar, utiliza un lenguaje refinado pero cálido, saludando con cortesía (ej. "Es un gusto saludarle", "¿En qué puedo asistirle hoy?").
          Tu objetivo es asesorar al usuario sobre el círculo cromático y teoría del color con precisión técnica y amabilidad.
          Contexto actual: Tono ${currentHue}°, Modo ${currentMode}. Colores: ${currentColors.map(c => c.hex).join(', ')}.`,
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            processorRef.current?.connect(audioContextRef.current!.destination);
            source.connect(processorRef.current!);
          },
          onmessage: (message) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Data = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binaryString = window.atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcmData = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(pcmData);
              playNextChunk();
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => stopCall(),
          onerror: (err) => {
            console.error("Rainbow Error:", err);
            stopCall();
          }
        }
      });

      sessionRef.current = session;

      processorRef.current.onaudioprocess = (e) => {
        if (isMuted || !sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        session.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=24000' }
        });
      };

    } catch (error) {
      console.error("Failed to start Rainbow:", error);
      stopCall();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start gap-3">
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white px-6 py-3 rounded-3xl shadow-2xl border border-stone-200 flex items-center gap-4"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 shadow-inner">
                <img 
                  src="https://kjwdsxzbjypjcgseywpt.supabase.co/storage/v1/object/public/almacenamientos%20para%20paginas%20web/image/colors.png" 
                  alt="Luky Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/luky/100/100";
                  }}
                />
              </div>
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping absolute -bottom-1 -right-1" />
              <div className="w-4 h-4 bg-emerald-500 rounded-full absolute -bottom-1 -right-1 border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-stone-800 leading-tight">Llamada con Rainbow</span>
              <span className="text-xs text-emerald-600 font-medium">En línea</span>
            </div>
            <div className="h-8 w-px bg-stone-200 mx-1" />
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-2xl transition-all ${isMuted ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isActive ? stopCall : startCall}
        disabled={isConnecting}
        style={{ color: '#060326', backgroundColor: '#0b0329' }}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          isActive ? 'bg-red-500' : ''
        } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isConnecting ? (
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#eae9ef' }} />
        ) : isActive ? (
          <PhoneOff className="w-7 h-7" style={{ color: '#eae9ef' }} />
        ) : (
          <Phone className="w-7 h-7" style={{ color: '#eae9ef' }} />
        )}
        
        {!isActive && !isConnecting && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-stone-900 rounded-full border-2 border-white flex items-center justify-center">
            <Volume2 className="w-3 h-3 text-white" />
          </div>
        )}
      </motion.button>
    </div>
  );
}

export default function App() {
  const [hue, setHue] = useState(200);
  const [mode, setMode] = useState<HarmonyMode>('complementary');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const wheelRef = useRef<SVGSVGElement>(null);

  const colors = useMemo(() => {
    if (mode === 'monochromatic') {
      return [
        { h: hue, s: 80, l: 30, hex: hslToHex(hue, 80, 30), label: 'Sombra' },
        { h: hue, s: 90, l: 50, hex: hslToHex(hue, 90, 50), label: 'Base' },
        { h: hue, s: 70, l: 70, hex: hslToHex(hue, 70, 70), label: 'Luz' },
      ];
    }
    
    const offsets = getHarmonyOffsets(mode);
    return offsets.map((offset, i) => {
      const h = (hue + offset + 360) % 360;
      return {
        h,
        s: 85,
        l: 55,
        hex: hslToHex(h, 85, 55),
        label: i === 0 ? 'Principal' : `Armonía ${i}`
      };
    });
  }, [hue, mode]);

  const handleWheelInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360; // Offset to match top = 0deg
    setHue(Math.round(angle));
  }, []);

  const copyToClipboard = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans selection:bg-stone-200">
      {/* Header */}
      <header className="p-6 border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 animate-spin-slow" />
            <div>
              <h1 className="text-[27px] leading-[34px] font-bold tracking-tight font-cursive">Círculo Cromático</h1>
              <p className="text-[10px] text-stone-400 font-elegant font-light uppercase tracking-[0.25em]">Teoría del Color Interactiva</p>
            </div>
          </div>
          
          <nav className="flex gap-1 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {(Object.keys(HARMONY_INFO) as HarmonyMode[]).map((m, idx) => {
              const navColors = ['#c81eb7', '#6c0499', '#3333cc', '#d08617', '#13d6d6', '#32b124', '#cd0c0c'];
              const customColor = navColors[idx];
              
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={customColor ? { color: customColor } : {}}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    mode === m 
                      ? 'bg-stone-900 shadow-lg' 
                      : 'bg-stone-100 hover:bg-stone-200'
                  } ${!customColor ? (mode === m ? 'text-white' : 'text-stone-600') : ''}`}
                >
                  {HARMONY_INFO[m].title}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: The Wheel */}
        <div className="lg:col-span-7 flex flex-col items-center gap-8">
          <div className="relative w-full max-w-[500px] aspect-square group">
            {/* Background Glow */}
            <div 
              className="absolute inset-0 blur-[100px] opacity-20 transition-colors duration-500 rounded-full"
              style={{ backgroundColor: colors[0].hex }}
            />
            
            {/* The SVG Wheel */}
            <svg 
              ref={wheelRef}
              viewBox="0 0 100 100" 
              className="w-full h-full drop-shadow-2xl cursor-crosshair touch-none select-none"
              onMouseDown={(e) => {
                handleWheelInteraction(e);
                const move = (me: MouseEvent) => handleWheelInteraction(me as any);
                const up = () => {
                  window.removeEventListener('mousemove', move);
                  window.removeEventListener('mouseup', up);
                };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
              onTouchStart={(e) => {
                handleWheelInteraction(e);
                const move = (te: TouchEvent) => handleWheelInteraction(te as any);
                const end = () => {
                  window.removeEventListener('touchmove', move);
                  window.removeEventListener('touchend', end);
                };
                window.addEventListener('touchmove', move);
                window.addEventListener('touchend', end);
              }}
            >
              {/* Color Gradient Ring */}
              <defs>
                <conicGradient id="wheelGradient" cx="50" cy="50">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <stop 
                      key={i} 
                      offset={`${(i / 36) * 100}%`} 
                      stopColor={`hsl(${i * 10}, 85%, 55%)`} 
                    />
                  ))}
                </conicGradient>
              </defs>
              
              <circle cx="50" cy="50" r="45" fill="url(#wheelGradient)" />
              <circle cx="50" cy="50" r="30" fill="#fafaf9" />

              {/* Harmony Indicators */}
              <g className="pointer-events-none">
                {colors.map((c, i) => {
                  const angleRad = (c.h - 90) * (Math.PI / 180);
                  const x = 50 + 37.5 * Math.cos(angleRad);
                  const y = 50 + 37.5 * Math.sin(angleRad);
                  
                  return (
                    <motion.g 
                      key={i}
                      initial={false}
                      animate={{ x, y }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <circle 
                        r={i === 0 ? 5 : 4} 
                        fill={c.hex} 
                        stroke="white" 
                        strokeWidth="2"
                        className="shadow-lg"
                      />
                      {i === 0 && (
                        <circle 
                          r="7" 
                          fill="none" 
                          stroke={c.hex} 
                          strokeWidth="1" 
                          className="animate-ping opacity-50"
                        />
                      )}
                    </motion.g>
                  );
                })}
                
                {/* Connecting Lines */}
                {mode !== 'monochromatic' && colors.length > 1 && (
                  <path
                    d={`M ${colors.map(c => {
                      const angleRad = (c.h - 90) * (Math.PI / 180);
                      return `${50 + 37.5 * Math.cos(angleRad)},${50 + 37.5 * Math.sin(angleRad)}`;
                    }).join(' L ')} Z`}
                    fill="none"
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                )}
              </g>
            </svg>

            {/* Center Info */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-4xl font-black text-stone-900">{hue}°</span>
                <p className="text-[10px] uppercase tracking-tighter text-stone-400 font-bold">Tono Seleccionado</p>
              </div>
            </div>
          </div>

          {/* Harmony Explanation Card */}
          <motion.div 
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white p-8 rounded-3xl border border-stone-200 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-stone-100 rounded-2xl">
                <Info className="w-6 h-6 text-stone-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{HARMONY_INFO[mode].title}</h3>
                <p className="text-stone-500 leading-relaxed">
                  {HARMONY_INFO[mode].description}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Color Details */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">Paleta Generada</h2>
          
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {colors.map((color, i) => (
                <motion.div
                  key={`${mode}-${i}`}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-100 hover:border-stone-300 transition-all hover:shadow-md"
                >
                  <div 
                    className="w-16 h-16 rounded-xl shadow-inner transition-transform group-hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{color.label}</span>
                      <button 
                        onClick={() => copyToClipboard(color.hex, i)}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-400 hover:text-stone-900"
                      >
                        {copiedIndex === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-mono font-bold text-stone-800">{color.hex.toUpperCase()}</span>
                      <span className="text-[10px] font-mono text-stone-400">
                        HSL({Math.round(color.h)}°, {color.s}%, {color.l}%)
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Tips Section */}
          <div className="mt-12 p-6 bg-stone-900 rounded-3xl text-white overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-stone-400" />
                <h4 className="font-bold text-sm uppercase tracking-widest">Consejo de Diseño</h4>
              </div>
              <p className="text-stone-300 text-sm leading-relaxed italic">
                "Usa la regla 60-30-10: 60% de un color dominante, 30% de un color secundario y 10% de un color de acento para una composición equilibrada."
              </p>
            </div>
            {/* Decorative circles */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto p-12 border-t border-stone-200 mt-12 text-center">
        <p className="text-stone-400 text-sm">
          Explora, combina y crea. La teoría del color simplificada.
        </p>
      </footer>

      <ChatAssistant currentHue={hue} currentMode={mode} currentColors={colors} />
      <VoiceAssistant currentHue={hue} currentMode={mode} currentColors={colors} />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
