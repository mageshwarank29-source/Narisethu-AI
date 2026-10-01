import { GoogleGenAI } from '@google/genai';
import { VERIFIED_SCHEMES, Scheme } from '../src/data/schemes.ts';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_INSTRUCTION = `
You are NariSethu (நாரிசேது), a warm, patient, and respectful Tamil voice-based government scheme assistant designed specifically for rural and underprivileged women who may have limited literacy, no internet access, and use basic keypad mobile phones over a telephone helpline.

YOUR PRIMARY LANGUAGE IS TAMIL. All responses must be exclusively in clear, simple spoken Tamil script (தமிழ்).

STRICT OPERATIONAL RULES:
1. Always communicate in simple, natural, everyday spoken Tamil (எளிய பேச்சுத் தமிழ்).
2. Avoid complicated bureaucratic or legal jargon (e.g. use "ரேஷன் கார்டு" instead of "குடும்ப அட்டைக்கான மின்னணு அட்டை", use "தாலுகா ஆபிஸ்" instead of "வருவாய் வட்டாட்சியர் அலுவலகம்").
3. Do not assume the user can read. Your text will be read aloud to her over the phone.
4. Keep answers SHORT and CLEAR. Maximum 2 to 4 sentences per turn. Never overwhelm the listener with a long wall of text.
5. ASK ONLY ONE QUESTION AT A TIME (ஒரு நேரத்தில் ஒரே ஒரு எளிய கேள்வி மட்டும் கேளுங்கள்).
   Example simple questions:
   - "உங்கள் வயது என்னம்மா?"
   - "நீங்கள் திருமணமானவரா?"
   - "உங்களுக்கு பெண் குழந்தைகள் உள்ளனவா?"
   - "உங்கள் குடும்ப ஆண்டு வருமானம் எவ்வளவு இருக்கும்?"
   - "நீங்கள் சொந்தமாக ஏதாவது தொழில் செய்கிறீர்களா அல்லது வேலை தேடுகிறீர்களா?"
6. Never claim that a person is definitely eligible unless all required conditions have been explicitly checked. If asked "எனக்கு இந்த திட்டம் கிடைக்குமா?", say "இதற்கு சில நிபந்தனைகள் உள்ளனம்மா. முதலில் உங்கள் வயதை தெரிந்து கொள்ளலாமா?"
7. Clearly distinguish when explaining a scheme:
   - திட்டத்தின் பெயர் (Scheme Name)
   - யாருக்கு கிடைக்கும்? (Eligibility)
   - என்ன உதவி கிடைக்கும்? (Benefits)
   - தேவையான ஆவணங்கள் (Required Documents)
   - எப்படி விண்ணப்பிப்பது? (How to apply & where to go)
8. Never ask for passwords, OTPs, bank PINs, ATM cards, or sensitive secrets. Warn the user that government never asks for OTP or PIN.
9. If information is unavailable or uncertain, say honestly: "மன்னிக்கவும் அம்மா, இதுபற்றி என்னிடம் அதிகாரப்பூர்வ தகவல் இல்லை. உங்கள் பகுதி இ-சேவை மையத்தில் கேட்டுப் பார்க்கலாம்."
10. Direct the user to official offices: அருகிலுள்ள இ-சேவை மையம் (e-Sevai), கிராம சுகாதார செவிலியர் (VHN), ஆரம்ப சுகாதார நிலையம் (PHC), அல்லது தாலுகா அலுவலகம்.
11. If the user asks something unrelated to government welfare schemes, politely say: "அம்மா, நான் பெண்களுக்கு அரசு திட்டங்களை பற்றி உதவி செய்யும் நாரிசேது. உங்களுக்கு அரசு உதவி அல்லது திட்டங்கள் பற்றி தெரிந்து கொள்ள நான் உதவுகிறேன்."
12. If the user says "எனக்கு புரியவில்லை" (I didn't understand), explain the same point in even simpler everyday words with an encouraging tone.

VERIFIED SCHEME DATABASE:
${JSON.stringify(
  VERIFIED_SCHEMES.map(s => ({
    name: s.nameTa,
    who: s.whoIsEligibleTa,
    benefits: s.benefitsTa,
    documents: s.documentsTa,
    howToApply: s.howToApplyTa,
    office: s.officeTa,
    simpleSummary: s.simplerExplanationTa
  })),
  null,
  2
)}
`;

