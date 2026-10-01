import React, { useState } from 'react';
import {
  ClinicalButton,
  AvailabilityBadge,
  PriceDisplay,
  DosageBadge,
  SanitaryTag,
  AndroidCard,
  QuickActionChip,
  AvailabilityStatusType,
  ButtonVariant,
  ButtonSize,
} from '../components/ClinicalPrecision';
import {
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Lock,
  Pill,
  Store,
  Layers,
  Eye,
  Sun,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sliders,
  Type,
  Palette,
  Touchpad,
  Plus,
  Minus,
  Search,
  Phone,
  ArrowRight,
  HelpCircle,
  X,
} from 'lucide-react';
import { FarmaLinkLogo } from '../lib/logo';
import { ScreenHeader } from '../components/ScreenHeader';

interface DesignSystemViewProps {
  onNavigate?: (tab: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

export const DesignSystemView: React.FC<DesignSystemViewProps> = ({ onNavigate, onBack }) => {
  // Simulator Viewport Mode
  const [viewportMode, setViewportMode] = useState<'desktop' | 'android'>('desktop');
  const [showTouchGrid, setShowTouchGrid] = useState(false);
  const [sunlightSimulation, setSunlightSimulation] = useState(false);

  // Interactive Sandbox state
  const [sandboxPrice, setSandboxPrice] = useState<number>(450.0);
  const [sandboxStock, setSandboxStock] = useState<AvailabilityStatusType>('available');
  const [sandboxRxRequired, setSandboxRxRequired] = useState(true);
  const [sandboxDuty24h, setSandboxDuty24h] = useState(true);
  const [sandboxQty, setSandboxQty] = useState(1);
  const [sandboxBtnLoading, setSandboxBtnLoading] = useState(false);
  const [sandboxClickCount, setSandboxClickCount] = useState(0);

  // Copied code feedback
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const statusBadgeList: { type: AvailabilityStatusType; title: string; desc: string; dpsRule: string }[] = [
    {
      type: 'available',
      title: 'Disponível em Stock',
      desc: 'Stock regular garantido pela farmácia.',
      dpsRule: 'Dispensação imediata no balcão.',
    },
    {
      type: 'low_stock',
      title: 'Baixo Stock (< 5 un.)',
      desc: 'Quantidade limitada; reserva prioritária.',
      dpsRule: 'Alerta ao utente para reserva imediata.',
    },
    {
      type: 'out_of_stock',
      title: 'Esgotado no Momento',
      desc: 'Sem unidades físicas na unidade.',
      dpsRule: 'Sugere farmácias alternativas mais próximas.',
    },
    {
      type: 'duty_24h',
      title: 'Plantão 24 Horas Activo',
      desc: 'Atendimento noturno e fim de semana.',
      dpsRule: 'Escala sanitária oficial homologada pela DPS.',
    },
    {
      type: 'prescription_req',
      title: 'Receita Médica Obrigatória (R.M.)',
      desc: 'Antibióticos, anti-hipertensivos, etc.',
      dpsRule: 'Apresentação obrigatória da receita física válida.',
    },
    {
      type: 'otc_free',
      title: 'Venda Livre (MIP)',
      desc: 'Medicamento isento de prescrição.',
      dpsRule: 'Dispensação sem exigência de receita.',
    },
    {
      type: 'dps_approved',
      title: 'Homologado DPS Tete',
      desc: 'Farmácia com alvará e vistoria regular.',
      dpsRule: 'Certificado de Conformidade Sanitária Provincial.',
    },
    {
      type: 'special_control',
      title: 'Controlo Especial / Psicotrópico',
      desc: 'Medicamentos da Tabela I/II.',
      dpsRule: 'Retenção obrigatória da receita e registo no livro.',
    },
  ];

  return (
    <div
      id="design-system-clinical-view"
      className={`space-y-4 pb-16 animate-in fade-in duration-200 transition-colors ${
        sunlightSimulation ? 'bg-amber-50/50 p-2 rounded-3xl' : ''
      }`}
    >
      {/* Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title="Sistema de Design Clínico"
          subtitle="Guia Oficial de Interface & Padrões FarmaLink"
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
        />
      )}

      {/* ================= HERO HEADER ================= */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clinical Precision 2.0</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-500/30">
              Android Touch Target ≥ 48px
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700">
              WCAG AAA • Luz Solar de Tete
            </span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-emerald-400 shrink-0" />
              <span>Sistema de Design Clínico & Guia Android</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
              Padrões visuais e ergonómicos desenvolvidos especificamente para a plataforma{' '}
              <strong className="text-white">FarmaLink Tete</strong>. Focado em alta legibilidade em ecrãs de
              smartphones sob a intensa luz solar de Moçambique, rapidez de resposta em emergências e conformidade com
              as normas sanitárias da DPS.
            </p>
          </div>

          {/* Interactive Mode Toolbar */}
          <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-slate-800">
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
              <button
                type="button"
                id="ds-view-desktop-btn"
                onClick={() => setViewportMode('desktop')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewportMode === 'desktop' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Vista Completa (Desktop)</span>
              </button>
              <button
                type="button"
                id="ds-view-android-btn"
                onClick={() => setViewportMode('android')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewportMode === 'android' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simulador Android (390px)</span>
              </button>
            </div>

            {/* Touch Target Overlay Toggle */}
            <button
              type="button"
              id="ds-toggle-touch-grid"
              onClick={() => setShowTouchGrid(!showTouchGrid)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                showTouchGrid
                  ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Touchpad className="w-3.5 h-3.5" />
              <span>{showTouchGrid ? 'Ocultar Alvos de Toque' : 'Mostrar Alvos de Toque (48px)'}</span>
            </button>

            {/* Sunlight Simulation Toggle */}
            <button
              type="button"
              id="ds-toggle-sunlight"
              onClick={() => setSunlightSimulation(!sunlightSimulation)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                sunlightSimulation
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{sunlightSimulation ? 'Simulador Sol Desativar' : 'Simular Luz Solar de Tete (40°C)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTAINER (RESPONSIVE OR SIMULATED ANDROID) ================= */}
      <div className={`transition-all duration-300 ${viewportMode === 'android' ? 'max-w-[420px] mx-auto' : 'w-full'}`}>
        {viewportMode === 'android' && (
          <div className="text-center mb-3 bg-emerald-100 text-emerald-900 border border-emerald-300 py-1.5 px-3 rounded-full text-xs font-bold inline-flex items-center gap-1.5 mx-auto">
            <Smartphone className="w-4 h-4 text-emerald-700" />
            <span>Simulador de Ecrã Android • Touch Target 48px</span>
          </div>
        )}

        <div
          className={`space-y-8 ${
            viewportMode === 'android'
              ? 'p-4 bg-slate-100 rounded-[40px] border-8 border-slate-900 shadow-2xl overflow-hidden'
              : ''
          } ${showTouchGrid ? 'ring-2 ring-purple-500 ring-offset-4 ring-offset-slate-50' : ''}`}
        >
          {/* ================= SECTION 0: MANUAL DO LOGOTIPO OFICIAL & BRAND GUIDELINES ================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">
                  Identidade Visual Oficial
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <span>Logotipo Oficial FarmaLink Tete</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Especificação do símbolo tecnológico-sanitário, regras tipográficas, proporções e aplicações oficiais.
                </p>
              </div>
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl self-start sm:self-auto">
                Norma Oficial v2.0
              </span>
            </div>

            {/* Logo Big Display Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Light Variant */}
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group">
                <div className="absolute top-3 left-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Aplicação em Fundo Claro
                </div>
                <div className="py-6">
                  <FarmaLinkLogo size="2xl" showText={true} showSlogan={true} layout="horizontal" />
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Uso principal em website, cabeçalhos, documentos oficiais da DPS e faturas.
                </div>
              </div>

              {/* Dark Variant */}
              <div className="p-8 bg-[#0B192C] rounded-3xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group">
                <div className="absolute top-3 left-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Aplicação em Fundo Escuro
                </div>
                <div className="py-6">
                  <FarmaLinkLogo size="2xl" showText={true} showSlogan={true} layout="horizontal" variant="dark" />
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Uso em ecrãs noturnos, interfaces de plantão 24h e materiais digitais premium.
                </div>
              </div>
            </div>

            {/* Symbol Anatomy & Concept Breakdown */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Anatomia do Símbolo & Proposta de Valor</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Pin GPS Verde */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Pin GPS Verde</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Em verde de saúde e farmácia, representa a <strong>geolocalização em tempo real</strong> de farmácias em Tete e a rota rápida.
                  </p>
                </div>

                {/* 2. Círculo com Borda Branca Grossa & Cruz */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Círculo & Cruz (+) com Borda Branca</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Com anel branco espesso e bem contrastado, simboliza <strong>assistência farmacêutica oficial</strong> e máxima visibilidade.
                  </p>
                </div>

                {/* 3. Cápsula Inclinada */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Cápsula Azul & Branca</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Representa os <strong>medicamentos e stock disponível</strong>. A inclinação confere dinamismo, inovação e modernidade.
                  </p>
                </div>
              </div>
            </div>

            {/* Typography Rules & Exact Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Typography */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-emerald-600" />
                  <span>Regras Tipográficas do Nome</span>
                </h4>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xl font-black font-sans">
                    <span className="text-[#0F2942]">FarmaLink</span>{' '}
                    <span className="text-[#059669]">Tete</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    • <strong>FarmaLink:</strong> Azul-escuro profissional (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-800">#0F2942</code>).<br />
                    • <strong>Tete:</strong> Verde esmeralda de saúde (<code className="text-[10px] bg-emerald-50 px-1 py-0.5 rounded text-emerald-800">#059669</code>).<br />
                    • <strong>Fonte:</strong> Moderna, sem serifa, pesos ExtraBold a Black.
                  </p>
                </div>
              </div>

              {/* Color Codes */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>Paleta de Cores Institucionais</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="w-full h-8 rounded-lg bg-[#059669] shadow-xs"></div>
                    <span className="font-bold text-[10px] text-slate-800 block">Verde Saúde</span>
                    <code className="text-[9px] font-mono text-slate-500">#059669</code>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="w-full h-8 rounded-lg bg-[#0F2942] shadow-xs"></div>
                    <span className="font-bold text-[10px] text-slate-800 block">Azul Tecnologia</span>
                    <code className="text-[9px] font-mono text-slate-500">#0F2942</code>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="w-full h-8 rounded-lg bg-white border border-slate-300 shadow-xs"></div>
                    <span className="font-bold text-[10px] text-slate-800 block">Branco Limpeza</span>
                    <code className="text-[9px] font-mono text-slate-500">#FFFFFF</code>
                  </div>
                </div>
              </div>
            </div>

            {/* App Icon Scalability Showcase */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Escalabilidade em Ícone Android / iOS</span>
              </h4>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <FarmaLinkLogo size="xs" showText={false} />
                  <span className="text-[10px] font-mono text-slate-500">24px (Notificação)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FarmaLinkLogo size="sm" showText={false} />
                  <span className="text-[10px] font-mono text-slate-500">32px (Barra)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FarmaLinkLogo size="md" showText={false} />
                  <span className="text-[10px] font-mono text-slate-500">42px (Header)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FarmaLinkLogo size="lg" showText={false} />
                  <span className="text-[10px] font-mono text-slate-500">56px (Launcher)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FarmaLinkLogo size="xl" showText={false} />
                  <span className="text-[10px] font-mono text-slate-500">72px (Splash)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= SECTION 1: INTERACTIVE SANDBOX ================= */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">
                  Laboratório em Tempo Real
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                  <span>Sandbox do Componente de Medicamento</span>
                </h2>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                Interativo
              </span>
            </div>

            {/* Sandbox Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Price Control */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="font-bold text-slate-700 block">Preço (Meticais MZN):</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSandboxPrice(Math.max(50, sandboxPrice - 50))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 flex items-center justify-center hover:bg-slate-100 active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={sandboxPrice}
                    onChange={(e) => setSandboxPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1 font-mono font-bold text-center text-emerald-950 focus:outline-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSandboxPrice(sandboxPrice + 50)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 flex items-center justify-center hover:bg-slate-100 active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Availability Stock Selector */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="font-bold text-slate-700 block">Estado de Stock:</label>
                <select
                  value={sandboxStock}
                  onChange={(e) => setSandboxStock(e.target.value as AvailabilityStatusType)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-emerald-500"
                >
                  <option value="available">Disponível</option>
                  <option value="low_stock">Baixo Stock</option>
                  <option value="out_of_stock">Esgotado</option>
                  <option value="duty_24h">Plantão 24h</option>
                </select>
              </div>

              {/* Prescription Toggle */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <span className="font-bold text-slate-700">Tipo de Prescrição:</span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setSandboxRxRequired(true)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      sandboxRxRequired
                        ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Receita (R.M.)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSandboxRxRequired(false)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      !sandboxRxRequired
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Venda Livre
                  </button>
                </div>
              </div>

              {/* Duty 24h Toggle */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <span className="font-bold text-slate-700">Farmácia de Plantão:</span>
                <button
                  type="button"
                  onClick={() => setSandboxDuty24h(!sandboxDuty24h)}
                  className={`w-full py-1.5 px-2 mt-1 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    sandboxDuty24h
                      ? 'bg-teal-900 text-teal-100 border-teal-700 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{sandboxDuty24h ? 'Plantão 24h Activo' : 'Horário Normal (08h-18h)'}</span>
                </button>
              </div>
            </div>

            {/* LIVE RENDERED PREVIEW CARD */}
            <div className="p-1 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-teal-500/20 rounded-3xl">
              <div className="bg-white rounded-[22px] p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <DosageBadge dosage="500 mg" form="Comprimidos Revestidos" />
                      {sandboxRxRequired ? (
                        <AvailabilityBadge status="prescription_req" size="xs" />
                      ) : (
                        <AvailabilityBadge status="otc_free" size="xs" />
                      )}
                      {sandboxDuty24h && <AvailabilityBadge status="duty_24h" size="xs" />}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      Amoxicilina + Ácido Clavulânico
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <strong className="text-slate-800">Farmácia Central de Tete</strong>
                      <span>• Bairro Josina Machel</span>
                    </p>
                  </div>

                  {/* Dynamic Availability Badge */}
                  <AvailabilityBadge status={sandboxStock} size="md" />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                      Valor Unitário Homologado
                    </span>
                    <PriceDisplay amount={sandboxPrice} size="lg" />
                  </div>

                  {/* Android Optimized Action Buttons with 48px height */}
                  <div className="flex items-center gap-2.5">
                    {/* Quantity Touch Selector */}
                    <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setSandboxQty(Math.max(1, sandboxQty - 1))}
                        className="w-10 h-10 rounded-xl bg-white text-slate-900 font-black flex items-center justify-center hover:bg-slate-50 active:scale-95 shadow-2xs"
                        title="Diminuir quantidade"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-mono font-black text-sm text-slate-900">
                        {sandboxQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSandboxQty(sandboxQty + 1)}
                        className="w-10 h-10 rounded-xl bg-white text-slate-900 font-black flex items-center justify-center hover:bg-slate-50 active:scale-95 shadow-2xs"
                        title="Aumentar quantidade"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Primary Touch Button */}
                    <ClinicalButton
                      variant={sandboxStock === 'out_of_stock' ? 'outline' : 'primary'}
                      size="md"
                      disabled={sandboxStock === 'out_of_stock'}
                      isLoading={sandboxBtnLoading}
                      onClick={() => {
                        setSandboxBtnLoading(true);
                        setTimeout(() => {
                          setSandboxBtnLoading(false);
                          setSandboxClickCount((c) => c + 1);
                        }, 800);
                      }}
                      icon={<Pill className="w-4 h-4" />}
                    >
                      {sandboxStock === 'out_of_stock' ? 'Indisponível' : 'Reservar no Balcão'}
                    </ClinicalButton>
                  </div>
                </div>

                {sandboxClickCount > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between animate-in fade-in">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Teste tátil registado com sucesso! ({sandboxClickCount} interações)</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700">Tempo de resposta &lt; 50ms</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: AVAILABILITY & SANITARY BADGES ================= */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">
                Regulação & Estados Farmacêuticos
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Matriz de Badges de Disponibilidade & Saúde</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Códigos de cor estandardizados para garantir decisão visual rápida em situações de emergência.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {statusBadgeList.map((item) => (
                <div
                  key={item.type}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <AvailabilityBadge status={item.type} size="sm" />
                    <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      status="{item.type}"
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Norma DPS:</span>
                    <span className="text-emerald-800 font-bold">{item.dpsRule}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= SECTION 3: CLINICAL BUTTONS & ANDROID TOUCH TARGETS ================= */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">
                Ergonomia Tátil Android
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Touchpad className="w-5 h-5 text-emerald-600" />
                <span>Botões Clínicos & Alvos de Toque (≥ 48px)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Conforme as diretrizes Android Material Design, todos os botões possuem área mínima de toque de 48x48dp
                com feedback tátil ativo (`active:scale-[0.98]`).
              </p>
            </div>

            {/* Button Variants Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Primary Emerald */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-mono font-bold text-slate-500 block">variant="primary"</span>
                <ClinicalButton variant="primary" fullWidth icon={<CheckCircle2 className="w-4 h-4" />}>
                  Confirmar Reserva
                </ClinicalButton>
                <p className="text-[11px] text-slate-500">Ação principal de saúde e levantamento.</p>
              </div>

              {/* Secondary Soft Emerald */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-mono font-bold text-slate-500 block">variant="secondary"</span>
                <ClinicalButton variant="secondary" fullWidth icon={<Store className="w-4 h-4 text-emerald-700" />}>
                  Ver Farmácia
                </ClinicalButton>
                <p className="text-[11px] text-slate-500">Navegação e consulta de detalhes.</p>
              </div>

              {/* Official DPS Blue */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-mono font-bold text-slate-500 block">variant="dps"</span>
                <ClinicalButton variant="dps" fullWidth icon={<ShieldCheck className="w-4 h-4" />}>
                  Homologar Alvará
                </ClinicalButton>
                <p className="text-[11px] text-slate-500">Ações administrativas e de inspeção sanitária.</p>
              </div>

              {/* Amber Attention */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-mono font-bold text-slate-500 block">variant="amber"</span>
                <ClinicalButton variant="amber" fullWidth icon={<Lock className="w-4 h-4" />}>
                  Anexar Receita Médica
                </ClinicalButton>
                <p className="text-[11px] text-slate-500">Exigências sanitárias e validações obrigatórias.</p>
              </div>

              {/* Destructive Danger */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-mono font-bold text-slate-500 block">variant="danger"</span>
                <ClinicalButton variant="danger" fullWidth icon={<XCircle className="w-4 h-4" />}>
                  Cancelar Pedido
                </ClinicalButton>
                <p className="text-[11px] text-slate-500">Ações irreversíveis ou cancelamentos.</p>
              </div>

              {/* Neutral Outline */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-mono font-bold text-slate-500 block">variant="outline"</span>
                <ClinicalButton variant="outline" fullWidth icon={<Clock className="w-4 h-4 text-slate-500" />}>
                  Ver Histórico
                </ClinicalButton>
                <p className="text-[11px] text-slate-500">Ações secundárias neutras.</p>
              </div>
            </div>

            {/* Quick Action Chips Showcase */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900">Chips de Filtro Rápido (Android Micro-Interação):</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <QuickActionChip label="Todos os Medicamentos" active={true} count={142} />
                <QuickActionChip label="Plantão 24h" icon={<Clock className="w-3.5 h-3.5" />} count={18} />
                <QuickActionChip label="Venda Livre (MIP)" count={64} />
                <QuickActionChip label="Antibióticos (R.M.)" count={35} />
                <QuickActionChip label="Homologadas DPS" icon={<ShieldCheck className="w-3.5 h-3.5" />} count={12} />
              </div>
            </div>
          </div>

          {/* ================= SECTION 4: CLINICAL TYPOGRAPHY & CONTRAST ================= */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">
                Escala Tipográfica & Contraste WCAG
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Type className="w-5 h-5 text-emerald-600" />
                <span>Tipografia Sem-Serifa de Alta Legibilidade</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tamanhos calibrados para manter nitidez ótica sob luz solar direta e em ecrãs OLED/IPS de telemóveis
                económicos.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>Display Hero (32px / 2rem • Font Black)</span>
                  <span>Leading: 1.15 • Tracking: Tight</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-950">
                  FarmaLink Tete: Saúde em Tempo Real
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>Heading 1 (24px / 1.5rem • Font ExtraBold)</span>
                  <span>Leading: 1.25</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Farmácias Disponíveis na Província
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>Preço em Meticais (PriceDisplay Component)</span>
                  <span>Formato: Inteiro + Decimal em Subscript</span>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tamanho SM:</span>
                    <PriceDisplay amount={85.5} size="sm" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tamanho MD:</span>
                    <PriceDisplay amount={450.0} size="md" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tamanho LG:</span>
                    <PriceDisplay amount={1280.75} size="lg" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>Códigos Sanitários & Dosagens (Monospace)</span>
                  <span>Font Mono • Tracking: Tight</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <DosageBadge dosage="500 mg" form="Cápsulas" />
                  <DosageBadge dosage="250 mg / 5 mL" form="Xarope 100 mL" />
                  <SanitaryTag code="DPS-TETE-2026-089" label="Alvará DPS" />
                </div>
              </div>
            </div>
          </div>

          {/* ================= SECTION 5: COLOR PALETTE & SANITARY TOKENS ================= */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">
                Paleta de Cores Sanitárias
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                <span>Tokens Clínicos FarmaLink Tete</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="h-14 rounded-2xl bg-emerald-600 shadow-inner flex items-end p-2 text-white font-mono font-bold text-[11px]">
                  #059669
                </div>
                <span className="font-bold text-slate-900 block">Emerald Saúde</span>
                <span className="text-[10px] text-slate-500">Stock & Ações Primárias</span>
              </div>

              <div className="space-y-1.5">
                <div className="h-14 rounded-2xl bg-blue-700 shadow-inner flex items-end p-2 text-white font-mono font-bold text-[11px]">
                  #1D4ED8
                </div>
                <span className="font-bold text-slate-900 block">Blue DPS Oficial</span>
                <span className="text-[10px] text-slate-500">Regulação & Alvarás</span>
              </div>

              <div className="space-y-1.5">
                <div className="h-14 rounded-2xl bg-amber-500 shadow-inner flex items-end p-2 text-slate-950 font-mono font-bold text-[11px]">
                  #F59E0B
                </div>
                <span className="font-bold text-slate-900 block">Amber Atenção</span>
                <span className="text-[10px] text-slate-500">Receita Médica & Baixo Stock</span>
              </div>

              <div className="space-y-1.5">
                <div className="h-14 rounded-2xl bg-rose-600 shadow-inner flex items-end p-2 text-white font-mono font-bold text-[11px]">
                  #E11D48
                </div>
                <span className="font-bold text-slate-900 block">Rose Alerta</span>
                <span className="text-[10px] text-slate-500">Esgotado & Cancelamento</span>
              </div>
            </div>
          </div>

          {/* ================= SECTION 6: CODE TOKENS EXPORT ================= */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Snippet para Desenvolvedores (Tailwind CSS)</h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `<ClinicalButton variant="primary" size="md" icon={<CheckCircle2 className="w-4 h-4" />}>\n  Reservar Medicamento\n</ClinicalButton>`,
                    'btn-snippet'
                  )
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
              >
                {copiedToken === 'btn-snippet' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Snippet</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
              <code>{`// Exemplo de uso do botão com alvo de toque Android (>= 48px)
import { ClinicalButton, AvailabilityBadge, PriceDisplay } from '../components/ClinicalPrecision';

<ClinicalButton 
  variant="primary" 
  size="md" 
  icon={<Pill className="w-4 h-4" />}
  onClick={handleReserve}
>
  Reservar no Balcão
</ClinicalButton>

<AvailabilityBadge status="available" size="sm" />
<PriceDisplay amount={450.00} size="lg" />`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
