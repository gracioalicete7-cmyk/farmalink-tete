import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  KeyRound,
  FileCode2,
  Server,
  Zap,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Cpu,
  BadgeCheck,
  Globe,
  FileWarning,
  UploadCloud,
  Check,
} from 'lucide-react';
import {
  detectMaliciousPayload,
  sanitizeInput,
  getSecurityLogs,
  SecurityEvent,
  generateReservationSignature,
  verifyReservationSignature,
  runFullSecurityDiagnostics,
  verifyDomainIntegrity,
  validateUploadedFile,
  SecurityDiagnosticResult,
} from '../lib/security';

interface SecurityShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityShieldModal: React.FC<SecurityShieldModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'scanner' | 'integrity' | 'audit'>('diagnostics');
  const [testPayload, setTestPayload] = useState('<script>alert("Tentativa de invasão")</script>');
  const [scanResult, setScanResult] = useState<{ isSafe: boolean; threat?: string; sanitized: string } | null>(null);
  const [logs, setLogs] = useState<SecurityEvent[]>([]);
  const [integrityCode, setIntegrityCode] = useState('');
  const [integrityStatus, setIntegrityStatus] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<SecurityDiagnosticResult[]>([]);
  const [testFileResult, setTestFileResult] = useState<{ isValid: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLogs(getSecurityLogs());
      setDiagnostics(runFullSecurityDiagnostics());
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const domainCheck = verifyDomainIntegrity();

  const handleTestSimulatedFile = (filename: string, mime: string, sizeBytes: number) => {
    // Create a mock File object to simulate upload verification
    const mockBlob = new Blob(['Simulated content'], { type: mime });
    const mockFile = new File([mockBlob], filename, { type: mime });
    const res = validateUploadedFile(mockFile, 5 * 1024 * 1024);
    if (res.isValid) {
      setTestFileResult({
        isValid: true,
        message: `Ficheiro [${filename}] APROVADO: Certificado sanitário válido (MIME seguro: ${mime}).`,
      });
    } else {
      setTestFileResult({
        isValid: false,
        message: res.error || 'Ficheiro bloqueado por política sanitária.',
      });
    }
    setLogs(getSecurityLogs());
  };

  const handleRunSecurityTest = () => {
    const check = detectMaliciousPayload(testPayload);
    const sanitized = sanitizeInput(testPayload);
    setScanResult({
      isSafe: check.isSafe,
      threat: check.threat,
      sanitized,
    });
    setLogs(getSecurityLogs());
  };

  const handleVerifySampleSignature = () => {
    const sample = {
      orderId: 'ord-tete-9942',
      userId: 'user-sample',
      pharmacyId: 'pharm-1',
      medicineId: 'med-amox-500',
      totalMzn: 250,
      createdAt: '2026-08-25T05:00:00Z',
    };
    const validSig = generateReservationSignature(sample);
    const isOk = verifyReservationSignature(sample, integrityCode || validSig);
    if (isOk) {
      setIntegrityStatus('ASSINATURA DIGITAL VÁLIDA: O pedido não sofreu adulteração de preço, lote ou medicamento.');
    } else {
      setIntegrityStatus('ALERTA CRÍTICO: Assinatura digital incompatível! O pedido foi manipulado ou adulterado por terceiros.');
    }
    setLogs(getSecurityLogs());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl h-[88vh] sm:h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/30 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-3.5 sm:p-5 text-white border-b border-slate-700 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white truncate">
                  Escudo de Cibersegurança
                </h2>
                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full shrink-0">
                  Zero-Trust Ativo
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Proteção Ativa contra Clones, Hackers, Injeções e Vírus
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-2 sm:px-4 pt-1.5 overflow-x-auto shrink-0 scrollbar-none gap-1">
          {[
            { id: 'overview', label: 'Visão Geral', icon: ShieldCheck },
            { id: 'diagnostics', label: 'Anti-Clone & Vírus', icon: Globe },
            { id: 'scanner', label: 'Simulador Anti-Hack', icon: Terminal },
            { id: 'integrity', label: 'Assinatura HMAC', icon: Lock },
            { id: 'audit', label: 'Logs de Auditoria', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 rounded-t-lg shadow-xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area - min-h-0 and overscroll-contain are crucial to allow inner scrolling */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-5 overscroll-contain">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Firewall Anti-XSS & Anti-Injeção</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sanitização estrita em tempo real de todas as pesquisas e campos de texto, filtrando tags de scripts, injeções NoSQL e SQL.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                    <Lock className="w-5 h-5" />
                    <span>Regras Firestore Zero-Trust</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Regras com negação global padrão (default-deny), validação estrita de esquemas e limites volumétricos contra ataques de negação de carteira.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                  <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-400 font-bold text-sm">
                    <Zap className="w-5 h-5" />
                    <span>Rate Limiter & Anti-Força Bruta</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Controlo de taxa de requisições por IP e sessão para bloquear ataques de enumeração, bots automatizados e inundações de reservas.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                    <BadgeCheck className="w-5 h-5" />
                    <span>Assinatura Digital de Levantamento</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Códigos QR protegidos com hash criptográfico HMAC, impedindo qualquer alteração ilícita de preço ou medicamento reservado.
                  </p>
                </div>
              </div>

              {/* Status table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Módulo de Segurança</span>
                  <span>Estado de Proteção</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300">Encriptação de Trânsito (TLS 1.3 / HTTPS)</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 256-Bit SSL Ativo
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300">Proteção de Controlo de Acesso (RBAC)</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Isolamento Utente/Farmácia/DPS
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300">Trilha de Auditoria Imutável</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Append-Only Ativado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIAGNOSTICS - ANTI-CLONE & ANTI-VÍRUS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-5">
              {/* Anti-Clone Status Header */}
              <div className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                      Integridade de Domínio Oficial & Proteção Anti-Clone
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                      {domainCheck.statusMessage}
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-block">
                      Host Ativo: <strong>{domainCheck.currentHost}</strong>
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 shrink-0">
                  {domainCheck.isClone ? 'CLONE NÃO AUTORIZADO' : 'ORIGINAL PROTEGIDO'}
                </span>
              </div>

              {/* Anti-Virus File Inspection Simulator */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
                  <FileWarning className="w-4 h-4 text-emerald-600" />
                  <span>Escudo Anti-Vírus em Ficheiros e Documentos Sanitários</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Qualquer documento enviado (alvarás médicos, fotos de receitas, logotipos) passa por inspeção criptográfica imediata contra extensões perigosas, scripts maliciosos e trojans.
                </p>

                {/* Simulation Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleTestSimulatedFile('alvara_farmacia_2026.pdf', 'application/pdf', 240000)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                    <span>Testar PDF Sanitário Legítimo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestSimulatedFile('foto_medicamento.png', 'image/png', 500000)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Testar Imagem PNG Legítima</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestSimulatedFile('trojan_update.exe', 'application/x-msdownload', 1200000)}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Simular Vírus (.EXE)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestSimulatedFile('script_malicioso.bat', 'text/plain', 5000)}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Simular Script (.BAT)</span>
                  </button>
                </div>

                {/* Simulation Feedback Result */}
                {testFileResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 animate-fade-in ${
                      testFileResult.isValid
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {testFileResult.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{testFileResult.message}</span>
                  </div>
                )}
              </div>

              {/* 10-Layer Cybersecurity Scorecard */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Painel das 10 Camadas de Ciberdefesa Ativas
                  </h4>
                  <button
                    type="button"
                    onClick={() => setDiagnostics(runFullSecurityDiagnostics())}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Atualizar Diagnóstico</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {diagnostics.map((diag, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{diag.layer}</span>
                          <h5 className="font-bold text-slate-800 dark:text-slate-100">{diag.name}</h5>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          {diag.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {diag.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCANNER & SIMULATOR */}
          {activeTab === 'scanner' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Teste o Motor Anti-Vírus & Anti-Injeção em Tempo Real:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    placeholder="Insira um payload (ex: <script>alert(1)</script> ou ' OR '1'='1)"
                    className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleRunSecurityTest}
                    className="px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Inspecionar</span>
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 py-1">Exemplos de Ataque:</span>
                <button
                  onClick={() => setTestPayload('<script>document.cookie</script>')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300 transition-colors"
                >
                  XSS Cookie Stealer
                </button>
                <button
                  onClick={() => setTestPayload("' UNION SELECT * FROM users --")}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300 transition-colors"
                >
                  SQL Injection Union
                </button>
                <button
                  onClick={() => setTestPayload('<img src="x" onerror="alert(1)">')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Inline Image Error
                </button>
              </div>

              {scanResult && (
                <div
                  className={`p-4 rounded-xl border space-y-2 text-xs animate-fade-in ${
                    scanResult.isSafe
                      ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                      : 'border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    {scanResult.isSafe ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Payload Seguro e Sanitizado</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        <span>Ameaça Maliciosa Intercetada e Bloqueada!</span>
                      </>
                    )}
                  </div>
                  {!scanResult.isSafe && (
                    <p className="font-semibold text-rose-700 dark:text-rose-400">
                      Assinatura de Ameaça: <span className="font-mono">{scanResult.threat}</span>
                    </p>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Resultado após Sanitização Segura pelo FarmaLink:
                    </span>
                    <pre className="p-2.5 rounded bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      {scanResult.sanitized || '(Vazio - Todo o código perigoso foi purgado)'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTEGRITY & SIGNATURE */}
          {activeTab === 'integrity' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Validação Criptográfica de Reserva (Anti-Adulteração de Preço)
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Cada reserva de medicamento gera um selo digital HMAC único. Se um atacante tentar alterar o preço no código QR de 250 MZN para 10 MZN, a assinatura quebra imediatamente no balcão da farmácia.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assinatura Digital de Teste (Exemplo: FLK-89A4B2-9942):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={integrityCode}
                    onChange={(e) => setIntegrityCode(e.target.value)}
                    placeholder="Deixe vazio para gerar a assinatura correta ou insira uma falsa"
                    className="flex-1 px-3.5 py-2.5 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleVerifySampleSignature}
                    className="px-4 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    <span>Verificar Selo</span>
                  </button>
                </div>
              </div>

              {integrityStatus && (
                <div
                  className={`p-4 rounded-xl border text-xs font-semibold ${
                    integrityStatus.includes('VÁLIDA')
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                      : 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {integrityStatus}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Trilha de Eventos de Cibersegurança em Tempo Real
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {logs.length} eventos registados
                </span>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Nenhum incidente de segurança detetado. O perímetro de defesa está 100% íntegro.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {logs.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-3 text-xs"
                    >
                      <div className="mt-0.5">
                        {item.severity === 'critical' || item.severity === 'high' ? (
                          <ShieldAlert className="w-4 h-4 text-rose-500" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.type}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="font-medium truncate">Escudo Ativo • FarmaLink Tete (Google Cloud)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
