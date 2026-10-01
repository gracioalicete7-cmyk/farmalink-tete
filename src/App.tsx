import React, { useState, useEffect } from 'react';
import { FarmaLinkDB } from './lib/storage';
import { UserProfile, UserRole, UserLocation, Medicine, Pharmacy, PharmacyMedicine, Order } from './types';
import { getCurrentUserLocation, TETE_CENTER } from './lib/geo';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NavMenuDrawer } from './components/NavMenuDrawer';
import { OrderModal } from './components/OrderModal';
import { AuthModal } from './components/AuthModal';
import { FarmaLinkLogo } from './lib/logo';

// Views
import { HomeView } from './views/HomeView';
import { MedicineSearchView } from './views/MedicineSearchView';
import { PharmaciesView } from './views/PharmaciesView';
import { PharmacyDetailView } from './views/PharmacyDetailView';
import { MedicineDetailView } from './views/MedicineDetailView';
import { UserOrdersView } from './views/UserOrdersView';
import { DirectorPortalView } from './views/DirectorPortalView';
import { AdminPortalView } from './views/AdminPortalView';
import { UserProfileView } from './views/UserProfileView';
import { AuthView } from './views/AuthView';
import { TermsAndPrivacyView } from './views/TermsAndPrivacyView';
import { DesignSystemView } from './views/DesignSystemView';
import { HelpSupportView } from './views/HelpSupportView';
import { MapView } from './components/MapView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { CloudSync } from './lib/firestoreSync';
import { OfflineHistoryService } from './lib/offlineHistory';
import { VoiceSearchModal } from './components/VoiceSearchModal';
import { VoiceSearchResult } from './lib/voiceSearch';
import { ScreenHeader } from './components/ScreenHeader';
import { CheckCircle2, AlertCircle, Sparkles, HeartPulse, Mic, LogIn, LogOut, User } from 'lucide-react';

interface NavigationEntry {
  tab: string;
  params: Record<string, unknown>;
  selectedPharmacyId: string | null;
  selectedMedicineId: string | null;
}

