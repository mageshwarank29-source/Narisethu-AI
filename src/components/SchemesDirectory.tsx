import React, { useState } from 'react';
import {
  Search,
  Volume2,
  VolumeX,
  FileText,
  Building2,
  Phone,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { VERIFIED_SCHEMES, SCHEME_CATEGORIES, Scheme } from '../data/schemes';
import { tamilSpeech } from '../services/speech';

export const SchemesDirectory: React.FC<{ onAskAboutScheme: (schemeName: string) => void }> = ({
  onAskAboutScheme
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  const filteredSchemes = VERIFIED_SCHEMES.filter(scheme => {
    const matchesCategory =
      selectedCategory === 'all' || scheme.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      scheme.nameTa.toLowerCase().includes(q) ||
      scheme.nameEn.toLowerCase().includes(q) ||
      scheme.summaryTa.toLowerCase().includes(q) ||
      scheme.whoIsEligibleTa.toLowerCase().includes(q) ||
      scheme.benefitsTa.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const handleSpeakScheme = (scheme: Scheme, simpler = false) => {
    if (currentlySpeakingId === scheme.id) {
      tamilSpeech.stopSpeaking();
      setCurrentlySpeakingId(null);
      return;
    }

    setCurrentlySpeakingId(scheme.id);
    const textToSpeak = simpler ? scheme.simplerExplanationTa : scheme.audioScriptTa;

    tamilSpeech.speak(textToSpeak, {
      onEnd: () => setCurrentlySpeakingId(null),
      onError: () => setCurrentlySpeakingId(null)
    });
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Title & Search bar */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-5 md:p-8 border-2 border-stone-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
              அரசு அதிகாரப்பூர்வ திட்டங்கள்
            </span>
            <h2 className="text-xl md:text-3xl font-bold text-amber-100 mt-1">
              பெண்களுக்கான அரசு நலத்திட்டங்கள் வழிகாட்டி
            </h2>
            <p className="text-xs md:text-sm text-stone-400 mt-1">
              எளிய தமிழில் தகுதிகள், நன்மைகள் மற்றும் விண்ணப்பிக்கும் முறைகள்
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="திட்டத்தின் பெயர் அல்லது தேடல்..."
              className="w-full bg-stone-800/90 border border-stone-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SCHEME_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
              }`}
            >
              {cat.nameTa}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSchemes.map(scheme => {
          const isSpeakingThis = currentlySpeakingId === scheme.id;
          const isExpanded = expandedSchemeId === scheme.id;

          return (
            <div
              key={scheme.id}
              className="bg-stone-900 border-2 border-stone-800 hover:border-amber-700/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                    {scheme.categoryTa}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSpeakScheme(scheme, false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isSpeakingThis
                          ? 'bg-amber-500 text-stone-950 animate-pulse'
                          : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700'
                      }`}
                      title="குரல் வழியில் கேட்க"
                    >
                      {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeakingThis ? 'நிறுத்து' : 'குரலில் கேள்'}</span>
                    </button>
                  </div>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-amber-100 mb-2 leading-tight">
                  {scheme.nameTa}
                </h3>
                <p className="text-xs text-stone-400 mb-4 leading-relaxed">{scheme.summaryTa}</p>

                {/* 5 Clear Pillars of Government Schemes */}
                <div className="space-y-3 text-xs md:text-sm">
                  {/* 1. Who is eligible */}
                  <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/70">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>1. யாருக்கு கிடைக்கும்? (தகுதிகள்)</span>
                    </div>
                    <p className="text-stone-300 leading-relaxed pl-5">{scheme.whoIsEligibleTa}</p>
                  </div>

                  {/* 2. Benefits */}
                  <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/70">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>2. என்ன உதவி கிடைக்கும்?</span>
                    </div>
                    <p className="text-stone-300 leading-relaxed pl-5">{scheme.benefitsTa}</p>
                  </div>

                  {/* 3. Documents */}
                  <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/70">
                    <div className="flex items-center gap-1.5 font-bold text-sky-300 mb-1">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>3. தேவையான ஆவணங்கள்:</span>
                    </div>
                    <ul className="list-disc list-inside text-stone-300 space-y-1 pl-5 text-xs">
                      {scheme.documentsTa.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 4. How to Apply */}
                  <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/70">
                    <div className="flex items-center gap-1.5 font-bold text-amber-200 mb-1">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span>4. எப்படி விண்ணப்பிப்பது?</span>
                    </div>
                    <p className="text-stone-300 leading-relaxed pl-5">{scheme.howToApplyTa}</p>
                    <div className="mt-2 pl-5 flex flex-wrap items-center gap-3 text-xs text-stone-400">
                      <span>🏢 அலுவலகம்: {scheme.officeTa}</span>
                      <span>📞 உதவி எண்: {scheme.helpline}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-stone-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleSpeakScheme(scheme, true)}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-300/90 hover:text-amber-200 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>மிக எளிய தமிழ் விளக்கம் கேட்க</span>
                </button>

                <button
                  onClick={() => onAskAboutScheme(scheme.nameTa)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-stone-700 transition-all"
                >
                  அழைப்பில் கேட்க
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
