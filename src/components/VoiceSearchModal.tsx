import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Search,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Pill,
  Store,
  MapPin,
  Clock,
  RotateCcw,
  Radio,
} from 'lucide-react';
import {
  isVoiceRecognitionSupported,
  parseVoiceIntent,
  speakConfirmation,
  VoiceSearchResult,
  VoiceState,
} from '../lib/voiceSearch';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSearch: (result: VoiceSearchResult) => void;
  defaultType?: 'medicine' | 'pharmacy' | 'auto';
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSearch,
  defaultType = 'auto',
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<VoiceSearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(true);
  const [soundBars, setSoundBars] = useState<number[]>([40, 65, 30, 80, 50, 90, 45, 70, 35]);

  const recognitionRef = useRef<any>(null);
  const animationIntervalRef = useRef<any>(null);

  // Suggested Voice Prompts for Tete
  const suggestedVoicePrompts = [
    { text: 'Paracetamol 500 miligramas', type: 'medicine', tag: 'Analgésico' },
    { text: 'Coartem para malária', type: 'medicine', tag: 'Antimalárico' },
    { text: 'Amoxicilina 500mg cápsulas', type: 'medicine', tag: 'Antibiótico' },
    { text: 'Farmácias abertas agora no Matundo', type: 'pharmacy', tag: 'Bairro Matundo' },
    { text: 'Farmácia de plantão 24 horas', type: 'pharmacy', tag: 'Escala Nocturna' },
    { text: 'Sais de Reidratação Oral SRO', type: 'medicine', tag: 'Digestão' },
  ];

  // Start Recognition instance
  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setInterimTranscript('');
    setParsedResult(null);

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceState('unsupported');
      setErrorMessage(
        'O seu navegador não suporta a API nativa de reconhecimento de voz. Pode digitar ou escolher um dos comandos rápidos abaixo.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'pt-MZ'; // Portuguese (Mozambique) with automatic fallbacks
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          setInterimTranscript('');
          const result = parseVoiceIntent(finalTranscript);
          if (defaultType !== 'auto' && result.targetType === 'auto') {
            result.targetType = defaultType;
          }
          setParsedResult(result);
          setVoiceState('success');

          if (isTtsEnabled) {
            speakConfirmation(
              `A pesquisar ${result.cleanedQuery} nas farmácias de Tete`
            );
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'no-speech') {
          setErrorMessage('Nenhum comando de voz detectado. Aproxime o telemóvel e fale claramente.');
          setVoiceState('idle');
        } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage('Permissão do microfone negada. Por favor, autorize o acesso ao microfone no navegador.');
          setVoiceState('error');
        } else {
          setErrorMessage(`Falha na captação de voz (${event.error}). Tente novamente.`);
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      setVoiceState('error');
      setErrorMessage('Não foi possível iniciar o microfone. Verifique as permissões.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if (voiceState === 'listening') {
      setVoiceState('idle');
    }
  };

  // Sound wave bar animation effect when listening
  useEffect(() => {
    if (voiceState === 'listening') {
      animationIntervalRef.current = setInterval(() => {
        setSoundBars(
          Array.from({ length: 9 }, () => Math.floor(Math.random() * 70) + 20)
        );
      }, 120);
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      setSoundBars([30, 45, 20, 50, 30, 55, 25, 40, 20]);
    }

    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    };
  }, [voiceState]);

  // Start listening automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  const handleApplyQuickPrompt = (promptText: string, type: 'medicine' | 'pharmacy') => {
    setTranscript(promptText);
    const result = parseVoiceIntent(promptText);
    result.targetType = type;
    setParsedResult(result);
    setVoiceState('success');

    if (isTtsEnabled) {
      speakConfirmation(`A pesquisar ${result.cleanedQuery} em Tete`);
    }
  };

  const handleConfirmSearch = () => {
    if (parsedResult) {
      onSelectSearch(parsedResult);
      onClose();
    } else if (transcript) {
      const result = parseVoiceIntent(transcript);
      onSelectSearch(result);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-search-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="voice-search-modal-container"
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight text-white flex items-center gap-1.5">
                <span>Pesquisa por Voz</span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  FarmaLink AI
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80">
                Fale o nome do medicamento, farmácia ou bairro em Tete
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                isTtsEnabled
                  ? 'bg-white/20 text-emerald-200 hover:bg-white/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
              title={isTtsEnabled ? 'Voz de confirmação ligada' : 'Voz de confirmação silenciada'}
            >
              {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              id="voice-modal-close-btn"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Animated Center Microphone State */}
          <div className="flex flex-col items-center justify-center text-center space-y-3 py-3">
            <div className="relative flex items-center justify-center">
              {/* Ripple Rings */}
              {voiceState === 'listening' && (
                <>
                  <span className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping"></span>
                  <span className="absolute w-24 h-24 rounded-full bg-rose-500/30 animate-pulse"></span>
                </>
              )}
              {voiceState === 'success' && (
                <span className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-pulse"></span>
              )}

              <button
                type="button"
                id="voice-mic-main-toggle"
                onClick={voiceState === 'listening' ? stopListening : startListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  voiceState === 'listening'
                    ? 'bg-linear-to-tr from-rose-600 to-red-500 text-white ring-4 ring-rose-300/50 shadow-rose-500/30 scale-105'
                    : voiceState === 'success'
                    ? 'bg-linear-to-tr from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-300/50'
                    : 'bg-linear-to-tr from-slate-800 to-slate-700 text-white hover:bg-slate-800 ring-4 ring-slate-200'
                }`}
              >
                {voiceState === 'listening' ? (
                  <Mic className="w-9 h-9 animate-bounce" />
                ) : voiceState === 'success' ? (
                  <CheckCircle2 className="w-9 h-9" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* Audio Wave Visualizer Bars */}
            <div className="flex items-center justify-center gap-1.5 h-8">
              {soundBars.map((height, idx) => (
                <span
                  key={idx}
                  style={{ height: `${height}%` }}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    voiceState === 'listening'
                      ? 'bg-rose-500'
                      : voiceState === 'success'
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                ></span>
              ))}
            </div>

            {/* Status Label */}
            <div>
              <p
                className={`text-sm font-black ${
                  voiceState === 'listening'
                    ? 'text-rose-600 animate-pulse'
                    : voiceState === 'success'
                    ? 'text-emerald-700'
                    : 'text-slate-700'
                }`}
              >
                {voiceState === 'listening'
                  ? 'A escutar... Fale agora'
                  : voiceState === 'success'
                  ? 'Voz reconhecida com sucesso!'
                  : voiceState === 'unsupported'
                  ? 'Entrada por Voz Indisponível'
                  : 'Toque no microfone para falar'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Idioma configurado: Português de Moçambique (pt-MZ)
              </p>
            </div>
          </div>

          {/* Transcript Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[90px] flex flex-col justify-center">
            {transcript || interimTranscript ? (
              <div className="space-y-2">
                <p className="text-base font-bold text-slate-900">
                  "{transcript || interimTranscript}"
                </p>

                {parsedResult && (
                  <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-500">
                      Interpretação FarmaLink:
                    </span>
                    {parsedResult.targetType === 'medicine' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Pill className="w-3 h-3" /> Fármaco: {parsedResult.cleanedQuery}
                      </span>
                    )}
                    {parsedResult.targetType === 'pharmacy' && (
                      <span className="bg-teal-100 text-teal-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Store className="w-3 h-3" /> Farmácia / Local: {parsedResult.cleanedQuery}
                      </span>
                    )}
                    {parsedResult.filterBairro && (
                      <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {parsedResult.filterBairro}
                      </span>
                    )}
                    {parsedResult.filter24h && (
                      <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 24 Horas / Plantão
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-400 italic text-center">
                Diga por exemplo: "Preciso de Coartem para malária" ou "Farmácia aberta no Bairro Matundo"...
              </p>
            )}
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Suggested Quick Voice Prompts for Tete */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exemplos de comandos rápidos em Tete:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedVoicePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    handleApplyQuickPrompt(prompt.text, prompt.type as 'medicine' | 'pharmacy')
                  }
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/60 hover:border-emerald-300 text-left transition-all flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                      "{prompt.text}"
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {prompt.tag}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 group-hover:bg-emerald-200/70 text-slate-600 group-hover:text-emerald-800 font-bold px-2 py-0.5 rounded-md shrink-0">
                    Testar
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={startListening}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Falar de Novo</span>
          </button>

          <button
            type="button"
            id="voice-search-confirm-action"
            disabled={!transcript && !parsedResult}
            onClick={handleConfirmSearch}
            className={`px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              transcript || parsedResult
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Pesquisar Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