export default function App() {
  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [navParams, setNavParams] = useState<Record<string, unknown>>({});
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<NavigationEntry[]>([]);
  const [, setStorageSyncTick] = useState(0);

  // User Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => FarmaLinkDB.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isFullScreenMenuOpen, setIsFullScreenMenuOpen] = useState<boolean>(false);
  const [isGlobalVoiceModalOpen, setIsGlobalVoiceModalOpen] = useState<boolean>(false);

  const handleGlobalVoiceResult = (result: VoiceSearchResult) => {
    if (result.targetType === 'pharmacy') {
      navigateTo('pharmacies', {
        query: result.cleanedQuery,
        filter24h: result.filter24h,
        filterOpen: result.filterOpen,
        filterBairro: result.filterBairro,
      });
    } else {
      navigateTo('medicines', {
        query: result.cleanedQuery,
        filterBairro: result.filterBairro,
        filter24h: result.filter24h,
      });
    }
  };

  // Reactive listener for storage updates across components
  useEffect(() => {
    let isMounted = true;
    const handleStorageUpdate = () => {
      setTimeout(() => {
        if (isMounted) {
          setStorageSyncTick((prev) => prev + 1);
        }
      }, 0);
    };
    window.addEventListener('farmalink_storage_updated', handleStorageUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('farmalink_storage_updated', handleStorageUpdate);
    };
  }, []);

  // Geolocation state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // Order modal state
  const [orderModalData, setOrderModalData] = useState<{
    isOpen: boolean;
    medicine: Medicine | null;
    pharmacy: Pharmacy | null;
    stock: PharmacyMedicine | null;
  }>({
    isOpen: false,
    medicine: null,
    pharmacy: null,
    stock: null,
  });

  // Success notification toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  // Initialize GPS location check
  const requestLocation = async () => {
    setIsLocating(true);
    const loc = await getCurrentUserLocation();
    setUserLocation(loc);
    setIsLocating(false);
    if (loc.precisao) {
      setLocationToast(`Localização GPS obtida (${loc.bairro || 'Tete'})`);
      setTimeout(() => setLocationToast(null), 3500);
    }
  };

  useEffect(() => {
    // 1. Initial UI renders instantly with zero blocking
    // 2. Defer background cloud sync until UI is fully painted
    const syncTimer = setTimeout(() => {
      CloudSync.init();
    }, 400);

    // 3. Gentle background GPS check without freezing initial paint
    const gpsTimer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          requestLocation();
        });
      } else {
        requestLocation();
      }
    }, 1200);

    return () => {
      clearTimeout(syncTimer);
      clearTimeout(gpsTimer);
    };
  }, []);

  // Stack-based Navigation Helpers
  const navigateTo = (tab: string, params?: Record<string, unknown>) => {
    // Only record in stack if navigating to a different view or with different state
    const currentEntry: NavigationEntry = {
      tab: currentTab,
      params: navParams,
      selectedPharmacyId,
      selectedMedicineId,
    };

    if (
      currentTab !== tab ||
      selectedPharmacyId !== null ||
      selectedMedicineId !== null ||
      JSON.stringify(navParams) !== JSON.stringify(params || {})
    ) {
      setNavigationHistory((prev) => [...prev, currentEntry]);
    }

    setSelectedPharmacyId(null);
    setSelectedMedicineId(null);
    setNavParams(params || {});
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPharmacy = (pharmacyId: string) => {
    const currentEntry: NavigationEntry = {
      tab: currentTab,
      params: navParams,
      selectedPharmacyId,
      selectedMedicineId,
    };
    setNavigationHistory((prev) => [...prev, currentEntry]);
    setSelectedPharmacyId(pharmacyId);
    setSelectedMedicineId(null);

    // Save view to offline cache
    const pharm = FarmaLinkDB.getPharmacyById(pharmacyId);
    if (pharm) {
      const availCount = FarmaLinkDB.getPharmacyMedicines(pharmacyId).filter(
        (s) => s.disponibilidade === 'Disponível'
      ).length;
      OfflineHistoryService.recordPharmacyView(pharm, availCount);
    }

    setCurrentTab('pharmacy-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMedicine = (medicineId: string) => {
    const currentEntry: NavigationEntry = {
      tab: currentTab,
      params: navParams,
      selectedPharmacyId,
      selectedMedicineId,
    };
    setNavigationHistory((prev) => [...prev, currentEntry]);
    setSelectedMedicineId(medicineId);
    setSelectedPharmacyId(null);

    // Save view with known stocks to offline cache
    const med = FarmaLinkDB.getMedicineById(medicineId);
    if (med) {
      const stocks = FarmaLinkDB.getPharmacyMedicines().filter((s) => s.medicine_id === medicineId);
      const stocksWithPharm = stocks
        .map((s) => ({
          stock: s,
          pharmacy: FarmaLinkDB.getPharmacyById(s.pharmacy_id)!,
        }))
        .filter((item) => !!item.pharmacy);
      OfflineHistoryService.recordMedicineView(med, stocksWithPharm);
    }

    setCurrentTab('medicine-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (navigationHistory.length > 0) {
      setNavigationHistory((prev) => {
        const nextHistory = [...prev];
        const previousEntry = nextHistory.pop();
        if (previousEntry) {
          setCurrentTab(previousEntry.tab);
          setNavParams(previousEntry.params || {});
          setSelectedPharmacyId(previousEntry.selectedPharmacyId);
          setSelectedMedicineId(previousEntry.selectedMedicineId);
        } else {
          setCurrentTab('home');
          setSelectedPharmacyId(null);
          setSelectedMedicineId(null);
          setNavParams({});
        }
        return nextHistory;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Stack is empty: go directly to home
      setCurrentTab('home');
      setSelectedPharmacyId(null);
      setSelectedMedicineId(null);
      setNavParams({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTriggerOrder = (medicine: Medicine, pharmacy: Pharmacy, stock: PharmacyMedicine) => {
    setOrderModalData({
      isOpen: true,
      medicine,
      pharmacy,
      stock,
    });
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setToastMessage({
      title: 'Pedido Enviado com Sucesso!',
      desc: `A solicitação para ${newOrder.medicine_nome} foi encaminhada para a ${newOrder.pharmacy_nome}.`,
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleLogout = () => {
    const guestUser: UserProfile = {
      id: 'prof-guest-utente',
      user_id: 'guest-user',
      nome: 'Utente / Visitante',
      email: 'visitante@farmalink.mz',
      telefone: '+258 84 000 0000',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    FarmaLinkDB.setCurrentUser(guestUser);
    setCurrentUser(guestUser);
    setNavigationHistory([]);
    setCurrentTab('home');
    setSelectedMedicineId(null);
    setSelectedPharmacyId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setToastMessage({
      title: 'Sessão Terminada',
      desc: 'Terminou a sua sessão com sucesso. Redirecionado para a página inicial.',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Orders count for badge
  const pendingOrdersCount = FarmaLinkDB.getOrders({ userId: currentUser.user_id }).filter(
    (o) => !['Concluído', 'Cancelado', 'Rejeitado'].includes(o.status)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Main Responsive Header */}
      <Header
        currentTab={currentTab}
        onNavigate={navigateTo}
        currentUser={currentUser}
        onSwitchUser={(user) => setCurrentUser(user)}
        onLogout={handleLogout}
        onOpenMenu={() => setIsFullScreenMenuOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        unreadNotificationsCount={FarmaLinkDB.getNotifications(currentUser.user_id).filter((n) => !n.lida).length}
        onGoBack={goBack}
        canGoBack={navigationHistory.length > 0 || currentTab !== 'home' || selectedPharmacyId !== null || selectedMedicineId !== null}
        historyDepth={navigationHistory.length}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="global-success-toast"
          className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-emerald-800 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm leading-tight">{toastMessage.title}</h4>
            <p className="text-xs text-emerald-100 mt-0.5">{toastMessage.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-300 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* GPS Location Toast */}
      {locationToast && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 bg-slate-900/90 text-white text-xs px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 backdrop-blur-xs flex items-center gap-2 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{locationToast}</span>
        </div>
      )}

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36 sm:pb-32 md:pb-12">
        <ErrorBoundary fallbackTitle="Navegação protegida" onReset={() => setCurrentTab('home')}>
          {/* VIEW: HOME */}
          {currentTab === 'home' && (
            <HomeView
              userLocation={userLocation}
              onNavigate={navigateTo}
              onSelectPharmacy={handleSelectPharmacy}
              onSelectMedicine={handleSelectMedicine}
              onOrderMedicine={handleTriggerOrder}
              onRequestUserLocation={requestLocation}
            />
          )}

          {/* VIEW: MEDICINES SEARCH */}
          {currentTab === 'medicines' && (
            <MedicineSearchView
              key={`med-search-${navParams.query || ''}-${navParams.category || ''}-${navParams.symptom || ''}`}
              userLocation={userLocation}
              initialQuery={(navParams.query as string) || ''}
              initialCategory={(navParams.category as string) || ''}
              initialSymptom={(navParams.symptom as string) || ''}
              initialLabel={(navParams.label as string) || ''}
              onSelectMedicine={handleSelectMedicine}
              onSelectPharmacy={handleSelectPharmacy}
              onOrderMedicine={handleTriggerOrder}
              onRequestUserLocation={requestLocation}
              onBack={goBack}
            />
          )}

          {/* VIEW: PHARMACIES DIRECTORY */}
          {currentTab === 'pharmacies' && (
            <PharmaciesView
              userLocation={userLocation}
              onSelectPharmacy={handleSelectPharmacy}
              onRequestUserLocation={requestLocation}
              initialFilterNearby={!!navParams.filterNearby}
              onBack={goBack}
            />
          )}

          {/* VIEW: INTERACTIVE MAP */}
          {currentTab === 'map' && (
            <div className="space-y-4 pb-12">
              <ScreenHeader
                title="Mapa das Farmácias em Tete"
                subtitle="Localização GPS, rotas e farmácias abertas"
                onBack={goBack}
                exitLabel="Sair"
                backLabel="Página anterior"
              />

              <ErrorBoundary fallbackTitle="Erro ao carregar mapa">
                <MapView
                  pharmacies={FarmaLinkDB.getApprovedPharmacies()}
                  userLocation={userLocation}
                  onSelectPharmacy={handleSelectPharmacy}
                  onRequestUserLocation={requestLocation}
                  height="h-[600px]"
                />
              </ErrorBoundary>
            </div>
          )}

          {/* VIEW: PHARMACY DETAIL */}
          {currentTab === 'pharmacy-detail' && selectedPharmacyId && (
            <PharmacyDetailView
              pharmacyId={selectedPharmacyId}
              userLocation={userLocation}
              currentUser={currentUser}
              onBack={goBack}
              onSelectMedicine={handleSelectMedicine}
              onOrderMedicine={handleTriggerOrder}
              onNavigate={navigateTo}
            />
          )}

          {/* VIEW: MEDICINE DETAIL */}
          {currentTab === 'medicine-detail' && selectedMedicineId && (
            <MedicineDetailView
              medicineId={selectedMedicineId}
              userLocation={userLocation}
              currentUser={currentUser}
              onBack={goBack}
              onSelectPharmacy={handleSelectPharmacy}
              onOrderMedicine={handleTriggerOrder}
            />
          )}

          {/* VIEW: USER ORDERS */}
          {currentTab === 'orders' && (
            <UserOrdersView currentUser={currentUser} onNavigate={navigateTo} onBack={goBack} />
          )}

          {/* VIEW: DIRECTOR PORTAL */}
          {currentTab === 'director-portal' && (
            <DirectorPortalView
              currentUser={currentUser}
              initialTab={(navParams.tab as string) || 'dashboard'}
              initialPharmacyId={(navParams.pharmacyId as string) || undefined}
              onNavigate={navigateTo}
              onSwitchUser={(user) => setCurrentUser(user)}
              onBack={goBack}
            />
          )}

          {/* VIEW: ADMIN PORTAL */}
          {currentTab === 'admin-portal' && (
            <AdminPortalView
              currentUser={currentUser}
              initialTab={(navParams.tab as string) || 'stats'}
              onNavigate={navigateTo}
              onSelectPharmacy={handleSelectPharmacy}
              onSwitchUser={(user) => setCurrentUser(user)}
              onUpdateUser={(user) => setCurrentUser(user)}
              onBack={goBack}
            />
          )}

          {/* VIEW: USER PROFILE */}
          {currentTab === 'profile' && (
            <UserProfileView
              currentUser={currentUser}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              onNavigate={navigateTo}
              onOpenAuthModal={(mode) => {
                setAuthModalMode(mode || 'login');
                setIsAuthModalOpen(true);
              }}
              onLogout={handleLogout}
              onBack={goBack}
            />
          )}

          {/* VIEW: AUTHENTICATION (LOGIN & REGISTRATION) */}
          {(currentTab === 'auth' || currentTab === 'login' || currentTab === 'register') && (
            <AuthView
              initialMode={currentTab === 'register' ? 'register' : 'login'}
              initialRole={(navParams.role as UserRole) || 'user'}
              onNavigate={navigateTo}
              onBack={goBack}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                setToastMessage({
                  title: `Sessão Iniciada com Sucesso!`,
                  desc: `Bem-vindo(a), ${user.nome} (${user.role === 'director' ? 'Director Técnico' : user.role === 'admin' || user.role === 'superadmin' ? 'Administrador Geral / Gestor da Plataforma' : 'Utente'}).`,
                });
                setTimeout(() => setToastMessage(null), 4000);
              }}
            />
          )}

          {/* VIEW: TERMS AND PRIVACY */}
          {currentTab === 'terms' && <TermsAndPrivacyView onBack={goBack} />}

          {/* VIEW: HELP AND SUPPORT CENTER (FAQ) */}
          {(currentTab === 'help' || currentTab === 'support' || currentTab === 'faq') && (
            <HelpSupportView onNavigate={navigateTo} onBack={goBack} />
          )}

          {/* VIEW: CLINICAL PRECISION DESIGN SYSTEM */}
          {(currentTab === 'design-system' || currentTab === 'design' || currentTab === 'styleguide') && (
            <DesignSystemView onNavigate={navigateTo} onBack={goBack} />
          )}
        </ErrorBoundary>
      </main>

      {/* Global Order Modal */}
      {orderModalData.isOpen && orderModalData.medicine && orderModalData.pharmacy && orderModalData.stock && (
        <OrderModal
          isOpen={orderModalData.isOpen}
          medicine={orderModalData.medicine}
          pharmacy={orderModalData.pharmacy}
          stock={orderModalData.stock}
          currentUser={currentUser}
          onClose={() => setOrderModalData({ isOpen: false, medicine: null, pharmacy: null, stock: null })}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Global Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onNavigateToAuthPage={(mode, role) => {
          navigateTo(mode, { role });
        }}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setToastMessage({
            title: `Bem-vindo, ${user.nome}!`,
            desc: `Sessão iniciada como ${user.role === 'director' ? 'Director Técnico' : user.role === 'admin' || user.role === 'superadmin' ? 'Administrador Geral / Gestor da Plataforma' : 'Utente'}.`,
          });
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Full-Screen Menu Modal */}
      <NavMenuDrawer
        isOpen={isFullScreenMenuOpen}
        onClose={() => setIsFullScreenMenuOpen(false)}
        currentTab={currentTab}
        onNavigate={navigateTo}
        currentUser={currentUser}
        onSwitchUser={(user) => setCurrentUser(user)}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Bottom Navigation for Mobile Devices */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={navigateTo}
        currentUser={currentUser}
        pendingOrdersCount={pendingOrdersCount}
        onLogout={handleLogout}
        onOpenMenu={() => setIsFullScreenMenuOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onGoBack={goBack}
        canGoBack={navigationHistory.length > 0 || currentTab !== 'home' || selectedPharmacyId !== null || selectedMedicineId !== null}
      />

      {/* PWA / APK Mobile Install Prompt */}
      <PwaInstallPrompt />

      {/* Floating Bottom-Left Auth / Session Widget (Clear, Prominent, Highly Visible) */}
      <div
        id="bottom-left-auth-widget"
        className="hidden md:flex fixed bottom-6 left-6 z-40 items-center gap-2.5 bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-slate-800 text-xs animate-in fade-in"
      >
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700/80">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-[11px]">
            {currentUser.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 max-w-[130px] truncate leading-tight">
              {currentUser.nome}
            </span>
            <span className="text-[9px] text-emerald-400 font-semibold leading-tight uppercase tracking-wider">
              {currentUser.role === 'admin' || currentUser.role === 'superadmin'
                ? 'Admin'
                : currentUser.role === 'director'
                ? 'Director'
                : currentUser.id === 'prof-guest' || currentUser.user_id === 'guest-1'
                ? 'Visitante'
                : 'Utente'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {currentUser.id === 'prof-guest' || currentUser.user_id === 'guest-1' ? (
            <button
              type="button"
              id="bottom-left-btn-entrar"
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              title="Entrar na conta"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                id="bottom-left-btn-perfil"
                onClick={() => navigateTo('profile')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
                title="Ver meu perfil"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Perfil</span>
              </button>
              <button
                type="button"
                id="bottom-left-btn-sair"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/60 font-bold text-xs transition-all cursor-pointer"
                title="Sair da sessão"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300" />
                <span>Sair</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating Voice Assistant Trigger for Mobile & Desktop (Elevated for full visibility above bottom nav) */}
      <button
        type="button"
        id="floating-voice-search-btn"
        onClick={() => setIsGlobalVoiceModalOpen(true)}
        className="fixed bottom-28 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-2xl hover:shadow-emerald-900/30 active:scale-95 transition-all group border-2 border-emerald-300/60 cursor-pointer"
        title="Falar para pesquisar medicamentos ou farmácias"
        aria-label="Pesquisa por voz"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-200"></span>
        </span>
        <Mic className="w-5 h-5 text-white animate-pulse shrink-0" />
        <span className="hidden sm:inline text-xs font-extrabold tracking-wide uppercase">
          Pesquisa por Voz
        </span>
      </button>

      {/* Global Voice Search Modal */}
      {isGlobalVoiceModalOpen && (
        <VoiceSearchModal
          isOpen={isGlobalVoiceModalOpen}
          onClose={() => setIsGlobalVoiceModalOpen(false)}
          onSelectSearch={handleGlobalVoiceResult}
          defaultType="auto"
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 px-4 sm:px-6 lg:px-8 mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <FarmaLinkLogo size="sm" />
            <span className="text-slate-300 font-bold">FarmaLink Tete</span>
          </div>

          <p className="text-slate-400">
            © {new Date().getFullYear()} FarmaLink Tete. Província de Tete, Moçambique. Encontre o seu medicamento. Encontre a sua farmácia.
          </p>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => navigateTo('terms')}
              className="hover:text-emerald-400 transition-colors"
            >
              Termos & Privacidade
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigateTo('director-portal', { tab: 'register' })}
              className="hover:text-emerald-400 transition-colors"
            >
              Registar Farmácia
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
