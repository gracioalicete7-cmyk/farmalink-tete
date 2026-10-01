import React, { useState } from 'react';
import { FarmaLinkDB } from '../lib/storage';
import { CloudSync } from '../lib/firestoreSync';
import { auth } from '../lib/firebase';
import { Pharmacy, PharmacyStatus, UserProfile, UserRole } from '../types';
import { FarmaLinkLogo } from '../lib/logo';
import { TETE_BAIRROS } from '../lib/geo';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  User,
  Building2,
  Shield,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  FileCheck,
  MapPin,
  FileText,
  KeyRound,
  Key,
  ShieldCheck,
  HelpCircle,
  X,
} from 'lucide-react';

interface AuthViewProps {
  initialMode?: 'login' | 'register' | 'forgot';
  initialRole?: UserRole;
  onLoginSuccess: (user: UserProfile) => void;
  onNavigate?: (tab: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  initialRole = 'user',
  onLoginSuccess,
  onNavigate,
  onBack,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('+258 84 ');
  const [bairro, setBairro] = useState('Centro da Cidade');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Director Técnico Fields
  const [numeroProfissional, setNumeroProfissional] = useState('');
  const [farmaciaNome, setFarmaciaNome] = useState('');
  const [alvaraSanitario, setAlvaraSanitario] = useState('');

  // Pharmacy Direct Access Code Fields (Director / Owner)
  const [directorLoginMode, setDirectorLoginMode] = useState<'email' | 'code'>('email');
  const [pharmacyAccessCode, setPharmacyAccessCode] = useState('');
  const [pharmacyPin, setPharmacyPin] = useState('');

  // Admin DPS Fields
  const [codigoCredencialDps, setCodigoCredencialDps] = useState('');
  const [departamentoDps, setDepartamentoDps] = useState('Inspecção Farmacêutica DPS Tete');

  // UI State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Fraca', color: 'bg-rose-500 text-rose-700' };
    if (score <= 4) return { score: 2, label: 'Média', color: 'bg-amber-500 text-amber-700' };
    return { score: 3, label: 'Forte & Segura', color: 'bg-emerald-500 text-emerald-700' };
  };

  const passStrength = getPasswordStrength(password);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const cleanEmail = email.trim().toLowerCase();
      const users = FarmaLinkDB.getUsers();
      let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        // Create user matching selected role or email heuristics
        const generatedId = `usr-${Date.now().toString().slice(-6)}`;
        const inferredRole: UserRole =
          cleanEmail.includes('admin') || cleanEmail.includes('dps')
            ? 'admin'
            : cleanEmail.includes('director') || cleanEmail.includes('farmacia')
            ? 'director'
            : selectedRole;

        user = {
          id: `prof-${generatedId}`,
          user_id: generatedId,
          nome: nome.trim() || (cleanEmail.split('@')[0] ? cleanEmail.split('@')[0].toUpperCase() : 'Utilizador FarmaLink'),
          email: cleanEmail,
          telefone: telefone.trim() || '+258 84 100 2000',
          role: inferredRole,
          bairro: bairro,
          status: 'active',
          numero_profissional: inferredRole === 'director' ? 'OFM-MZ/2023-889' : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        FarmaLinkDB.saveProfile(user);
      }

