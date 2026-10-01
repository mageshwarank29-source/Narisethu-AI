import React from 'react';
import { Phone, ShieldAlert, Volume2, Building, CheckCircle2, AlertTriangle } from 'lucide-react';
import { OFFICIAL_HELPLINES } from '../data/schemes';
import { tamilSpeech } from '../services/speech';

export const HelplinesSection: React.FC = () => {
  const speakHelpline = (name: string, number: string, desc: string) => {
    const text = `${name}. இதன் இலவச அழைப்பு எண் ${number.split('').join(' ')}. ${desc}`;
    tamilSpeech.speak(text);
  };

  const speakSafetyNotice = () => {
    const text =
      'முக்கிய பாதுகாப்பு எச்சரிக்கை: அரசு அதிகாரிகள் ஒருபோதும் உங்கள் வங்கி ரகசிய குறியீட்டு எண் (PIN), ஏடிஎம் பாஸ்வேர்டு, அல்லது உங்கள் மொபைலுக்கு வரும் ஓடிபி (OTP) எண்ணை கேட்க மாட்டார்கள். யாரிடமும் இதை பகிர வேண்டாம்.';
    tamilSpeech.speak(text);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 md:p-8 border-2 border-stone-800 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-amber-100">
              அரசு அவசர மற்றும் உதவி தொலைபேசி எண்கள்
            </h2>
            <p className="text-xs md:text-sm text-stone-400">
              கட்டணமில்லா இலவச தொலைபேசி எண்கள் (Toll-Free Helplines)
            </p>
          </div>
        </div>
      </div>

      {/* Helplines List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OFFICIAL_HELPLINES.map((hl, idx) => (
          <div
            key={idx}
            className="bg-stone-900 border-2 border-stone-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl md:text-2xl font-mono font-bold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-700/60">
                  📞 {hl.number}
                </span>
                <button
                  onClick={() => speakHelpline(hl.nameTa, hl.number, hl.descTa)}
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 transition-colors"
                  title="குரலில் கேள்"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-base text-stone-100 mb-1">{hl.nameTa}</h3>
              <p className="text-xs text-stone-400 leading-relaxed">{hl.descTa}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-medium">✓ 24 மணி நேரமும் செயல்படும்</span>
              <button
                onClick={() => speakHelpline(hl.nameTa, hl.number, hl.descTa)}
                className="text-xs text-amber-300 hover:text-amber-200 font-semibold"
              >
                விளக்கம் கேள்
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Strict Anti-Fraud Security Notice */}
      <div className="bg-red-950/30 border-2 border-red-700/60 rounded-3xl p-6 text-stone-200 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-900/50 border border-red-600 flex items-center justify-center text-red-300 shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-200">
                பாதுகாப்பு எச்சரிக்கை: வங்கி PIN மற்றும் OTP தரக்கூடாது
              </h3>
              <button
                onClick={speakSafetyNotice}
                className="p-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-xl transition-all"
                title="எச்சரிக்கையை குரலில் கேள்"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs md:text-sm text-stone-300 mt-2 leading-relaxed">
              அரசு அதிகாரிகள், வங்கி மேலாளர்கள் அல்லது உதவி மையத்தினர் ஒருபோதும் உங்கள் வங்கி கணக்கின்
              ரகசிய குறியீட்டு எண் (ATM PIN), கடவுச்சொல் (Password), அல்லது உங்கள் போனுக்கு வரும் ஒருமுறை
              கடவுச்சொல் (OTP) கேட்க மாட்டார்கள். யாரிடமும் இதை தொலைபேசியிலோ நேரிலோ தெரிவிக்காதீர்கள்!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
