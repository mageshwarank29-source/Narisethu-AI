/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  CheckCircle,
  BookOpen,
  Phone,
  Volume2,
  VolumeX,
  Type,
  ShieldCheck,
  HeartHandshake
} from 'lucide-react';
import { PhoneCallView } from './components/PhoneCallView';
import { EligibilityChecker } from './components/EligibilityChecker';
import { SchemesDirectory } from './components/SchemesDirectory';
import { HelplinesSection } from './components/HelplinesSection';
import { VERIFIED_SCHEMES, Scheme } from './data/schemes';
import { tamilSpeech } from './services/speech';

export default function App() {
  const [activeTab, setActiveTab] = useState<'call' | 'eligibility' | 'schemes' | 'helpline'>('call');
  const [largeFont, setLargeFont] = useState<boolean>(false);
  const [schemes, setSchemes] = useState<Scheme[]>(VERIFIED_SCHEMES);

  // Fetch schemes from API or use local database
  useEffect(() => {
    fetch('/api/schemes')
      .then(res => res.json())
      .then(data => {
        if (data.schemes && Array.isArray(data.schemes)) {
          setSchemes(data.schemes);
        }
      })
      .catch(() => {
        // Fallback to local verified schemes
        setSchemes(VERIFIED_SCHEMES);
      });
  }, []);

  const handleTestVoice = () => {
    tamilSpeech.speak(
      'வணக்கம் அம்மா! நாரிசேது அரசு நலத்திட்ட உதவியாளர் குரல் சரியாக கேட்கிறதா? உங்களுக்கு தேவையான அரசு திட்டங்களை பற்றி என்னிடம் கேட்கலாம்.'
    );
  };

  const handleSelectSchemeFromCall = (schemeId: string) => {
    setActiveTab('schemes');
  };

  const handleAskAboutSchemeFromDirectory = (schemeName: string) => {
    setActiveTab('call');
  };

  return (
    <div
      className={`min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans transition-all selection:bg-amber-500 selection:text-stone-950 ${
        largeFont ? 'text-lg' : 'text-base'
      }`}
    >
      {/* Top Accessibility & Brand Bar */}
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 font-black text-xl shadow-lg shadow-amber-900/30">
              ந
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-amber-200 tracking-tight">
                  நாரிசேது (NariSethu)
                </h1>
                <span className="hidden sm:inline-block text-[11px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800">
                  அரசு உதவி
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-stone-400">
                பெண்களுக்கான குரல் வழி அரசு நலத்திட்ட வழிகாட்டி
              </p>
            </div>
          </div>

          {/* Quick utility controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-medium border border-stone-700 transition-all active:scale-95"
              title="குரல் பரிசோதனை (Test Voice)"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden md:inline">குரல் பரிசோதனை</span>
            </button>

            <button
              onClick={() => setLargeFont(!largeFont)}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
                largeFont
                  ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
              }`}
              title="எழுத்து அளவு மாற்று"
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">{largeFont ? 'சாதாரண எழுத்து' : 'பெரிய எழுத்து'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-stone-900/60 border-b border-stone-800/80 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('call')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'call'
                ? 'bg-amber-600 text-stone-950 shadow-md font-bold'
                : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>தொலைபேசி அழைப்பு (Voice Call)</span>
          </button>

          <button
            onClick={() => setActiveTab('eligibility')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'eligibility'
                ? 'bg-amber-600 text-stone-950 shadow-md font-bold'
                : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>என் தகுதி சரிபார்க்க (Eligibility)</span>
          </button>

          <button
            onClick={() => setActiveTab('schemes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'schemes'
                ? 'bg-amber-600 text-stone-950 shadow-md font-bold'
                : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>திட்டங்கள் பட்டியல் (All Schemes)</span>
          </button>

          <button
            onClick={() => setActiveTab('helpline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'helpline'
                ? 'bg-amber-600 text-stone-950 shadow-md font-bold'
                : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>அரசு உதவி எண்கள் (Helplines)</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'call' && (
          <PhoneCallView
            onSwitchToEligibility={() => setActiveTab('eligibility')}
            onSelectScheme={handleSelectSchemeFromCall}
            verifiedSchemes={schemes}
          />
        )}

        {activeTab === 'eligibility' && (
          <EligibilityChecker onBackToCall={() => setActiveTab('call')} />
        )}

        {activeTab === 'schemes' && (
          <SchemesDirectory onAskAboutScheme={handleAskAboutSchemeFromDirectory} />
        )}

        {activeTab === 'helpline' && <HelplinesSection />}
      </main>

      {/* Trust & Safe Government Helpline Footer */}
      <footer className="mt-auto border-t border-stone-800 bg-stone-900/60 py-6 px-4 text-center text-xs text-stone-400">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-stone-300">
            <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0" />
            <span>நாரிசேது: பாமர பெண்களின் நல்வாழ்வுக்கான இலவச அரசு குரல் வழிகாட்டி</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span>🛡️ முற்றிலும் இலவச சேவை</span>
            <span>•</span>
            <span>ரேஷன் கார்டு & ஆதார் மட்டுமே போதும்</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
