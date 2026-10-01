import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  Building,
  Check,
  Award
} from 'lucide-react';
import { VERIFIED_SCHEMES, Scheme } from '../data/schemes';
import { tamilSpeech } from '../services/speech';

interface UserAnswers {
  ageGroup?: 'under18' | '18_20' | '21_35' | '36_50' | 'above50';
  maritalStatus?: 'unmarried' | 'married' | 'widow' | 'deserted';
  familySituation?: 'pregnant' | 'has_girl_child' | 'college_girl' | 'none';
  incomeLevel?: 'low_72k' | 'mid_2_5l' | 'high_above_2_5l';
  occupation?: 'student' | 'homemaker' | 'self_employed_shg' | 'daily_wage';
}

export const EligibilityChecker: React.FC<{ onBackToCall: () => void }> = ({ onBackToCall }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [matchingSchemes, setMatchingSchemes] = useState<Scheme[]>([]);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [activeSchemeDetail, setActiveSchemeDetail] = useState<Scheme | null>(null);

  // Question prompts and spoken scripts
  const questions = [
    {
      step: 1,
      titleTa: '1. உங்கள் வயது என்னம்மா?',
      audioPromptTa: 'அம்மா, முதலில் உங்கள் வயதை தெரிந்து கொள்ளலாமா? கீழே உள்ள உங்கள் வயது வரம்பை தொடுங்கள்.',
      key: 'ageGroup' as const,
      options: [
        { id: 'under18', labelTa: '18 வயதுக்கு கீழ்', subTa: 'பள்ளி மாணவி அல்லது சிறுமி' },
        { id: '18_20', labelTa: '18 முதல் 20 வயது', subTa: 'கல்லூரி அல்லது இளம் பெண்' },
        { id: '21_35', labelTa: '21 முதல் 35 வயது', subTa: 'இளம் தாய் அல்லது குடும்பத் தலைவி' },
        { id: '36_50', labelTa: '36 முதல் 50 வயது', subTa: 'குடும்பத் தலைவி' },
        { id: 'above50', labelTa: '50 வயதுக்கு மேல்', subTa: 'மூத்த பெண்மணி' }
      ]
    },
    {
      step: 2,
      titleTa: '2. உங்கள் திருமண நிலை என்ன?',
      audioPromptTa: 'உங்கள் திருமண நிலையை சொல்ல முடியுமா அம்மா? திருமணமானவரா, விதவை தாயா, அல்லது திருமணமாகாதவரா?',
      key: 'maritalStatus' as const,
      options: [
        { id: 'married', labelTa: 'திருமணமானவர்', subTa: 'குடும்பத் தலைவி / கணவர் உள்ளவர்' },
        { id: 'unmarried', labelTa: 'திருமணமாகாதவர்', subTa: 'இளம் பெண் அல்லது மாணவி' },
        { id: 'widow', labelTa: 'கணவரை இழந்தவர் (விதவை)', subTa: 'ஆதரவற்ற தாய்' },
        { id: 'deserted', labelTa: 'கணவரால் கைவிடப்பட்டவர்', subTa: 'பிரிந்து வாழும் பெண்' }
      ]
    },
    {
      step: 3,
      titleTa: '3. உங்கள் குடும்பத்தில் உள்ள நிலை?',
      audioPromptTa: 'உங்களுக்கு குழந்தைகள் உள்ளனவா அம்மா? அல்லது தற்போது கர்ப்பமாக இருக்கிறீர்களா?',
      key: 'familySituation' as const,
      options: [
        { id: 'pregnant', labelTa: 'தற்போது கர்ப்பமாக உள்ளேன்', subTa: 'தாய்மை அடைந்துள்ள பெண்' },
        { id: 'has_girl_child', labelTa: '10 வயதுக்குள் பெண் குழந்தை உண்டு', subTa: 'சிறு பெண் குழந்தை உள்ள குடும்பம்' },
        { id: 'college_girl', labelTa: 'கல்லூரி படிக்கும் மகள் உண்டு / நானே மாணவி', subTa: 'உயர்கல்வி படிப்பு' },
        { id: 'none', labelTa: 'மேற்கண்டவை எதுவும் இல்லை', subTa: 'சாதாரண குடும்பம்' }
      ]
    },
    {
      step: 4,
      titleTa: '4. உங்கள் குடும்பத்தின் ஆண்டு வருமானம்?',
      audioPromptTa: 'உங்கள் குடும்பத்தில் ஒரு வருடத்திற்கு எவ்வளவு வருமானம் வரும் அம்மா?',
      key: 'incomeLevel' as const,
      options: [
        { id: 'low_72k', labelTa: 'வருடத்திற்கு ₹72,000-க்குள்', subTa: 'வறுமைக் கோட்டுக்கு கீழ் உள்ள மிக ஏழை' },
        { id: 'mid_2_5l', labelTa: 'வருடத்திற்கு ₹2.5 லட்சத்திற்குள்', subTa: 'சாமானிய ஏழை குடும்பம்' },
        { id: 'high_above_2_5l', labelTa: 'வருடத்திற்கு ₹2.5 லட்சத்திற்கு மேல்', subTa: 'நடுத்தர குடும்பம்' }
      ]
    },
    {
      step: 5,
      titleTa: '5. நீங்கள் செய்யும் வேலை அல்லது தொழில்?',
      audioPromptTa: 'கடைசி கேள்வி அம்மா, நீங்கள் வீட்டில் இருக்கிறீர்களா, மகளிர் குழுவிலா, அல்லது சுயதொழில் செய்கிறீர்களா?',
      key: 'occupation' as const,
      options: [
        { id: 'homemaker', labelTa: 'வீட்டுப் பணி (இல்லத்தரசி)', subTa: 'குடும்பத்தை கவனிப்பவர்' },
        { id: 'self_employed_shg', labelTa: 'சுயதொழில் / மகளிர் சுயஉதவிக் குழு', subTa: 'சிறு தொழில் செய்ய விரும்புபவர்' },
        { id: 'daily_wage', labelTa: 'விவசாயம் / தினசரி கூலி வேலை', subTa: 'தினக்கூலி பணியாளர்' },
        { id: 'student', labelTa: 'கல்லூரி / பள்ளி மாணவி', subTa: 'படிக்கும் பெண்' }
      ]
    }
  ];

  const currentQ = questions[currentStep - 1];

  // Speak question prompt whenever step changes
  useEffect(() => {
    if (!isCalculated && currentQ) {
      tamilSpeech.speak(currentQ.audioPromptTa);
    }
  }, [currentStep, isCalculated]);

  const handleSelectOption = (key: keyof UserAnswers, val: any) => {
    const updated = { ...answers, [key]: val };
    setAnswers(updated);

    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateEligibility(updated);
    }
  };

  const calculateEligibility = (userAns: UserAnswers) => {
    setIsCalculated(true);

    const matches = VERIFIED_SCHEMES.filter(scheme => {
      const cond = scheme.eligibilityConditions;

      // Pregnant check
      if (scheme.id === 'dr-muthulakshmi-maternity') {
        return userAns.familySituation === 'pregnant' || userAns.maritalStatus === 'married';
      }

      // Pudhumai Penn (student)
      if (scheme.id === 'pudhumai-penn-scheme') {
        return (
          userAns.occupation === 'student' ||
          userAns.familySituation === 'college_girl' ||
          userAns.ageGroup === '18_20'
        );
      }

      // Destitute widow pension
      if (scheme.id === 'destitute-widow-pension') {
        return userAns.maritalStatus === 'widow';
      }

      // Deserted women pension
      if (scheme.id === 'deserted-women-pension') {
        return userAns.maritalStatus === 'deserted';
      }

      // Kalaignar Magalir Urimai Thittam
      if (scheme.id === 'kalaignar-magalir-urimai') {
        const ageEligible = userAns.ageGroup !== 'under18' && userAns.ageGroup !== '18_20';
        const incomeEligible = userAns.incomeLevel !== 'high_above_2_5l';
        const isHead = userAns.maritalStatus !== 'unmarried';
        return ageEligible && incomeEligible && isHead;
      }

      // Girl child protection
      if (scheme.id === 'chief-minister-girl-child-protection') {
        return userAns.familySituation === 'has_girl_child' && userAns.incomeLevel === 'low_72k';
      }

      // Selva Magal Semippu
      if (scheme.id === 'selva-magal-semippu-thittam') {
        return userAns.familySituation === 'has_girl_child';
      }

      // EVR Maniammaiyar marriage assistance
      if (scheme.id === 'evr-maniammaiyar-widow-daughter-marriage') {
        return (
          userAns.maritalStatus === 'widow' ||
          (userAns.maritalStatus === 'unmarried' && userAns.incomeLevel === 'low_72k')
        );
      }

      // SHG loans
      if (scheme.id === 'shg-bank-linkage-loan') {
        return userAns.occupation === 'self_employed_shg' || userAns.occupation === 'homemaker';
      }

      // PM Ujjwala (Free gas)
      if (scheme.id === 'pm-ujjwala-yojana') {
        return userAns.incomeLevel !== 'high_above_2_5l';
      }

      return true;
    });

    setMatchingSchemes(matches);

    // Announce results via Tamil TTS
    const count = matches.length;
    const announceText = `அம்மா, நீங்கள் சொன்ன தகவல்களின்படி, உங்களுக்கு ${count} அரசு நலத்திட்டங்கள் கிடைக்க நல்ல வாய்ப்புள்ளது. கீழே அந்த திட்டங்களின் விவரங்கள் உள்ளன. நீங்கள் தெரிந்து கொள்ள விரும்பும் திட்டத்தை தொடலாம்.`;
    tamilSpeech.speak(announceText);
  };

  const handleReset = () => {
    tamilSpeech.stopSpeaking();
    setAnswers({});
    setCurrentStep(1);
    setIsCalculated(false);
    setActiveSchemeDetail(null);
  };

  const speakSchemeAudio = (scheme: Scheme) => {
    tamilSpeech.speak(scheme.audioScriptTa);
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-stone-900 text-stone-100 p-4 md:p-6 rounded-3xl border-2 border-stone-800 mb-6 shadow-xl">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
            குரல் வழி வழிகாட்டுதல்
          </span>
          <h2 className="text-lg md:text-2xl font-bold text-amber-100 mt-1">
            எளிய தகுதி சரிபார்ப்பு (Eligibility Checker)
          </h2>
          <p className="text-xs md:text-sm text-stone-400">
            5 எளிய கேள்விகள் மூலமாக நீங்கள் பயன்பெறக்கூடிய திட்டங்களை கண்டறியலாம்
          </p>
        </div>

        <button
          onClick={onBackToCall}
          className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2.5 rounded-xl text-xs md:text-sm font-medium border border-stone-700 transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>அழைப்புக்கு திரும்பு</span>
        </button>
      </div>

      {!isCalculated ? (
        /* Questionnaire Steps */
        <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 md:p-8 border-2 border-stone-800 shadow-2xl">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="font-semibold text-amber-300">படி {currentStep} / 5</span>
              <span>
                {currentStep === 1 && 'வயது விவரம்'}
                {currentStep === 2 && 'திருமண நிலை'}
                {currentStep === 3 && 'குடும்ப சூழல்'}
                {currentStep === 4 && 'வருமானம்'}
                {currentStep === 5 && 'தொழில் / படிப்பு'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Question Audio Bar */}
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-amber-200 mb-1">{currentQ.titleTa}</h3>
              <p className="text-xs md:text-sm text-amber-100/80">{currentQ.audioPromptTa}</p>
            </div>
            <button
              onClick={() => tamilSpeech.speak(currentQ.audioPromptTa)}
              className="p-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 font-bold text-xs md:text-sm"
              title="கேள்வியை மீண்டும் கேள்"
            >
              <Volume2 className="w-5 h-5" />
              <span className="hidden sm:inline">மீண்டும் கேள்</span>
            </button>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {currentQ.options.map(opt => {
              const isSelected = (answers as any)[currentQ.key] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQ.key, opt.id)}
                  className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between active:scale-98 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-lg'
                      : 'bg-stone-800/80 hover:bg-stone-800 border-stone-700 text-stone-100 hover:border-stone-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-base md:text-lg font-bold">{opt.labelTa}</span>
                    {isSelected && <Check className="w-5 h-5 text-amber-400 shrink-0" />}
                  </div>
                  <span className="text-xs text-stone-400">{opt.subTa}</span>
                </button>
              );
            })}
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-800">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>முந்தைய கேள்வி</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>மீண்டும் முதலிலிருந்து தொடங்கு</span>
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="bg-emerald-950/40 border-2 border-emerald-600/50 text-stone-100 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-500 flex items-center justify-center text-emerald-300">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-emerald-200">
                  உங்களுக்கு {matchingSchemes.length} திட்டங்கள் பரிந்துரைக்கப்படுகின்றன!
                </h3>
                <p className="text-xs md:text-sm text-stone-300 mt-1">
                  நீங்கள் அளித்த தகவல்களின் அடிப்படையில் இந்த திட்டங்களுக்கு விண்ணப்பிக்க தகுதி உள்ளது.
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold border border-stone-700 transition-all shrink-0 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>மறுபடியும் சோதிக்க</span>
            </button>
          </div>

          {/* Schemes list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchingSchemes.map(scheme => (
              <div
                key={scheme.id}
                className="bg-stone-900 border-2 border-stone-800 hover:border-amber-600/60 transition-all p-5 rounded-3xl flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                      {scheme.categoryTa}
                    </span>
                    <button
                      onClick={() => speakSchemeAudio(scheme)}
                      className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 transition-colors"
                      title="குரல் வடிவில் கேள்"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-lg font-bold text-stone-100 mb-2 leading-snug">{scheme.nameTa}</h4>
                  <p className="text-xs text-stone-300 mb-4 leading-relaxed">{scheme.summaryTa}</p>

                  <div className="bg-stone-800/80 rounded-2xl p-3 border border-stone-700/60 mb-3 space-y-1.5 text-xs text-stone-300">
                    <div>
                      <span className="font-semibold text-emerald-300">🎁 என்ன உதவி:</span> {scheme.benefitsTa}
                    </div>
                    <div>
                      <span className="font-semibold text-amber-300">🏛️ எங்கு செல்ல வேண்டும்:</span>{' '}
                      {scheme.officeTa}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                  <button
                    onClick={() => setActiveSchemeDetail(scheme)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
                  >
                    முழு விவரம் & ஆவணங்கள் பார்க்க
                  </button>

                  <button
                    onClick={() => speakSchemeAudio(scheme)}
                    className="text-xs bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>குரலில் கேள்</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal / Detail drawer for single scheme if selected */}
          {activeSchemeDetail && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-stone-900 border-2 border-stone-700 text-stone-100 max-w-2xl w-full rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-start justify-between gap-4 mb-4 border-b border-stone-800 pb-3">
                  <div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                      {activeSchemeDetail.categoryTa}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-amber-200 mt-2">
                      {activeSchemeDetail.nameTa}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveSchemeDetail(null)}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <div className="bg-amber-950/30 p-4 rounded-2xl border border-amber-800/40">
                    <h5 className="font-bold text-amber-300 mb-1">1. யாருக்கு கிடைக்கும்? (தகுதி)</h5>
                    <p className="text-stone-200">{activeSchemeDetail.whoIsEligibleTa}</p>
                  </div>

                  <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-800/40">
                    <h5 className="font-bold text-emerald-300 mb-1">2. என்ன உதவி கிடைக்கும்?</h5>
                    <p className="text-stone-200">{activeSchemeDetail.benefitsTa}</p>
                  </div>

                  <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                    <h5 className="font-bold text-sky-300 mb-2">3. தேவையான ஆவணங்கள்:</h5>
                    <ul className="list-disc list-inside space-y-1 text-stone-300">
                      {activeSchemeDetail.documentsTa.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                    <h5 className="font-bold text-amber-200 mb-1">4. எப்படி விண்ணப்பிப்பது?</h5>
                    <p className="text-stone-300">{activeSchemeDetail.howToApplyTa}</p>
                    <p className="mt-2 text-xs text-stone-400">
                      🏢 அலுவலகம்: {activeSchemeDetail.officeTa} | 📞 உதவி எண்:{' '}
                      {activeSchemeDetail.helpline}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
                  <button
                    onClick={() => speakSchemeAudio(activeSchemeDetail)}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-4 py-2.5 rounded-xl transition-all"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>முழு விவரத்தையும் குரலில் கேள்</span>
                  </button>

                  <button
                    onClick={() => setActiveSchemeDetail(null)}
                    className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm"
                  >
                    மூடு
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
