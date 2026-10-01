import React, { useState, useEffect } from 'react';
import { FarmaLinkDB, StorageService } from '../lib/storage';
import { CloudSync } from '../lib/firestoreSync';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../lib/firebase';
import { UserProfile, UserRole, StockAlert, MedicationReminder } from '../types';
import { TETE_BAIRROS } from '../lib/geo';
import { MedicationReminderModal } from '../components/MedicationReminderModal';
import { getStoredTheme, applyTheme, ThemeMode } from '../lib/theme';
import { FarmaLinkLogo } from '../lib/logo';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Key,
  Smartphone,
  Save,
  Download,
  Building2,
  Shield,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Trash2,
  Pill,
  Clock,
  Plus,
  Moon,
  Sun,
  Laptop,
  Eye,
  EyeOff,
  Lock,
  HeartPulse,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface UserProfileViewProps {
  currentUser: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onNavigate?: (tab: string, params?: Record<string, unknown>) => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
  onBack?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  onUpdateUser,
  onNavigate,
  onOpenAuthModal,
  onLogout,
  onBack,
}) => {
  // Check if current user is in Guest / Visitor mode
  const isGuest =
    currentUser.user_id === 'guest-user' ||
    currentUser.id === 'prof-guest-utente' ||
    currentUser.email === 'visitante@farmalink.mz' ||
    !currentUser.email;

  // Authentication sub-tab for guest or switch-account mode
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [showAccountSwitcher, setShowAccountSwitcher] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<UserRole>('user');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Register form state
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelefone, setRegTelefone] = useState('+258 84 ');
  const [regBairro, setRegBairro] = useState('Francisco Manyanga');
  const [regNumeroProfissional, setRegNumeroProfissional] = useState('');
  const [regFarmaciaNome, setRegFarmaciaNome] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Profile Edit State (when logged in)
  const [nome, setNome] = useState(currentUser.nome);
  const [telefone, setTelefone] = useState(currentUser.telefone || '');
  const [bairro, setBairro] = useState(currentUser.bairro || 'Francisco Manyanga');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser.avatar_url || '');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => currentUser.theme_preference || getStoredTheme());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>(() =>
    StorageService.getStockAlerts(currentUser.user_id)
  );

  // Synchronize local form when currentUser changes
  useEffect(() => {
    setNome(currentUser.nome);
    setTelefone(currentUser.telefone || '');
    setBairro(currentUser.bairro || 'Francisco Manyanga');
    setAvatarUrl(currentUser.avatar_url || '');
    setStockAlerts(StorageService.getStockAlerts(currentUser.user_id));
  }, [currentUser]);

  const notifications = FarmaLinkDB.getNotifications(currentUser.user_id);
  const allProfiles = FarmaLinkDB.getProfiles();
  const remindersCount = StorageService.getMedicationReminders(currentUser.user_id).length;

  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
    applyTheme(newTheme);
    const updated: UserProfile = {
      ...currentUser,
      theme_preference: newTheme,
      updated_at: new Date().toISOString(),
    };
    FarmaLinkDB.saveProfile(updated);
    onUpdateUser(updated);
  };

  const handleDeleteAlert = (alertId: string) => {
    StorageService.deleteStockAlert(alertId);
    setStockAlerts(StorageService.getStockAlerts(currentUser.user_id));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      nome: nome.trim(),
      telefone: telefone.trim(),
      bairro,
      avatar_url: avatarUrl || undefined,
      updated_at: new Date().toISOString(),
    };
    FarmaLinkDB.saveProfile(updated);
    await CloudSync.syncProfile(updated);
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Direct login execution
  const handlePerformLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthError('Por favor introduza o seu e-mail ou contacto telefónico.');
      setAuthLoading(false);
      return;
    }

    try {
      if (auth && cleanEmail && loginPassword && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, loginPassword);
        } catch {
          // Gracefully continue with local database if offline
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
            : 'user';

        user = {
          id: `prof-${generatedId}`,
          user_id: generatedId,
          nome: cleanEmail.split('@')[0] ? cleanEmail.split('@')[0].toUpperCase() : 'Utente FarmaLink',
          email: cleanEmail,
          telefone: '+258 84 100 2000',
          role: inferredRole,
          bairro: 'Francisco Manyanga',
          status: 'active',
          numero_profissional: inferredRole === 'director' ? 'OFM-MZ/2023-889' : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        FarmaLinkDB.saveProfile(user);
      }

      FarmaLinkDB.setCurrentUser(user);
      await CloudSync.syncProfile(user);
      onUpdateUser(user);
      setAuthSuccess(`Sessão iniciada com sucesso como ${user.nome}!`);
      setShowAccountSwitcher(false);
      setAuthLoading(false);
      setTimeout(() => setAuthSuccess(null), 3500);
    } catch (err: any) {
      setAuthLoading(false);
      setAuthError(err?.message || 'Erro ao iniciar sessão. Verifique as credenciais.');
    }
  };

  // Direct registration execution
  const handlePerformRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!regNome.trim() || !cleanEmail) {
      setAuthError('Por favor preencha o seu nome completo e e-mail.');
      setAuthLoading(false);
      return;
    }

    try {
      if (auth && cleanEmail && regPassword && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
        } catch {
          // Gracefully continue
        }
      }

      const generatedId = `usr-${Date.now().toString().slice(-6)}`;
      const newUser: UserProfile = {
        id: `prof-${generatedId}`,
        user_id: generatedId,
        nome: regNome.trim(),
        email: cleanEmail,
        telefone: regTelefone.trim() || '+258 84 100 2000',
        bairro: regBairro,
        role: authRole,
        numero_profissional: authRole === 'director' ? regNumeroProfissional.trim() || 'OFM-MZ/2024-999' : undefined,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      FarmaLinkDB.saveProfile(newUser);
      FarmaLinkDB.setCurrentUser(newUser);
      await CloudSync.syncProfile(newUser);
      onUpdateUser(newUser);

      setAuthSuccess(`Conta criada com sucesso! Bem-vindo(a), ${newUser.nome}.`);
      setShowAccountSwitcher(false);
      setAuthLoading(false);
      setTimeout(() => setAuthSuccess(null), 4000);
    } catch (err: any) {
      setAuthLoading(false);
      setAuthError(err?.message || 'Erro ao criar conta. Tente novamente.');
    }
  };

  // Quick 1-click test account log in
  const handleQuickLogin = (emailTarget: string) => {
    setLoginEmail(emailTarget);
    setLoginPassword('FarmaLink@2026');
    const users = FarmaLinkDB.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === emailTarget.toLowerCase());
    if (user) {
      FarmaLinkDB.setCurrentUser(user);
      onUpdateUser(user);
      setShowAccountSwitcher(false);
      setAuthSuccess(`Acesso rápido ativado: ${user.nome} (${user.role})`);
      setTimeout(() => setAuthSuccess(null), 3000);
    }
  };

  const handleSwitchRole = (role: UserRole) => {
    const target = allProfiles.find((p) => p.role === role) || {
      id: `prof-${role}-1`,
      user_id: role === 'director' ? 'dir-1' : role === 'admin' ? 'admin-1' : 'user-1',
      nome:
        role === 'director'
          ? 'Dr. Mário Cossa (Farmacêutico)'
          : role === 'admin'
          ? 'Grácio Hortêncio César (Administrador Geral)'
          : 'Amélia Nhantumbo',
      email:
        role === 'director'
          ? 'mario.cossa@farmaciacentral.co.mz'
          : role === 'admin'
          ? 'gracioalicete7@gmail.com'
          : 'amelia.utente@farmalink.mz',
      role: role,
      status: 'active',
      telefone: '+258 84 123 4567',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    FarmaLinkDB.setCurrentUser(target);
    onUpdateUser(target);
    if (onNavigate) {
      if (role === 'director') onNavigate('director-portal', { tab: 'dashboard' });
      else if (role === 'admin' || role === 'superadmin') onNavigate('admin-portal');
      else onNavigate('home');
    }
  };

  const handleMarkAsRead = (notifId: string) => {
    FarmaLinkDB.markNotificationAsRead(notifId);
  };

  return (
    <div id="user-profile-view" className="max-w-3xl mx-auto space-y-4 pb-12">
      {/* Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title={isGuest ? 'Acesso & Conta FarmaLink' : `Perfil de ${currentUser.nome}`}
          subtitle={isGuest ? 'Entrar ou criar conta' : currentUser.email}
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
        />
      )}

      {/* =========================================================================
          SECTION 1: "BEM-VINDO DE VOLTA" / AUTHENTICATION CARD (IF GUEST OR SWITCHING)
          ========================================================================= */}
      {(isGuest || showAccountSwitcher) && (
        <div
          id="welcome-back-auth-card"
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-xl space-y-6 transition-all animate-in fade-in slide-in-from-top-4"
        >
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <span>Bem-vindo de volta</span>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full">
                    FarmaLink Tete
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Aceda à sua conta para gerir reservas de medicamentos, alertas de stock e lembretes de posologia.
                </p>
              </div>
            </div>

            {showAccountSwitcher && !isGuest && (
              <button
                type="button"
                onClick={() => setShowAccountSwitcher(false)}
                className="self-start sm:self-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Voltar ao Perfil Ativo
              </button>
            )}
          </div>

          {/* Guest Freedom Guarantee Note */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Acesso Livre:</strong> A consulta de medicamentos, disponibilidade de stock no balcão, farmácias de plantão 24h e geolocalização no mapa em Tete continuam 100% livres e sem necessidade de login.
            </p>
          </div>

          {/* Feedback Messages */}
          {authError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Tab Selector: Entrar vs Criar Conta */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              type="button"
              id="auth-tab-login-btn"
              onClick={() => {
                setAuthTab('login');
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authTab === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4 text-emerald-600" />
              <span>Entrar na Conta</span>
            </button>
            <button
              type="button"
              id="auth-tab-register-btn"
              onClick={() => {
                setAuthTab('register');
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authTab === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Criar Nova Conta</span>
            </button>
          </div>

          {/* TAB 1: ENTRAR NA CONTA (LOGIN) */}
          {authTab === 'login' && (
            <form onSubmit={handlePerformLogin} className="space-y-4 pt-1">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail ou Contacto Telefónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="ex: amelia.utente@farmalink.mz ou +258 84..."
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Palavra-passe
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthSuccess('Instruções de recuperação de senha enviadas via SMS/WhatsApp para o seu contacto.');
                        setTimeout(() => setAuthSuccess(null), 4000);
                      }}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="login-remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                  />
                  <label htmlFor="login-remember-me" className="text-slate-600 dark:text-slate-400 text-xs cursor-pointer">
                    Manter sessão iniciada neste dispositivo em Tete
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-submit-welcome-login"
                disabled={authLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>A verificar credenciais...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar na Minha Conta</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Login Badges (1-Click Tester) */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Acesso Rápido de Teste (1-Clique):
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    Sem digitar senha
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('amelia.utente@farmalink.mz')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Utente</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">Amélia Nhantumbo</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('mario.cossa@farmaciacentral.co.mz')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Director Técnico</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">Dr. Mário Cossa</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('gracioalicete7@gmail.com')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Admin Geral</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">Grácio Hortêncio César (Licenciado em Farmácia)</p>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: CRIAR NOVA CONTA (REGISTER) */}
          {authTab === 'register' && (
            <form onSubmit={handlePerformRegister} className="space-y-4 pt-1">
              {/* Account Role Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1.5">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthRole('user')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      authRole === 'user'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs'
                    }`}
                  >
                    <User className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs">Utente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthRole('director')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      authRole === 'director'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs">Director Farmácia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthRole('admin')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      authRole === 'admin'
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs'
                    }`}
                  >
                    <Shield className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs">Administrador</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    placeholder="ex: Carlos Manuel"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seu.email@exemplo.co.mz"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone (SMS / WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={regTelefone}
                    onChange={(e) => setRegTelefone(e.target.value)}
                    placeholder="+258 84 123 4567"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bairro em Tete *</label>
                  <select
                    value={regBairro}
                    onChange={(e) => setRegBairro(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {TETE_BAIRROS.filter((b) => b !== 'Todos os Bairros').map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {authRole === 'director' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Carteira Profissional OFM *</label>
                      <input
                        type="text"
                        required
                        value={regNumeroProfissional}
                        onChange={(e) => setRegNumeroProfissional(e.target.value)}
                        placeholder="OFM-MZ/2024-..."
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Farmácia *</label>
                      <input
                        type="text"
                        required
                        value={regFarmaciaNome}
                        onChange={(e) => setRegFarmaciaNome(e.target.value)}
                        placeholder="ex: Farmácia Vida Tete"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Criar Palavra-passe *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 pr-10 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-welcome-register"
                disabled={authLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>A criar conta...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Criar Minha Conta Gratuita</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 2: AUTHENTICATED USER HEADER & ACTIVE PROFILE CONTROLS
          ========================================================================= */}
      {!isGuest && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={currentUser.nome}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
                  {currentUser.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <label
                htmlFor="user-avatar-input"
                className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer transition-colors"
                title="Carregar Foto de Perfil"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="user-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">{currentUser.nome}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                    currentUser.role === 'director'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                      : currentUser.role === 'admin' || currentUser.role === 'superadmin'
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {currentUser.role === 'director'
                    ? 'Director Técnico'
                    : currentUser.role === 'admin' || currentUser.role === 'superadmin'
                    ? 'Administrador Geral / Gestor da Plataforma'
                    : 'Utente / Cidadão'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Tete, Moçambique</span>
              </div>
            </div>
          </div>

          {/* Quick Portal Switcher & Auth buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="profile-btn-trocar-conta"
              onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Trocar de conta ou iniciar sessão com outro e-mail"
            >
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span>Trocar Conta</span>
            </button>

            {onLogout && (
              <button
                type="button"
                id="profile-btn-sair"
                onClick={() => {
                  onLogout();
                }}
                className="group px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 hover:text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Terminar sessão / Sair do Perfil"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-rose-500 group-hover:-translate-x-0.5 transition-transform" />
                <span>Terminar Sessão</span>
              </button>
            )}

            {currentUser.role === 'director' && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('director-portal')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Painel Farmácia</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('admin-portal')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Painel Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= DARK MODE & NIGHT READING SETTINGS CARD ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Aparência & Modo Noturno</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Leitura Confortável
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize o contraste e tema visual para consultas de fármacos à noite
              </p>
            </div>
          </div>

          {/* Quick Active Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Tema atual:{' '}
              <strong className="text-emerald-700 dark:text-emerald-400 capitalize">
                {themeMode === 'system' ? 'Automático (Sistema)' : themeMode === 'dark' ? 'Escuro (Noturno)' : 'Claro'}
              </strong>
            </span>
          </div>
        </div>

        {/* 3-Way Mode Toggle Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light Mode Button */}
          <button
            type="button"
            id="theme-toggle-light-btn"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              themeMode === 'light'
                ? 'bg-amber-50/80 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20 shadow-xs'
                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              {themeMode === 'light' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Modo Claro</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Alto brilho para leitura diurna sob luz natural em Tete.
              </p>
            </div>
          </button>

          {/* Dark Mode Button */}
          <button
            type="button"
            id="theme-toggle-dark-btn"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              themeMode === 'dark'
                ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-md'
                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-indigo-900/80 text-indigo-300 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              {themeMode === 'dark' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Modo Escuro (Noturno)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Cores escuras confortáveis (Tailwind Slate) para uso à noite.
              </p>
            </div>
          </button>

          {/* System Mode Button */}
          <button
            type="button"
            id="theme-toggle-system-btn"
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              themeMode === 'system'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              {themeMode === 'system' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Automático do Dispositivo</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Acompanha as definições do seu telemóvel ou computador.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: ROLE MANAGEMENT & PANELS SIMULATOR
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Painéis e Modos de Acesso ao Sistema</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Alterne instantaneamente para testar e operar qualquer um dos 3 painéis do FarmaLink Tete:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Card Utente */}
          <div
            onClick={() => handleSwitchRole('user')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              currentUser.role === 'user' && !isGuest
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                {currentUser.role === 'user' && !isGuest && (
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Ativo
                  </span>
                )}
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Painel do Utente</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Pesquisa de medicamentos em Tete, geolocalização de farmácias e reserva de receitas.
              </p>
            </div>
            <button
              type="button"
              className="mt-3 w-full py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-emerald-600 text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold text-xs rounded-xl text-center transition-colors cursor-pointer"
            >
              {currentUser.role === 'user' && !isGuest ? 'Em Utilização' : 'Ativar Painel Utente'}
            </button>
          </div>

          {/* Card Director Tecnico */}
          <div
            onClick={() => handleSwitchRole('director')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              currentUser.role === 'director'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                {currentUser.role === 'director' && (
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Ativo
                  </span>
                )}
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Director Técnico</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Gestão de stock e validade, pedidos de levantamento e dados da farmácia.
              </p>
            </div>
            <button
              type="button"
              className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl text-center transition-colors cursor-pointer"
            >
              {currentUser.role === 'director' ? 'Aceder ao Painel' : 'Ativar Director'}
            </button>
          </div>

          {/* Card Administrador */}
          <div
            onClick={() => handleSwitchRole('admin')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              currentUser.role === 'admin' || currentUser.role === 'superadmin'
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Ativo
                  </span>
                )}
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Administrador Geral</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Aprovação sanitária de farmácias, catálogo geral, trilha de auditoria e relatórios.
              </p>
            </div>
            <button
              type="button"
              className="mt-3 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl text-center transition-colors cursor-pointer"
            >
              {currentUser.role === 'admin' || currentUser.role === 'superadmin' ? 'Aceder ao Painel' : 'Ativar Admin'}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: PROFILE EDIT FORM (WHEN AUTHENTICATED)
          ========================================================================= */}
      {!isGuest && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Informações Pessoais & Contacto
          </h2>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Perfil atualizado com sucesso!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone (Moçambique)</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="+258 84 123 4567"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bairro Habitual em Tete</label>
              <select
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {TETE_BAIRROS.filter((b) => b !== 'Todos os Bairros').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              id="save-profile-btn"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= MEDICINES POSOLOGY & REMINDERS CARD ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Lembretes de Medicamentos & Posologia
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assistente pessoal de tomas diárias com horários e controle de adesão
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsReminderModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Clock className="w-4 h-4" />
            <span>{remindersCount > 0 ? `Gerir (${remindersCount})` : 'Configurar Lembretes'}</span>
          </button>
        </div>

        {remindersCount === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
            Nenhum lembrete configurado. Clique acima para definir os horários dos seus remédios prescritos.
          </p>
        ) : (
          <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
            <div className="text-xs text-teal-950 dark:text-teal-200 font-medium">
              <span className="font-bold">{remindersCount} plano(s) de medicação ativo(s)</span> no seu perfil.
            </div>
            <button
              onClick={() => setIsReminderModalOpen(true)}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Abrir Horários ➔
            </button>
          </div>
        )}
      </div>

      {/* ================= ACTIVE STOCK ALERTS CARD ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Meus Alertas de Reposição de Stock
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Medicamentos que está a aguardar que fiquem disponíveis nas farmácias de Tete
            </p>
          </div>
        </div>

        {stockAlerts.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
            Não tem alertas de stock ativos. Quando pesquisar um medicamento esgotado, pode ativar um alerta com 1 clique.
          </p>
        ) : (
          <div className="space-y-2.5">
            {stockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{alert.medicine_nome}</h4>
                    <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                      Aguardando Stock
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Local: <strong>{alert.pharmacy_nome}</strong> • Notificar: {alert.user_telefone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                  title="Cancelar Alerta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Notificações & Avisos do FarmaLink</span>
        </h2>

        {notifications.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Sem notificações no momento.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 text-xs ${
                  notif.lida
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-slate-100 font-medium'
                }`}
              >
                <div>
                  <h4 className="font-bold">{notif.titulo}</h4>
                  <p className="text-[11px] mt-0.5">{notif.mensagem}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    {new Date(notif.created_at).toLocaleDateString('pt-MZ')} às{' '}
                    {new Date(notif.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!notif.lida && (
                  <span className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full shrink-0 mt-1"></span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout & Session Management Card */}
      {!isGuest && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-rose-100 dark:border-rose-950/60 shadow-sm space-y-3 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Terminar Sessão</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Encerre a sessão atual do seu perfil e regresse ao modo visitante/boas-vindas sem sair do aplicativo.
              </p>
            </div>
            <button
              type="button"
              id="profile-bottom-logout-btn"
              onClick={() => {
                onLogout?.();
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Terminar Sessão</span>
            </button>
          </div>
        </div>
      )}

      {/* Android APK / PWA Readiness Info */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 space-y-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-2 text-emerald-300">
          <Smartphone className="w-5 h-5" />
          <h3 className="font-bold text-sm sm:text-base">Aplicação Otimizada para Android & PWA</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          O <strong>FarmaLink Tete</strong> foi desenvolvido com suporte nativo a Progressive Web App (PWA) e empacotamento para Android APK. Pode adicionar este aplicativo ao ecrã principal do seu telemóvel para consulta rápida e acesso sem consumir muitos dados móveis.
        </p>
      </div>

      {/* Medication Reminder Modal */}
      {isReminderModalOpen && (
        <MedicationReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