      onLoginSuccess(user);
      if (onNavigate) {
        if (user.role === 'admin' || user.role === 'superadmin') {
          onNavigate('admin-portal');
        } else if (user.role === 'director') {
          onNavigate('director-portal', { tab: 'dashboard' });
        } else {
          onNavigate('home');
        }
      }
    }, 400);
  };

  const handlePharmacyCodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanCode = pharmacyAccessCode.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMsg('Por favor insira o Código de Acesso da Farmácia (ex: MAIS-SAUDE, CENTRAL-TETE).');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const pharm = FarmaLinkDB.getPharmacyByAccessCode(cleanCode);
      if (!pharm) {
        setErrorMsg(`Nenhuma farmácia encontrada com o código de acesso "${cleanCode}". Verifique a digitação ou cadastre a sua farmácia.`);
        return;
      }

      // Check PIN if configured on pharmacy
      if (pharm.pin && pharmacyPin.trim() && pharm.pin.trim() !== pharmacyPin.trim()) {
        setErrorMsg('PIN de segurança incorreto para esta farmácia.');
        return;
      }

      // Find or create director profile for this pharmacy
      const users = FarmaLinkDB.getUsers();
      let directorUser = users.find((u) => u.user_id === pharm.director_id || (u.role === 'director' && u.nome.toLowerCase() === pharm.director_name.toLowerCase()));

      if (!directorUser) {
        const generatedId = pharm.director_id || `dir-${Date.now().toString().slice(-6)}`;
        directorUser = {
          id: `prof-${generatedId}`,
          user_id: generatedId,
          nome: pharm.director_name || `Director ${pharm.nome}`,
          email: pharm.email || `director@${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.mz`,
          telefone: pharm.telefone || '+258 84 000 0000',
          role: 'director',
          bairro: pharm.bairro,
          status: 'active',
          numero_profissional: 'OFM-MZ/2023-DIR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        FarmaLinkDB.saveProfile(directorUser);
      }

      // If pharmacy director_id is not set to this user, update it
      if (pharm.director_id !== directorUser.user_id) {
        pharm.director_id = directorUser.user_id;
        FarmaLinkDB.savePharmacy(pharm, directorUser);
      }

      onLoginSuccess(directorUser);
      if (onNavigate) {
        onNavigate('director-portal', { tab: 'dashboard', pharmacyId: pharm.id });
      }
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim()) {
      setErrorMsg('Por favor insira o nome completo.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Por favor insira um endereço de email válido.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (selectedRole === 'director') {
      if (!numeroProfissional.trim()) {
        setErrorMsg('É obrigatório indicar a Carteira Profissional (OFM / DPS).');
        return;
      }
      if (!farmaciaNome.trim()) {
        setErrorMsg('É obrigatório indicar o nome da Farmácia que representa.');
        return;
      }
    }

    if (selectedRole === 'admin') {
      if (!codigoCredencialDps.trim()) {
        setErrorMsg('É obrigatório indicar o Código de Credencial DPS Tete (ex: DPS-TETE-2026).');
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const generatedId = `usr-${Date.now().toString().slice(-6)}`;
      const newUser: UserProfile = {
        id: `prof-${generatedId}`,
        user_id: generatedId,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        role: selectedRole,
        bairro: bairro,
        status: 'active',
        numero_profissional: selectedRole === 'director' ? numeroProfissional.trim() : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // If registered as Director with a Pharmacy Name, immediately register the Pharmacy with exact phone
      if (selectedRole === 'director' && farmaciaNome.trim()) {
        const pharmId = `pharm-${Date.now().toString().slice(-6)}`;
        const codePrefix = farmaciaNome.split(' ')[0]?.toUpperCase().replace(/[^A-Z]/g, '') || 'FARMA';
        const accessCode = `${codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

        newUser.pharmacy_id = pharmId;

        const newPharmacy: Pharmacy = {
          id: pharmId,
          nome: farmaciaNome.trim(),
          nuit: `400${Math.floor(100000 + Math.random() * 900000)}`,
          license_number: alvaraSanitario.trim() || `MS/DISP/TETE/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`,
          director_id: generatedId,
          director_name: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim().toLowerCase(),
          endereco: `Avenida Principal de ${bairro}, Tete`,
          bairro: bairro,
          cidade: 'Cidade de Tete',
          provincia: 'Tete',
          latitude: -16.1564,
          longitude: 33.5862,
          horario: '08:00 - 20:00',
          dias_funcionamento: 'Segunda a Sábado',
          descricao: `Farmácia comunitária sob Direcção Técnica de ${nome.trim()} no Bairro ${bairro}.`,
          motivacao_cadastro: 'Disponibilização de medicamentos essenciais e atendimento farmacêutico na Cidade de Tete.',
          logo_url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=200&auto=format&fit=crop&q=80',
          access_code: accessCode,
          pin: '2026',
          status: 'Pendente',
          is_verified: false,
          auto_approved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          localStorage.setItem('farmalink_last_active_pharmacy_id', pharmId);
        } catch {}

        FarmaLinkDB.savePharmacy(newPharmacy, newUser);
        CloudSync.syncPharmacy(newPharmacy);
        FarmaLinkDB.saveProfile(newUser);
        CloudSync.syncProfile(newUser);

        // Notify Administrator for audit and approval in Admin Portal
        FarmaLinkDB.addNotification({
          user_id: 'admin-1',
          titulo: `Novo Pedido de Cadastro: ${farmaciaNome.trim()}`,
          mensagem: `A farmácia "${farmaciaNome.trim()}" (${bairro}) foi registada pelo Director Técnico Dr. ${nome.trim()} e aguarda homologação no Painel do Administrador.`,
          tipo: 'pharmacy_approval',
        });
      } else {
        FarmaLinkDB.saveProfile(newUser);
      }

      onLoginSuccess(newUser);

      if (onNavigate) {
        if (selectedRole === 'admin') {
          onNavigate('admin-portal');
        } else if (selectedRole === 'director') {
          onNavigate('director-portal', { tab: 'dashboard', pharmacyId: newUser.pharmacy_id });
        } else {
          onNavigate('home');
        }
      }
    }, 500);
  };

  const handleQuickLogin = (role: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const users = FarmaLinkDB.getUsers();
      let target = users.find((u) => u.role === role);

      if (!target) {
        target = {
          id: `prof-demo-${role}`,
          user_id: `demo-${role}`,
          nome:
            role === 'director'
              ? 'Dr. Mário Cossa (Director Técnico)'
              : role === 'admin'
              ? 'Grácio Hortêncio César (Administrador Geral)'
              : 'Amélia Tembe (Cidadã de Tete)',
          email: role === 'admin' ? 'gracioalicete7@gmail.com' : `${role}@farmalink.co.mz`,
          telefone: '+258 84 123 4567',
          role: role,
          bairro: role === 'director' ? 'Chingodzi' : 'Centro da Cidade',
          status: 'active',
          numero_profissional: role === 'director' ? 'OFM-MZ/2021-440' : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        FarmaLinkDB.saveProfile(target);
      }

      onLoginSuccess(target);
      if (onNavigate) {
        if (role === 'admin') {
          onNavigate('admin-portal');
        } else if (role === 'director') {
          onNavigate('director-portal', { tab: 'dashboard' });
        } else {
          onNavigate('home');
        }
      }
    }, 300);
  };

  // Role info definitions for distinction
  const roleCards = [
    {
      id: 'user' as UserRole,
      title: 'Utente / Cidadão',
      badge: 'Pacientes e Famílias',
      desc: 'Pesquise remédios, consulte preços em Meticais, localize farmácias 24h e faça reservas com levantamento no balcão.',
      color: 'emerald',
      icon: User,
      activeClass: 'bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-lg border-emerald-500',
      inactiveClass: 'bg-white hover:bg-emerald-50/60 text-slate-700 border-slate-200 hover:border-emerald-300',
      requirements: ['Telefone Moçambicano (+258)', 'Bairro de residência em Tete', 'Email para confirmações'],
    },
    {
      id: 'director' as UserRole,
      title: 'Director Técnico',
      badge: 'Farmacêuticos & Gestores',
      desc: 'Gestão de estoque da farmácia, atualização de preços, validação de reservas de medicamentos e credenciamento sanitário DPS.',
      color: 'teal',
      icon: Building2,
      activeClass: 'bg-teal-700 text-white ring-4 ring-teal-500/20 shadow-lg border-teal-600',
      inactiveClass: 'bg-white hover:bg-teal-50/60 text-slate-700 border-slate-200 hover:border-teal-300',
      requirements: ['Carteira Profissional OFM / DPS', 'Alvará Sanitário da Farmácia', 'Email Profissional'],
    },
    {
      id: 'admin' as UserRole,
      title: 'Administrador Geral',
      badge: 'Gestor da Plataforma',
      desc: 'Gestão integral da rede FarmaLink Tete, homologação de farmácias, controlo do catálogo geral e auditoria de utilizadores.',
      color: 'blue',
      icon: Shield,
      activeClass: 'bg-blue-700 text-white ring-4 ring-blue-500/20 shadow-lg border-blue-600',
      inactiveClass: 'bg-white hover:bg-blue-50/60 text-slate-700 border-slate-200 hover:border-blue-300',
      requirements: ['Conta de Administrador Geral', 'Gestor da Plataforma', 'Auditoria Ativa'],
    },
  ];

  return (
    <div id="auth-page-container" className="max-w-5xl mx-auto py-2 sm:py-4 space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title="Autenticação e Acesso Seguro"
          subtitle="FarmaLink Tete • Portal de Gestão e Acesso"
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
          rightAction={
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                id="auth-toggle-login-tab"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Iniciar Sessão
              </button>
              <button
                type="button"
                id="auth-toggle-register-tab"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Criar Conta
              </button>
            </div>
          }
        />
      )}

      {/* Top Banner Navigation if no onBack */}
      {!onBack && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Já tem perfil ativo?</span>
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                id="auth-toggle-login-tab-fallback"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Iniciar Sessão
              </button>
              <button
                type="button"
                id="auth-toggle-register-tab-fallback"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Criar Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header / Branding */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Botão de Fechar e Sair do Painel de Bem-vindo */}
        <button
          type="button"
          id="auth-welcome-close-btn"
          onClick={() => onNavigate?.('home')}
          aria-label="Fechar painel e Sair"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/20 hover:bg-rose-600 text-white border border-white/30 hover:border-rose-400 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer group"
          title="Fechar painel e voltar ao início (Sair)"
        >
          <span className="text-xs font-bold text-white tracking-wide">Sair</span>
          <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white font-black stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
          </div>
        </button>

        <div className="max-w-2xl space-y-2 relative z-10 pr-12 sm:pr-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bem-vindo a FarmaLink Tete</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            {mode === 'login' ? 'Bem-vindo a FarmaLink Tete • Inicie a sua Sessão' : 'Registo Oficial com Perfil Distinto'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Plataforma Integrada de Gestão Farmacêutica da Província de Tete. Selecione o seu tipo de
            utilizador para aceder às funcionalidades específicas do seu perfil.
          </p>
        </div>

        {/* Quick Demo Launchers Bar */}
        <div className="mt-6 pt-4 border-t border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 text-xs">
          <span className="font-bold text-emerald-200 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Acesso Rápido para Demonstração:</span>
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="demo-login-utente"
              onClick={() => handleQuickLogin('user')}
              className="px-3 py-1.5 bg-white/10 hover:bg-emerald-500 text-white rounded-xl font-bold border border-white/20 transition-all text-center hover:scale-105 active:scale-95 shadow-2xs"
            >
              Demo Utente
            </button>
            <button
              type="button"
              id="demo-login-director"
              onClick={() => handleQuickLogin('director')}
              className="px-3 py-1.5 bg-white/10 hover:bg-teal-500 text-white rounded-xl font-bold border border-white/20 transition-all text-center hover:scale-105 active:scale-95 shadow-2xs"
            >
              Demo Director
            </button>
            <button
              type="button"
              id="demo-login-admin"
              onClick={() => handleQuickLogin('admin')}
              className="px-3 py-1.5 bg-white/10 hover:bg-blue-500 text-white rounded-xl font-bold border border-white/20 transition-all text-center hover:scale-105 active:scale-95 shadow-2xs"
            >
              Demo Admin Geral
            </button>
          </div>
        </div>
      </div>

      {/* Role Selector Tabs (Clear Distinction) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>1. Escolha o seu Perfil de Utilizador</span>
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            Define as permissões, formulários e painéis disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roleCards.map((rc) => {
            const Icon = rc.icon;
            const isSelected = selectedRole === rc.id;

            return (
              <div
                key={rc.id}
                id={`role-select-card-${rc.id}`}
                onClick={() => {
                  setSelectedRole(rc.id);
                  setErrorMsg(null);
                }}
                className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
                  isSelected ? rc.activeClass : rc.inactiveClass
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {rc.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold flex items-center gap-1.5">
                    <span>{rc.title}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </h3>
                  <p
                    className={`text-xs mt-1.5 leading-relaxed ${
                      isSelected ? 'text-white/90' : 'text-slate-500'
                    }`}
                  >
                    {rc.desc}
                  </p>
                </div>

                <div
                  className={`mt-4 pt-3 border-t text-[11px] font-medium space-y-1 ${
                    isSelected ? 'border-white/20 text-white/80' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-[10px] uppercase tracking-wider block">
                    Requisitos do Perfil:
                  </span>
                  {rc.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                selectedRole === 'admin'
                  ? 'bg-blue-600'
                  : selectedRole === 'director'
                  ? 'bg-teal-600'
                  : 'bg-emerald-600'
              }`}
            ></div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {mode === 'login'
                ? `Iniciar Sessão como ${
                    selectedRole === 'admin'
                      ? 'Administrador Geral / Gestor'
                      : selectedRole === 'director'
                      ? 'Director Técnico'
                      : 'Utente / Cidadão'
                  }`
                : `Registar Nova Conta de ${
                    selectedRole === 'admin'
                      ? 'Administrador Geral / Gestor'
                      : selectedRole === 'director'
                      ? 'Director Técnico de Farmácia'
                      : 'Utente / Cidadão de Tete'
                  }`}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
            {mode === 'login' ? 'Autenticação' : 'Credenciamento'}
          </span>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Atenção no Preenchimento:</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm rounded-2xl flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Sucesso!</strong>
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* ======================= LOGIN FORM ======================= */}
        {mode === 'login' && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* If Director role selected, allow toggle between Email and Direct Access Code */}
            {selectedRole === 'director' && (
              <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setDirectorLoginMode('email')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    directorLoginMode === 'email'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email & Senha</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectorLoginMode('code')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    directorLoginMode === 'code'
                      ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-slate-950" />
                  <span>Entrar com Código da Farmácia</span>
                </button>
              </div>
            )}

            {/* Standard Email/Password Form */}
            {(selectedRole !== 'director' || directorLoginMode === 'email') && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Email de Acesso {selectedRole === 'admin' ? 'Institucional' : ''} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          selectedRole === 'admin'
                            ? 'inspetor.dps@saude.gov.mz'
                            : selectedRole === 'director'
                            ? 'director@farmaciacentral.co.mz'
                            : 'seu.email@exemplo.co.mz'
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700">Senha de Acesso *</label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-emerald-700 hover:text-emerald-800 text-xs font-bold hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Insira a sua senha"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Specific Login Tip */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Ambiente de acesso seguro para:{' '}
                      <strong className="text-slate-800 font-bold">
                        {selectedRole === 'admin'
                          ? 'Homologação e Inspecção DPS'
                          : selectedRole === 'director'
                          ? 'Gestão de Estoque e Alvarás'
                          : 'Consultas e Reservas de Farmácia'}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Tete / Moçambique
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={loading}
                  className={`w-full py-3 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                    selectedRole === 'admin'
                      ? 'bg-blue-700 hover:bg-blue-800 shadow-blue-900/20'
                      : selectedRole === 'director'
                      ? 'bg-teal-700 hover:bg-teal-800 shadow-teal-900/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                  }`}
                >
                  {loading ? (
                    <span>A autenticar...</span>
                  ) : (
                    <>
                      <span>Entrar no FarmaLink Tete</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Direct Pharmacy Access Code Form */}
            {selectedRole === 'director' && directorLoginMode === 'code' && (
              <form onSubmit={handlePharmacyCodeLogin} className="space-y-4 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">Entrada Direta por Código da Farmácia</h3>
                    <p className="text-[11px] text-slate-300">
                      Ideal para o Director Técnico ou farmacêutico autorizado aceder ao estoque no telemóvel.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-200 mb-1">
                      Código de Acesso da Farmácia *
                    </label>
                    <input
                      type="text"
                      required
                      value={pharmacyAccessCode}
                      onChange={(e) => setPharmacyAccessCode(e.target.value.toUpperCase())}
                      placeholder="Ex: MAIS-SAUDE, CENTRAL-TETE"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-mono font-bold text-amber-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Código configurado no painel da sua farmácia.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-200 mb-1">
                      PIN Numérico (Opcional)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pharmacyPin}
                      onChange={(e) => setPharmacyPin(e.target.value)}
                      placeholder="Ex: 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-mono font-bold text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Deixe vazio se sua farmácia não usa PIN.
                    </span>
                  </div>
                </div>

                {/* Quick test buttons */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
                    Testar com farmácias reais de Tete:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPharmacyAccessCode('MAIS-SAUDE');
                        setPharmacyPin('2026');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-lg font-mono text-[11px] font-bold"
                    >
                      MAIS-SAUDE (PIN 2026)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPharmacyAccessCode('CENTRAL-TETE');
                        setPharmacyPin('2026');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-lg font-mono text-[11px] font-bold"
                    >
                      CENTRAL-TETE (PIN 2026)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>A validar código...</span>
                  ) : (
                    <>
                      <span>Acessar Painel do Director Técnico</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Link to Register */}
            <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
              Ainda não possui credenciais cadastradas?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className="font-bold text-emerald-700 hover:underline ml-1"
              >
                Registar Nova Conta como {roleCards.find((r) => r.id === selectedRole)?.title}
              </button>
            </div>
          </div>
        )}

        {/* ======================= REGISTER FORM ======================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {selectedRole === 'director'
                    ? 'Nome Completo do Director Técnico *'
                    : selectedRole === 'admin'
                    ? 'Nome Completo do Oficial / Inspetor *'
                    : 'Nome Completo do Cidadão / Utente *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder={
                      selectedRole === 'director'
                        ? 'Ex: Dr. Mário Cossa'
                        : selectedRole === 'admin'
                        ? 'Ex: Dra. Graça Nhantumbo'
                        : 'Ex: Amélia Tembe'
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Email {selectedRole === 'admin' ? 'Institucional' : ''} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.co.mz"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Telefone Moçambique */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Telefone de Contacto (Moçambique) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+258 84 123 4567"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Usado para confirmações de reserva e alertas via SMS / WhatsApp
                </span>
              </div>

              {/* Bairro / Localização */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {selectedRole === 'director' ? 'Bairro da Farmácia em Tete *' : 'Bairro de Residência em Tete *'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <select
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                  >
                    {TETE_BAIRROS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ================= ROLE-SPECIFIC FIELDS ================= */}
              {/* Director Técnico Specific Fields */}
              {selectedRole === 'director' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Carteira Profissional (OFM / DPS Tete) *
                    </label>
                    <div className="relative">
                      <Award className="w-4 h-4 text-teal-600 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={numeroProfissional}
                        onChange={(e) => setNumeroProfissional(e.target.value)}
                        placeholder="Ex: OFM-MZ/2023-580"
                        className="w-full pl-10 pr-4 py-2.5 bg-teal-50/40 border border-teal-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Nome da Farmácia Vinculada *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-teal-600 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={farmaciaNome}
                        onChange={(e) => setFarmaciaNome(e.target.value)}
                        placeholder="Ex: Farmácia Central de Tete"
                        className="w-full pl-10 pr-4 py-2.5 bg-teal-50/40 border border-teal-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Administrador DPS Specific Fields */}
              {selectedRole === 'admin' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Código de Credencial Administrativa DPS Tete *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={codigoCredencialDps}
                        onChange={(e) => setCodigoCredencialDps(e.target.value)}
                        placeholder="Ex: DPS-TETE-2026"
                        className="w-full pl-10 pr-4 py-2.5 bg-blue-50/40 border border-blue-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Departamento / Secção DPS *
                    </label>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={departamentoDps}
                        onChange={(e) => setDepartamentoDps(e.target.value)}
                        placeholder="Inspecção e Homologação Farmacêutica"
                        className="w-full pl-10 pr-4 py-2.5 bg-blue-50/40 border border-blue-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Senha de Acesso *</label>
                  {password && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${passStrength.color}`}>
                      Força da Senha: {passStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres (letras, números e símbolos)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms Acceptance */}
            <div className="pt-2 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="accept-terms-check"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                required
              />
              <label htmlFor="accept-terms-check" className="text-xs text-slate-600">
                Concordo com os{' '}
                <button
                  type="button"
                  onClick={() => onNavigate?.('terms')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Termos e Políticas Sanitárias da DPS Tete
                </button>{' '}
                e autorizo o tratamento dos dados para fins farmacêuticos em Moçambique.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-submit-register"
              disabled={loading || !termsAccepted}
              className={`w-full py-3 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                selectedRole === 'admin'
                  ? 'bg-blue-700 hover:bg-blue-800 shadow-blue-900/20'
                  : selectedRole === 'director'
                  ? 'bg-teal-700 hover:bg-teal-800 shadow-teal-900/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
              }`}
            >
              {loading ? (
                <span>A criar conta...</span>
              ) : (
                <>
                  <span>Concluir Registo de {roleCards.find((r) => r.id === selectedRole)?.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Link to Login */}
            <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
              Já possui conta cadastrada?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="font-bold text-emerald-700 hover:underline ml-1"
              >
                Iniciar Sessão
              </button>
            </div>
          </form>
        )}

        {/* ======================= FORGOT PASSWORD ======================= */}
        {mode === 'forgot' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSuccessMsg(`Código de recuperação e instruções enviadas para ${email}`);
              setTimeout(() => setMode('login'), 2500);
            }}
            className="space-y-4 text-xs sm:text-sm max-w-md mx-auto py-2"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Recuperação de Senha</h3>
              <p className="text-xs text-slate-500">
                Insira o seu email cadastrado para receber o link de redefinição de acesso.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Email Cadastrado *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@farmalink.co.mz"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all"
            >
              Enviar Instruções de Recuperação
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full py-2 text-slate-600 font-bold hover:underline text-center block text-xs"
            >
              Voltar ao Início de Sessão
            </button>
          </form>
        )}
      </div>

      {/* Safety & DPS Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>FarmaLink Tete cumpre com as directrizes farmacêuticas e regulamentação sanitária de Moçambique.</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('terms')}
          className="font-bold text-emerald-700 hover:underline shrink-0"
        >
          Ver Regulamento Sanitário DPS
        </button>
      </div>
    </div>
  );
};
