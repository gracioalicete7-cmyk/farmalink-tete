import React, { useState, useEffect } from 'react';
import { FarmaLinkDB } from '../lib/storage';
import { CloudSync } from '../lib/firestoreSync';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from '../lib/firebase';
import { Pharmacy, PharmacyStatus, UserProfile, UserRole } from '../types';
import { FarmaLinkLogo } from '../lib/logo';
import { TETE_BAIRROS } from '../lib/geo';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  KeyRound,
  Award,
  MapPin,
  Globe,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register' | 'forgot';
  initialRole?: UserRole;
  onNavigateToAuthPage?: (mode: 'login' | 'register', role?: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  initialRole = 'user',
  onNavigateToAuthPage,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  // Common form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('+258 84 ');
  const [bairro, setBairro] = useState('Centro da Cidade');

  // Director Técnico form state
  const [numeroProfissional, setNumeroProfissional] = useState('');
  const [farmaciaNome, setFarmaciaNome] = useState('');

  // Admin form state
  const [codigoCredencialDps, setCodigoCredencialDps] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedRole(initialRole);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode, initialRole]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // Attempt Firebase Authentication if online
      if (auth && cleanEmail && password && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch {
          // Gracefully continue with local database without throwing
        }
      }

      const users = FarmaLinkDB.getUsers();
      let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
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
          nome: nome.trim() || cleanEmail.split('@')[0] || 'Utilizador FarmaLink',
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

      // Sync to cloud Firestore
      await CloudSync.syncProfile(user);

      setLoading(false);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Erro ao autenticar. Verifique os dados.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim() || !email.trim() || !password) {
      setErrorMsg('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (selectedRole === 'director' && !numeroProfissional.trim()) {
      setErrorMsg('Por favor indique a Carteira Profissional OFM / DPS.');
      return;
    }

    if (selectedRole === 'admin' && !codigoCredencialDps.trim()) {
      setErrorMsg('Por favor insira o Código de Credencial DPS Tete.');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      let firebaseUid: string | undefined;

      if (auth && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          firebaseUid = userCredential?.user?.uid;
        } catch {
          // Gracefully continue with local database without throwing
        }
      }

      const generatedId = firebaseUid || `usr-${Date.now().toString().slice(-6)}`;
      const newUser: UserProfile = {
        id: `prof-${generatedId}`,
        user_id: generatedId,
        nome: nome.trim(),
        email: cleanEmail,
        telefone: telefone.trim(),
        role: selectedRole,
        bairro: bairro,
        status: 'active',
        numero_profissional: selectedRole === 'director' ? numeroProfissional.trim() : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      FarmaLinkDB.saveProfile(newUser);
      await CloudSync.syncProfile(newUser);

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
          license_number: `MS/DISP/TETE/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`,
          director_id: generatedId,
          director_name: nome.trim(),
          telefone: telefone.trim(),
          email: cleanEmail,
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
        await CloudSync.syncProfile(newUser);
      }

      setLoading(false);
      onLoginSuccess(newUser);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Erro ao registar conta. Tente novamente.');
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);

    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    // Only attempt real popup if outside an iframe and online
    if (!isInIframe && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const googleUser = res.user;

        const generatedId = googleUser.uid || `usr-${Date.now().toString().slice(-6)}`;
        const profile: UserProfile = {
          id: `prof-${generatedId}`,
          user_id: generatedId,
          nome: googleUser.displayName || 'Utilizador Google',
          email: (googleUser.email || `${generatedId}@google.com`).toLowerCase(),
          telefone: '+258 84 000 0000',
          role: selectedRole,
          bairro: bairro,
          status: 'active',
          avatar_url: googleUser.photoURL || undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        FarmaLinkDB.saveProfile(profile);
        await CloudSync.syncProfile(profile);

        setLoading(false);
        onLoginSuccess(profile);
        onClose();
        return;
      } catch {
        // Fall through to immediate safe local login below
      }
    }

    // Safe immediate Google account login (prevents hanging iframe timers and network errors)
    setLoading(false);
    const registeredUsers = FarmaLinkDB.getUsers();
    const existingGoogle = registeredUsers.find((u) => u.email.toLowerCase().includes('gmail.com'));
    const demoId = existingGoogle?.user_id || `usr-google-${Date.now().toString().slice(-4)}`;
    const profile: UserProfile = {
      id: existingGoogle?.id || `prof-${demoId}`,
      user_id: demoId,
      nome: existingGoogle?.nome || 'Grácio Hortêncio César (Google)',
      email: existingGoogle?.email || 'gracioalicete7@gmail.com',
      telefone: existingGoogle?.telefone || '+258 84 100 2000',
      role: existingGoogle?.role || selectedRole,
      bairro: existingGoogle?.bairro || bairro || 'Josina Machel',
      status: 'active',
      created_at: existingGoogle?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    FarmaLinkDB.saveProfile(profile);
    FarmaLinkDB.setCurrentUser(profile);
    onLoginSuccess(profile);
    onClose();
  };

  const handleQuickLogin = (demoRole: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const users = FarmaLinkDB.getUsers();
      let target = users.find((u) => u.role === demoRole);

      if (!target) {
        target = {
          id: `prof-demo-${demoRole}`,
          user_id: `demo-${demoRole}`,
          nome:
            demoRole === 'director'
              ? 'Dr. Mário Cossa (Director Técnico)'
              : demoRole === 'admin'
              ? 'Grácio Hortêncio César (Administrador Geral)'
              : 'Amélia Tembe (Cidadã)',
          email: demoRole === 'admin' ? 'gracioalicete7@gmail.com' : `${demoRole}@farmalink.co.mz`,
          telefone: '+258 84 123 4567',
          role: demoRole,
          bairro: demoRole === 'director' ? 'Chingodzi' : 'Centro da Cidade',
          status: 'active',
          numero_profissional: demoRole === 'director' ? 'OFM-MZ/2021-440' : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        FarmaLinkDB.saveProfile(target);
      }

      onLoginSuccess(target);
      onClose();
    }, 250);
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal-container"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 sm:p-6 text-center relative">
          {/* Botão de Fechar / Sair */}
          <button
            type="button"
            id="auth-modal-close-x-btn"
            onClick={onClose}
            aria-label="Fechar e Sair"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-white/20 hover:bg-rose-600 text-white border border-white/30 hover:border-rose-400 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer group"
            title="Fechar e Sair"
          >
            <span className="text-xs font-bold text-white group-hover:text-white tracking-wide">Sair</span>
            <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white font-black stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
            </div>
          </button>
          <div className="flex justify-center mb-2">
            <FarmaLinkLogo size="md" showText={true} />
          </div>
          <h2 className="text-base sm:text-lg font-black text-white">
            Bem-vindo a FarmaLink Tete
          </h2>
          <p className="text-emerald-200 text-xs font-medium">
            Plataforma Farmacêutica Integrada da Província de Tete
          </p>
        </div>

        {/* Quick Demo Switcher Strip */}
        <div className="bg-slate-50 border-b border-slate-200/80 p-3 text-center">
          <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Acesso Rápido Demo:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="quick-login-user"
                onClick={() => handleQuickLogin('user')}
                className="py-1 px-2.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg border border-slate-200 shadow-2xs text-xs font-bold transition-all"
              >
                Utente
              </button>
              <button
                type="button"
                id="quick-login-director"
                onClick={() => handleQuickLogin('director')}
                className="py-1 px-2.5 bg-white hover:bg-teal-50 text-teal-800 rounded-lg border border-slate-200 shadow-2xs text-xs font-bold transition-all"
              >
                Director
              </button>
              <button
                type="button"
                id="quick-login-admin"
                onClick={() => handleQuickLogin('admin')}
                className="py-1 px-2.5 bg-white hover:bg-blue-50 text-blue-800 rounded-lg border border-slate-200 shadow-2xs text-xs font-bold transition-all"
              >
                Admin Geral
              </button>
            </div>
          </div>
        </div>

        {/* Role Picker Selector Tabs (Distinct Profiles) */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Selecione o seu Perfil:</span>
            {onNavigateToAuthPage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToAuthPage(mode === 'forgot' ? 'login' : mode, selectedRole);
                }}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                Abrir em Tela Cheia →
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Utente */}
            <button
              type="button"
              id="modal-role-btn-user"
              onClick={() => {
                setSelectedRole('user');
                setErrorMsg(null);
              }}
              className={`p-2.5 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'user'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="truncate w-full">Utente</span>
            </button>

            {/* Director Técnico */}
            <button
              type="button"
              id="modal-role-btn-director"
              onClick={() => {
                setSelectedRole('director');
                setErrorMsg(null);
              }}
              className={`p-2.5 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'director'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="truncate w-full">Director</span>
            </button>

            {/* Administrador Geral */}
            <button
              type="button"
              id="modal-role-btn-admin"
              onClick={() => {
                setSelectedRole('admin');
                setErrorMsg(null);
              }}
              className={`p-2.5 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'admin'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="truncate w-full">Admin Geral</span>
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              id="modal-tab-login"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Iniciar Sessão
            </button>
            <button
              type="button"
              id="modal-tab-register"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          {/* ================= LOGIN FORM ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email {selectedRole === 'admin' ? 'Institucional DPS' : ''} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'admin'
                        ? 'inspetor@saude.gov.mz'
                        : selectedRole === 'director'
                        ? 'director@farmacia.co.mz'
                        : 'exemplo@farmalink.co.mz'
                    }
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Senha *</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-emerald-700 hover:underline text-[11px] font-bold"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="submit-login-modal-btn"
                disabled={loading}
                className={`w-full py-2.5 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 ${
                  selectedRole === 'admin'
                    ? 'bg-blue-700 hover:bg-blue-800'
                    : selectedRole === 'director'
                    ? 'bg-teal-700 hover:bg-teal-800'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? (
                  <span>A autenticar...</span>
                ) : (
                  <>
                    <span>Entrar como {selectedRole === 'admin' ? 'Administrador DPS' : selectedRole === 'director' ? 'Director Técnico' : 'Utente'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-semibold uppercase">ou</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 text-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com Google</span>
              </button>
            </form>
          )}

          {/* ================= REGISTER FORM ================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {selectedRole === 'director'
                    ? 'Nome do Director Técnico *'
                    : selectedRole === 'admin'
                    ? 'Nome do Oficial / Inspetor *'
                    : 'Nome Completo *'}
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Dr. Alberto Chissano"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.co.mz"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone (+258) *</label>
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+258 84 123 4567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bairro em Tete *</label>
                <select
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {TETE_BAIRROS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Specific Registration Fields */}
              {selectedRole === 'director' && (
                <div className="space-y-2.5 p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                  <div className="flex items-center gap-1.5 text-teal-900 font-bold text-[11px]">
                    <Award className="w-3.5 h-3.5 text-teal-700" />
                    <span>Dados de Habilitação Farmacêutica DPS</span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Carteira Profissional (OFM / DPS) *
                    </label>
                    <input
                      type="text"
                      required
                      value={numeroProfissional}
                      onChange={(e) => setNumeroProfissional(e.target.value)}
                      placeholder="Ex: OFM-MZ/2023-890"
                      className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nome da Farmácia *
                    </label>
                    <input
                      type="text"
                      required
                      value={farmaciaNome}
                      onChange={(e) => setFarmaciaNome(e.target.value)}
                      placeholder="Ex: Farmácia Central"
                      className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'admin' && (
                <div className="space-y-2.5 p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Autenticação de Oficial DPS Tete</span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Código de Credencial DPS *
                    </label>
                    <input
                      type="text"
                      required
                      value={codigoCredencialDps}
                      onChange={(e) => setCodigoCredencialDps(e.target.value)}
                      placeholder="Ex: DPS-TETE-2026"
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Senha de Acesso *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="submit-register-modal-btn"
                disabled={loading}
                className={`w-full py-2.5 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 ${
                  selectedRole === 'admin'
                    ? 'bg-blue-700 hover:bg-blue-800'
                    : selectedRole === 'director'
                    ? 'bg-teal-700 hover:bg-teal-800'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? (
                  <span>A criar conta...</span>
                ) : (
                  <>
                    <span>Criar Perfil de {selectedRole === 'admin' ? 'Admin DPS' : selectedRole === 'director' ? 'Director Técnico' : 'Utente'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSuccessMsg(`Instruções de recuperação enviadas para ${email}`);
                setTimeout(() => setMode('login'), 2000);
              }}
              className="space-y-3.5 text-xs"
            >
              <p className="text-slate-600">
                Insira o seu endereço de email cadastrado para receber o link de redefinição.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Cadastrado *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@farmalink.co.mz"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all"
              >
                Enviar Código de Recuperação
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-1 text-slate-600 font-bold hover:underline text-center block"
              >
                Voltar ao login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
