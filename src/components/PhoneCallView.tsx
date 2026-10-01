import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneCall,
  PhoneOff,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Radio,
  Send,
  Grid3X3
} from 'lucide-react';
import { tamilSpeech, audioTone } from '../services/speech';
import { Scheme } from '../data/schemes';

interface Message {
  role: 'assistant' | 'user';
  text: string;
  time: string;
}

interface PhoneCallViewProps {
  onSwitchToEligibility: () => void;
  onSelectScheme: (schemeId: string) => void;
  verifiedSchemes: Scheme[];
}

export const PhoneCallView: React.FC<PhoneCallViewProps> = ({
  onSwitchToEligibility,
  onSelectScheme,
  verifiedSchemes
}) => {
  const [isCallActive, setIsCallActive] = useState<boolean>(true);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('நாரிசேது பேசுகிறார்...');
  const [slowPace, setSlowPace] = useState<boolean>(false);

  const initialGreeting =
    'வணக்கம்! நாரிசேதுவுக்கு வரவேற்கிறோம். அரசு திட்டங்களைப் பற்றி தமிழில் தெரிந்து கொள்ள நான் உதவுகிறேன். உங்களுக்கு என்ன தகவல் வேண்டும்?';

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: initialGreeting,
      time: 'இப்போது'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Call timer
  useEffect(() => {
    let timer: any = null;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  // Initial greeting speech
  useEffect(() => {
    if (isCallActive) {
      audioTone.playCallConnectedChime();
      const t = setTimeout(() => {
        speakText(initialGreeting);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isCallActive]);

  // Auto scroll to latest speech
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSpeaking, isListening]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const speakText = (text: string) => {
    setIsSpeaking(true);
    setStatusMessage('நாரிசேது குரல் வழிகாட்டுகிறார்...');

    tamilSpeech.speak(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        setStatusMessage('உங்களுக்கு என்ன தகவல் வேண்டும்? நீங்கள் பேசலாம்...');
      },
      onError: () => {
        setIsSpeaking(false);
        setStatusMessage('நீங்கள் பேசலாம்...');
      }
    });
  };

  const handleSendMessage = async (userText: string, keypadDigit?: number) => {
    if (!userText.trim()) return;

    tamilSpeech.stopSpeaking();
    setIsSpeaking(false);

    const newMessages: Message[] = [
      ...messages,
      {
        role: 'user',
        text: userText,
        time: formatTime(callDuration)
      }
    ];
    setMessages(newMessages);
    setTextInput('');
    setStatusMessage('நாரிசேது திட்டங்களை சரிபார்க்கிறார்...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.text
          })),
          keypadOption: keypadDigit
        })
      });

      const data = await response.json();
      const reply = data.reply || 'மன்னிக்கவும் அம்மா, மீண்டும் ஒருமுறை சொல்ல முடியுமா?';

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          time: formatTime(callDuration)
        }
      ]);

      speakText(reply);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackReply =
        'அம்மா, இணைப்பு சரிவர கிடைக்கவில்லை. உங்கள் பகுதியில் உள்ள இ-சேவை மையத்திற்கு ரேஷன் கார்டு மற்றும் ஆதாரோடு சென்றால் அரசு திட்டங்களுக்கு விண்ணப்பிக்கலாம்.';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: fallbackReply,
          time: formatTime(callDuration)
        }
      ]);
      speakText(fallbackReply);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      tamilSpeech.stopListening();
      setIsListening(false);
      setStatusMessage('பேச்சு பதிவு முடிந்தது.');
      return;
    }

    tamilSpeech.stopSpeaking();
    setIsSpeaking(false);
    setIsListening(true);
    setStatusMessage('உங்கள் குரலை கவனிக்கிறேன்... தமிழில் பேசுங்கள்');

    tamilSpeech.startListening(
      (transcript: string) => {
        setIsListening(false);
        if (transcript.trim()) {
          handleSendMessage(transcript);
        } else {
          setStatusMessage('குரல் கேட்கவில்லை, மீண்டும் மைக்கை அழுத்தி பேசுங்கள்');
        }
      },
      (error: any) => {
        setIsListening(false);
        console.warn('Speech rec error:', error);
        setStatusMessage('குரலை கேட்க முடியவில்லை. கீழே உள்ள கேள்விகளை அழுத்தலாம்.');
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleKeypadPress = (digit: string, label: string) => {
    audioTone.playKeypadDigit(digit);
    const num = parseInt(digit, 10);

    if (num === 1) {
      handleSendMessage('திட்டங்கள் பற்றி தெரிந்து கொள்ள வேண்டும்', 1);
    } else if (num === 2) {
      onSwitchToEligibility();
      handleSendMessage('எனக்கு என்ன திட்டம் கிடைக்கும்? தகுதி சரிபார்க்க வேண்டும்', 2);
    } else if (num === 3) {
      handleSendMessage('அரசு திட்டங்களுக்கு என்ன ஆவணங்கள் தேவை?', 3);
    } else if (num === 4) {
      // Repeat last assistant message
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMsg) {
        speakText(lastAssistantMsg.text);
      }
    } else if (num === 5) {
      handleSendMessage('இதை இன்னும் எளிய தமிழில் சொல்ல முடியுமா?', 5);
    } else if (num === 0) {
      handleSendMessage('அரசு உதவி எண்களை சொல்லுங்கள்', 0);
    } else {
      handleSendMessage(`${digit} எண் தேர்வு: ${label}`);
    }
  };

  const handleRepeatLast = () => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg) {
      speakText(lastAssistantMsg.text);
    } else {
      speakText(initialGreeting);
    }
  };

  const handleSimplerExplanation = () => {
    handleSendMessage('எனக்கு புரியவில்லை அம்மா, இன்னும் சுலபமாக எளிய தமிழில் சொல்லுங்கள்');
  };

  const handleEndCall = () => {
    tamilSpeech.stopSpeaking();
    tamilSpeech.stopListening();
    audioTone.playCallEndBeep();
    setIsCallActive(false);
    setIsSpeaking(false);
    setIsListening(false);
  };

  const handleRestartCall = () => {
    audioTone.playCallConnectedChime();
    setIsCallActive(true);
    setCallDuration(0);
    setMessages([
      {
        role: 'assistant',
        text: initialGreeting,
        time: '00:00'
      }
    ]);
    setTimeout(() => {
      speakText(initialGreeting);
    }, 400);
  };

  const quickQuestions = [
    { text: 'எனக்கு மகளிர் உரிமைத் தொகை ₹1000 கிடைக்குமா?', icon: '💰' },
    { text: 'கர்ப்பிணி பெண்களுக்கு என்ன மருத்துவ உதவி கிடைக்கும்?', icon: '🤰' },
    { text: 'என் மகளுக்கு கல்லூரி புதுமைப் பெண் உதவித்தொகை கிடைக்குமா?', icon: '🎓' },
    { text: 'விதவை பெண்கள் ஓய்வூதியம் வாங்க என்ன செய்ய வேண்டும்?', icon: '👵' },
    { text: 'பெண்கள் சொந்த தொழில் செய்ய கடன் உதவி உள்ளதா?', icon: '💼' },
    { text: 'இலவச கேஸ் அடுப்பு மற்றும் சிலிண்டர் பெற என்ன வழி?', icon: '🔥' }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto w-full">
      {/* Mobile Phone / Helpline Call Canvas */}
      <div className="flex-1 bg-stone-900 text-stone-100 rounded-3xl p-5 md:p-8 shadow-2xl border-4 border-amber-800/40 relative overflow-hidden flex flex-col justify-between min-h-[640px]">
        {/* Subtle decorative background pattern */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Call Header */}
        <div className="relative z-10 border-b border-stone-800 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-300 font-bold text-xl shadow-inner">
                ந
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-amber-200 tracking-wide">நாரிசேது உதவி மையம்</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-medium">
                    அரசு நலத்திட்டம்
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">இலவச தொலைபேசி குரல் சேவை (1800-நாரிசேது)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCallActive ? (
                <div className="flex items-center gap-2 bg-stone-800/90 px-3 py-1.5 rounded-full border border-stone-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono text-emerald-300 font-semibold">{formatTime(callDuration)}</span>
                </div>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-800">
                  அழைப்பு முடிந்தது
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Call Animated Centerpiece */}
        {isCallActive ? (
          <div className="flex-1 flex flex-col justify-between relative z-10 py-2">
            {/* Status Bar */}
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 bg-stone-800/80 px-4 py-1.5 rounded-full text-xs md:text-sm text-stone-200 border border-stone-700 shadow-sm">
                {isSpeaking ? (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-amber-300 font-medium">நாரிசேது பேசுகிறார் (Listen)</span>
                  </>
                ) : isListening ? (
                  <>
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 font-medium">நீங்கள் பேசுங்கள், கேட்கிறேன்...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4 text-sky-400" />
                    <span>{statusMessage}</span>
                  </>
                )}
              </div>
            </div>

            {/* Conversation Voice Log (Spoken Transcript & Captions) */}
            <div className="my-auto max-h-72 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-stone-700">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.role === 'assistant' ? 'items-start' : 'items-end'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-stone-400">
                      {m.role === 'assistant' ? '👩‍💼 நாரிசேது உதவியாளர்' : '👤 நீங்கள்'}
                    </span>
                    <span className="text-[10px] text-stone-500">• {m.time}</span>
                  </div>

                  <div
                    className={`max-w-[92%] md:max-w-[85%] rounded-2xl p-4 text-base md:text-lg leading-relaxed shadow-md ${
                      m.role === 'assistant'
                        ? 'bg-amber-950/70 border border-amber-600/50 text-amber-50 font-normal'
                        : 'bg-emerald-900/60 border border-emerald-500/40 text-emerald-50'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {m.role === 'assistant' && (
                      <div className="mt-3 pt-2 border-t border-amber-800/40 flex items-center justify-between gap-2">
                        <button
                          onClick={() => speakText(m.text)}
                          className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-100 transition-colors bg-amber-900/50 hover:bg-amber-800/70 px-2.5 py-1 rounded-lg"
                          title="மீண்டும் கேட்க"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>மீண்டும் கேள்</span>
                        </button>

                        <button
                          onClick={handleSimplerExplanation}
                          className="inline-flex items-center gap-1 text-xs text-amber-300/80 hover:text-amber-200 transition-colors hover:underline"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>புரியவில்லை (எளிய விளக்கம்)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Voice Soundwave indicator */}
            <div className="flex items-center justify-center gap-1.5 py-3">
              {[4, 8, 14, 24, 18, 10, 16, 22, 12, 6].map((height, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-300 ${
                    isSpeaking
                      ? 'bg-amber-400 animate-pulse'
                      : isListening
                      ? 'bg-emerald-400 animate-bounce'
                      : 'bg-stone-700'
                  }`}
                  style={{
                    height: isSpeaking ? `${height + 4}px` : isListening ? `${height}px` : '6px',
                    animationDelay: `${i * 80}ms`
                  }}
                />
              ))}
            </div>

            {/* In-Call Quick Controls */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800/80">
              <button
                onClick={handleRepeatLast}
                disabled={isSpeaking}
                className="flex items-center justify-center gap-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 p-2.5 rounded-xl text-xs md:text-sm transition-all border border-stone-700"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>மறுபடி சொல்</span>
              </button>

              <button
                onClick={handleSimplerExplanation}
                disabled={isSpeaking}
                className="flex items-center justify-center gap-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 p-2.5 rounded-xl text-xs md:text-sm transition-all border border-stone-700"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>எளிய தமிழ்</span>
              </button>

              <button
                onClick={() => setShowKeypad(!showKeypad)}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs md:text-sm transition-all border active:scale-95 ${
                  showKeypad
                    ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>கீபேட் (Keypad)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Call Ended Screen */
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-red-950/60 border-2 border-red-700 flex items-center justify-center text-red-400 mb-4">
              <PhoneOff className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-stone-100 mb-2">அழைப்பு நிறைவடைந்தது</h3>
            <p className="text-sm text-stone-400 max-w-sm mb-6">
              அரசு திட்டங்கள் குறித்த கூடுதல் உதவி தேவைப்பட்டால் எந்த நேரத்திலும் மீண்டும் அழைக்கலாம்.
            </p>
            <button
              onClick={handleRestartCall}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-transform active:scale-95"
            >
              <PhoneCall className="w-5 h-5" />
              <span>மீண்டும் அழைக்கவும் (Call Again)</span>
            </button>
          </div>
        )}

        {/* Primary Call Controls (Green Call / Red End / Big Mic) */}
        {isCallActive && (
          <div className="relative z-10 pt-4 border-t border-stone-800">
            <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
              {/* Stop Speaking / Mute */}
              <button
                onClick={() => {
                  tamilSpeech.stopSpeaking();
                  setIsSpeaking(false);
                }}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isSpeaking
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200 hover:bg-amber-600/50'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
                title="பேச்சை நிறுத்து"
              >
                <VolumeX className="w-6 h-6" />
              </button>

              {/* Central Big Microphone Button */}
              <button
                onClick={handleMicToggle}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-400/40'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-6 h-6" />
                    <span className="text-base md:text-lg">பேசுங்கள்... (கேட்கிறது)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    <span className="text-base md:text-lg">குரல் மூலம் பேச (Mic)</span>
                  </>
                )}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="p-3.5 rounded-2xl bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-200 hover:text-white transition-all active:scale-95"
                title="அழைப்பை துண்டி"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>

            {/* Quick text input fallback */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendMessage(textInput);
                }}
                placeholder="தமிழில் தட்டச்சு செய்து கேட்கலாம்..."
                className="flex-1 bg-stone-800/80 border border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleSendMessage(textInput)}
                disabled={!textInput.trim()}
                className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-bold transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel: Feature Phone Keypad & Quick Voice Prompts */}
      <div className="w-full lg:w-96 flex flex-col gap-5">
        {/* Basic Keypad Phone Simulator Panel */}
        <div className="bg-stone-900 text-stone-100 rounded-3xl p-5 border-2 border-stone-800 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-amber-100 text-sm">தொலைபேசி எண்கள் (Keypad)</h3>
            </div>
            <span className="text-[11px] text-stone-400">பொத்தானை அழுத்தவும்</span>
          </div>

          <p className="text-xs text-stone-400 mb-3">
            எழுத்து படிக்க தெரியாத தாய்மார்கள் இந்த எண்களை அழுத்தி தகவல்களை கேட்கலாம்:
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { num: '1', ta: 'திட்டங்கள்', desc: 'அனைத்து திட்டங்கள்' },
              { num: '2', ta: 'என் தகுதி', desc: 'தகுதி சரிபார்க்க' },
              { num: '3', ta: 'ஆவணங்கள்', desc: 'தேவையான சான்றுகள்' },
              { num: '4', ta: 'மீண்டும்', desc: 'கடைசி செய்தி கேட்க' },
              { num: '5', ta: 'எளிய தமிழ்', desc: 'மிக எளிய விளக்கம்' },
              { num: '6', ta: 'மகளிர் உதவி', desc: '1000 ரூபாய் திட்டம்' },
              { num: '7', ta: 'கர்ப்பிணி', desc: 'மகப்பேறு நிதி' },
              { num: '8', ta: 'புதுமைப்பெண்', desc: 'கல்லூரி உதவி' },
              { num: '9', ta: 'ஓய்வூதியம்', desc: 'விதவை பென்ஷன்' },
              { num: '*', ta: 'இ-சேவை', desc: 'விண்ணப்பிக்கும் இடம்' },
              { num: '0', ta: 'உதவி எண்', desc: 'அரசு தொலைபேசி' },
              { num: '#', ta: 'அமைதி', desc: 'பேச்சை நிறுத்த' }
            ].map(key => (
              <button
                key={key.num}
                onClick={() => {
                  if (key.num === '#') {
                    tamilSpeech.stopSpeaking();
                    setIsSpeaking(false);
                    return;
                  }
                  handleKeypadPress(key.num, key.ta);
                }}
                className="bg-stone-800/90 hover:bg-amber-600 hover:text-stone-950 active:bg-amber-500 rounded-xl p-2.5 flex flex-col items-center justify-center border border-stone-700 text-stone-100 transition-all active:scale-95 group shadow-sm"
              >
                <span className="text-lg font-bold font-mono group-hover:text-stone-950 text-amber-300">
                  {key.num}
                </span>
                <span className="text-[11px] font-medium leading-tight group-hover:text-stone-950">
                  {key.ta}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-stone-800/80 flex items-center gap-2 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>நாரிசேது ஒருபோதும் பாஸ்வர்டு, வங்கி பின் (PIN) அல்லது OTP கேட்காது.</span>
          </div>
        </div>

        {/* Quick Voice Ask Prompt Chips */}
        <div className="bg-stone-900 text-stone-100 rounded-3xl p-5 border-2 border-stone-800 shadow-xl">
          <div className="flex items-center gap-2 mb-3 border-b border-stone-800 pb-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-amber-100 text-sm">விரைவு குரல் கேள்விகள்</h3>
          </div>

          <div className="flex flex-col gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.text)}
                className="text-left bg-stone-800/80 hover:bg-stone-700/90 p-2.5 rounded-xl border border-stone-700/80 text-xs md:text-sm text-stone-200 hover:text-amber-200 transition-all flex items-start gap-2.5 active:scale-98"
              >
                <span className="text-base shrink-0">{q.icon}</span>
                <span className="leading-snug">{q.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