export async function handleChatMessage(messages: ChatMessage[], isKeypadOption?: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If keypad shortcut was pressed
  if (typeof isKeypadOption === 'number') {
    switch (isKeypadOption) {
      case 1:
        return 'அம்மா, பெண்களுக்கு கலைஞர் மகளிர் உரிமைத் திட்டம், கர்ப்பிணி தாய்மார்களுக்கான முத்துலட்சுமி ரெட்டி திட்டம், கல்லூரி மாணவிகளுக்கான புதுமைப் பெண் திட்டம், விதவை ஓய்வூதியம், மற்றும் இலவச கேஸ் திட்டம் உள்ளன. இதில் உங்களுக்கு எதை பற்றி கேட்க வேண்டும்?';
      case 2:
        return 'உங்களுக்கு எந்த திட்டம் தகுதியாகும் என்று பார்க்கலாம் அம்மா. முதலில் உங்கள் வயதை சொல்ல முடியுமா?';
      case 3:
        return 'பொதுவாக அரசு திட்டங்களுக்கு ரேஷன் கார்டு, ஆதார் அட்டை, மற்றும் வங்கி பாஸ்புக் இந்த மூன்று ஆவணங்களும் மிக முக்கியம் அம்மா. உங்களுக்கு குறிப்பிட்ட எந்த திட்டத்தின் ஆவணம் வேண்டும்?';
      case 4:
        // Repeat previous or give brief recap
        return messages.length > 1
          ? messages[messages.length - 1].content
          : 'வணக்கம் அம்மா! நாரிசேதுவுக்கு வரவேற்கிறோம். அரசு திட்டங்களைப் பற்றி தமிழில் தெரிந்து கொள்ள நான் உதவுகிறேன். உங்களுக்கு என்ன உதவி வேண்டும்?';
      case 5:
        return 'அம்மா, பயப்பட வேண்டாம். எந்த திட்டம் வேண்டுமானாலும் உங்களிடம் உள்ள ரேஷன் கார்டு மற்றும் ஆதாரை எடுத்துக்கொண்டு ஊர் இ-சேவை மையத்திற்கு போனால் சுலபமாக விண்ணப்பிக்கலாம். உங்களுக்கு எந்த திட்டம் வேண்டும்?';
      case 0:
        return 'அம்மா, பெண்கள் உதவிக்கு 181, முதலமைச்சர் உதவிக்கு 1100, இ-சேவை மைய உதவிக்கு 1800 425 1333 என்ற எண்களுக்கு இலவசமாக போன் செய்யலாம்.';
      default:
        break;
    }
  }

  // If Gemini API is available, use GoogleGenAI
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Format conversation history for Gemini
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // If the last message is from user, invoke model
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.6,
          maxOutputTokens: 300 // Keep spoken answers concise and punchy
        }
      });

      const reply = response.text?.trim();
      if (reply) {
        return reply;
      }
    } catch (err) {
      console.warn('Gemini API call failed, using intelligent rule-based engine:', err);
    }
  }

  // Fallback intelligent conversation engine adhering strictly to rules
  const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || '';

  if (lastUserMsg.includes('வணக்கம்') || lastUserMsg.includes('ஹலோ') || lastUserMsg.includes('hello')) {
    return 'வணக்கம் அம்மா! நாரிசேதுவுக்கு வரவேற்கிறோம். அரசு திட்டங்களைப் பற்றி தமிழில் தெரிந்து கொள்ள நான் உதவுகிறேன். உங்களுக்கு என்ன தகவல் வேண்டும்?';
  }

  if (lastUserMsg.includes('புரியல') || lastUserMsg.includes('விளங்கல') || lastUserMsg.includes('மறுபடியும்')) {
    return 'கவலைப்படாதீர்கள் அம்மா, நான் மெதுவாக சொல்கிறேன். ரேஷன் கார்டும் ஆதார் அட்டையும் இருந்தாலே பல அரசு திட்டங்களுக்கு விண்ணப்பிக்க முடியும். உங்களுக்கு என்ன உதவி தேவை என்று சொல்லுங்கள், நான் உதவுகிறேன்.';
  }

  if (lastUserMsg.includes('உரிமைத் தொகை') || lastUserMsg.includes('மகளிர் உரிமை') || lastUserMsg.includes('1000') || lastUserMsg.includes('ஆயிரம்')) {
    return 'கலைஞர் மகளிர் உரிமைத் திட்டத்தில் குடும்பத் தலைவிகளுக்கு மாதம் 1000 ரூபாய் கிடைக்கிறது அம்மா. இதற்கு 21 வயது முடிந்திருக்க வேண்டும், குடும்ப ஆண்டு வருமானம் இரண்டரை லட்சத்துக்குள் இருக்க வேண்டும். உங்களுக்கு 21 வயது முடிந்துவிட்டதா அம்மா?';
  }

  if (lastUserMsg.includes('கர்ப்பிணி') || lastUserMsg.includes('பிரசவம்') || lastUserMsg.includes('குழந்தை பிறக்க') || lastUserMsg.includes('முத்துலட்சுமி')) {
    return 'கர்ப்பிணி தாய்மார்களுக்கு டாக்டர் முத்துலட்சுமி ரெட்டி திட்டத்தில் 18 ஆயிரம் ரூபாய் வரை உதவியும் சத்து மாவு பெட்டகமும் கிடைக்கும் அம்மா. ஆரம்ப சுகாதார நிலையத்தில் உங்கள் பெயரை பிக்மி (PICME) முறையில் பதிவு செய்துவிட்டீர்களா?';
  }

  if (lastUserMsg.includes('படிப்பு') || lastUserMsg.includes('கல்லூரி') || lastUserMsg.includes('புதுமைப் பெண்') || lastUserMsg.includes('மாணவி')) {
    return 'அரசு பள்ளியில் படித்து கல்லூரி செல்லும் மாணவிகளுக்கு புதுமைப் பெண் திட்டத்தில் மாதம் 1000 ரூபாய் வங்கி கணக்கில் சேரும் அம்மா. உங்கள் மகள் படிக்கும் கல்லூரி மூலமாகவே இதற்கு விண்ணப்பிக்கலாம்.';
  }

  if (lastUserMsg.includes('விதவை') || lastUserMsg.includes('கணவர் இறந்து') || lastUserMsg.includes('ஓய்வூதியம்')) {
    return 'கணவரை இழந்த ஏழை தாய்மார்களுக்கு மாதம் 1200 ரூபாய் விதவை ஓய்வூதியமும் இலவச அரிசியும் கிடைக்கும் அம்மா. இதற்கு கணவரின் இறப்புச் சான்றிதழும் விதவைச் சான்றிதழும் தேவை. தாலுகா அலுவலகம் அல்லது இ-சேவை மையத்தில் விண்ணப்பிக்கலாம்.';
  }

  if (lastUserMsg.includes('தொழில்') || lastUserMsg.includes('கடன்') || lastUserMsg.includes('சுயஉதவி') || lastUserMsg.includes('வியாபாரம்')) {
    return 'சுயதொழில் செய்ய விரும்பும் பெண்களுக்கு மகளிர் சுயஉதவிக் குழு மூலமாகவும் அரசு மானியத்துடனும் வங்கிக் கடன் கிடைக்கும் அம்மா. உங்கள் ஊரில் மகளிர் குழுவில் நீங்கள் உறுப்பினராக இருக்கிறீர்களா?';
  }

  if (lastUserMsg.includes('திருமணம்') || lastUserMsg.includes('கல்யாணம்') || lastUserMsg.includes('தாலி') || lastUserMsg.includes('தங்கம்')) {
    return 'ஏழை விதவை தாய்மார்களின் மகள் திருமணத்திற்கு தாலிக்கு 8 கிராம் தங்கமும், 25 ஆயிரம் முதல் 50 ஆயிரம் ரூபாய் வரை பணமும் கிடைக்கிறது அம்மா. பெண்ணிற்கு 18 வயது முடிந்திருக்க வேண்டும். திருமணத்திற்கு 40 நாட்களுக்கு முன்பே இ-சேவை மையத்தில் விண்ணப்பிக்க வேண்டும்.';
  }

  if (lastUserMsg.includes('கேஸ்') || lastUserMsg.includes('சிலிண்டர்') || lastUserMsg.includes('உஜ்வாலா')) {
    return 'உஜ்வாலா திட்டத்தில் ஏழை குடும்பத்து பெண்களுக்கு இலவச கேஸ் அடுப்பும் முதல் சிலிண்டரும் இலவசமாக கிடைக்கும் அம்மா. ரேஷன் கார்டுடன் பக்கத்தில் உள்ள கேஸ் ஏஜென்சியில் விண்ணப்பிக்கலாம்.';
  }

  if (lastUserMsg.includes('ஆவணம்') || lastUserMsg.includes('சர்டிபிகேட்') || lastUserMsg.includes('என்ன வேணும்')) {
    return 'பொதுவாக ரேஷன் கார்டு, உங்கள் ஆதார் அட்டை, மற்றும் வங்கி கணக்குப் புத்தகம் இந்த மூன்று இருந்தால் போதும் அம்மா. உங்களுக்கு குறிப்பிட்ட எந்த திட்டத்திற்கு ஆவணங்கள் தேவை?';
  }

  if (lastUserMsg.includes('எப்படி விண்ணப்பிக்க') || lastUserMsg.includes('எங்க போகணும்')) {
    return 'பெரும்பாலான திட்டங்களுக்கு உங்கள் ஊரில் இருக்கும் அரசு இ-சேவை மையத்திற்கு (e-Sevai) சென்றாலே விண்ணப்பித்து விடுவார்கள் அம்மா. அங்கு உங்கள் ரேஷன் கார்டு மற்றும் ஆதாரை எடுத்துச் செல்ல வேண்டும்.';
  }

  // Default thoughtful question keeping telephone dialogue flow
  return 'நான் புரிந்து கொண்டேன் அம்மா. நீங்கள் தகுதியான திட்டத்தை சரியாக சொல்ல, முதலில் உங்கள் வயதையும், நீங்கள் குடும்பத் தலைவியா என்பதையும் தெரிந்து கொள்ளலாமா?';
}
