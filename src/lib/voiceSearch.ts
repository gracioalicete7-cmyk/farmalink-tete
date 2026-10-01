/**
 * Voice Recognition Service for FarmaLink Tete
 * Utilizes Web Speech API (SpeechRecognition / webkitSpeechRecognition) & SpeechSynthesis
 * Optimized for Portuguese (pt-MZ, pt-PT, pt-BR) with domain-specific intent parsing for Mozambique.
 */

import { TETE_BAIRROS } from './geo';

export interface VoiceSearchResult {
  rawTranscript: string;
  cleanedQuery: string;
  targetType: 'medicine' | 'pharmacy' | 'auto';
  filterBairro?: string;
  filter24h?: boolean;
  filterOpen?: boolean;
  confidence: number;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'unsupported';

// Check if browser supports Speech Recognition
export const isVoiceRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
};

// Known common medicines in Mozambique
const KNOWN_MEDICINES = [
  'coartem',
  'arteméter',
  'lumefantrina',
  'paracetamol',
  'amoxicilina',
  'amoxicilina + clavulanato',
  'ibuprofeno',
  'omeprazol',
  'losartan',
  'amlodipina',
  'captopril',
  'sais de reidratação oral',
  'sro',
  'ciprofloxacina',
  'azitromicina',
  'metronidazol',
  'insulina',
  'salbutamol',
  'cetirizina',
  'diclofenac',
  'diazepam',
  'metformina',
  'glibenclamida',
  'vitamina c',
  'complexo b',
  'ácido fólico',
  'sulfato ferroso',
  'xarope',
  'pomada',
  'colírio',
];

// Clean speech transcript and extract medicine or pharmacy intent
export const parseVoiceIntent = (transcript: string): VoiceSearchResult => {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  let targetType: 'medicine' | 'pharmacy' | 'auto' = 'auto';
  let filterBairro: string | undefined = undefined;
  let filter24h = false;
  let filterOpen = false;

  // Check 24h & Open filters
  if (
    lower.includes('24 horas') ||
    lower.includes('24h') ||
    lower.includes('plantão') ||
    lower.includes('noite') ||
    lower.includes('permanente')
  ) {
    filter24h = true;
    targetType = 'pharmacy';
  }

  if (
    lower.includes('aberta') ||
    lower.includes('aberto') ||
    lower.includes('funcionando') ||
    lower.includes('agora')
  ) {
    filterOpen = true;
    targetType = 'pharmacy';
  }

  // Detect Bairros in Tete
  for (const bairro of TETE_BAIRROS) {
    if (lower.includes(bairro.toLowerCase())) {
      filterBairro = bairro;
      break;
    }
  }

  // Detect if user mentions "farmácia" or "drogaria" or "posto"
  if (
    lower.includes('farmácia') ||
    lower.includes('farmacia') ||
    lower.includes('farmácias') ||
    lower.includes('drogaria')
  ) {
    if (!KNOWN_MEDICINES.some((m) => lower.includes(m))) {
      targetType = 'pharmacy';
    }
  }

  // Detect known medicine mentions
  for (const med of KNOWN_MEDICINES) {
    if (lower.includes(med)) {
      targetType = 'medicine';
      break;
    }
  }

  // Clean conversational filler words in Portuguese
  let cleaned = text
    .replace(
      /^(onde encontro|onde tem|procuro por|pesquisar|pesquisa|quero comprar|quero encontrar|preciso de|tem aí|tem aí|gostaria de|mostrar|buscar|veja se tem|encontre|encontrar|por favor|farmácia com|remédio para|medicamento para|comprimidos de|xarope de)\s+/gi,
      ''
    )
    .replace(
      /\s+(nas farmácias|na farmácia|em tete|no bairro|aberta agora|de plantão|mais próxima|mais barata|por favor)$/gi,
      ''
    )
    .trim();

  // If the query was purely a generic phrase like "farmácia de plantão", cleaned might be empty or specific
  if (!cleaned && filter24h) {
    cleaned = 'Plantão 24 Horas';
  } else if (!cleaned && filterBairro) {
    cleaned = filterBairro;
  } else if (!cleaned) {
    cleaned = text;
  }

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return {
    rawTranscript: text,
    cleanedQuery: cleaned,
    targetType,
    filterBairro,
    filter24h,
    filterOpen,
    confidence: 0.92,
  };
};

/**
 * Text-To-Speech (TTS) voice confirmation
 */
export const speakConfirmation = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT'; // Portuguese dialect
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Look for a Portuguese voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis not available or failed:', err);
  }
};
