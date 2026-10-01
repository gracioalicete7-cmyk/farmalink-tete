import React, { useState, useEffect, useMemo } from 'react';
import { FarmaLinkDB, StorageService } from '../lib/storage';
import { CloudSync } from '../lib/firestoreSync';
import { RealFileUpload } from '../components/RealFileUpload';
import { RealChatModal } from '../components/RealChatModal';
import { BatchStockImportModal } from '../components/BatchStockImportModal';
import { MasterMedicineCatalogModal } from '../components/MasterMedicineCatalogModal';
import { DirectorAnalyticsSection } from '../components/DirectorAnalyticsSection';
import { ScreenHeader } from '../components/ScreenHeader';
import { MOZAMBIQUE_INSURANCE_COMPANIES } from '../constants/insurance';
import {
  UserProfile,
  Pharmacy,
  PharmacyStatus,
  PharmacyMedicine,
  Medicine,
  Order,
  OrderStatus,
  MedicineAvailability,
  PharmacyPhoto,
} from '../types';
import { TETE_BAIRROS, TETE_CENTER } from '../lib/geo';
import {
  Building2,
  Store,
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Save,
  Send,
  Upload,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Search,
  Filter,
  MessageCircle,
  MessageSquare,
  Eye,
  Camera,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  X,
  Package,
  FileCheck,
  TrendingUp,
  BarChart3,
  Truck,
  Key,
  Lock,
  Unlock,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  Flame,
  Archive,
  Zap,
} from 'lucide-react';

interface DirectorPortalViewProps {
  currentUser: UserProfile;
  initialTab?: string;
  initialPharmacyId?: string;
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
  onSwitchUser?: (user: UserProfile) => void;
  onBack?: () => void;
}

export const DirectorPortalView: React.FC<DirectorPortalViewProps> = ({
  currentUser,
  initialTab = 'dashboard',
  initialPharmacyId,
  onNavigate,
  onSwitchUser,
  onBack,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'register' | 'medicines' | 'orders' | 'photos' | 'analytics'
  >((initialTab as any) || 'dashboard');

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const handleActivateDirectorProfile = () => {
    const directorUser = FarmaLinkDB.getProfiles().find((p) => p.role === 'director') || {
      id: 'prof-dir-mais-saude',
      user_id: 'admin-1',
      nome: 'Dr. Grácio César (Director Técnico)',
      telefone: '+258 84 123 4567',
      email: 'gracioalicete7@gmail.com',
      role: 'director',
      numero_profissional: 'OFM-MZ/2019-540 (Licenciado em Farmácia)',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    FarmaLinkDB.setCurrentUser(directorUser);
    if (onSwitchUser) onSwitchUser(directorUser);
    triggerRefresh();
  };

  // Pharmacy for this director with direct selection & access code support
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(initialPharmacyId || null);

  useEffect(() => {
    if (initialTab) {
      const tabStr = String(initialTab).toLowerCase();
      if (tabStr === 'medicines' || tabStr === 'medicamentos' || tabStr === 'estoque' || tabStr === 'stock') {
        setActiveSubTab('medicines');
      } else if (tabStr === 'register' || tabStr === 'cadastro' || tabStr === 'registar') {
        setActiveSubTab('register');
        setIsRegisteringNewPharmacy(true);
        setSelectedPharmacyId(null);
        setFormData({
          nome: '',
          nuit: '',
          license_number: '',
          director_name: currentUser.nome || '',
          numero_profissional: currentUser.numero_profissional || '',
          telefone: currentUser.telefone || '',
          email: currentUser.email || '',
          endereco: '',
          bairro: 'Francisco Manyanga',
          cidade: 'Cidade de Tete',
          provincia: 'Tete',
          latitude: TETE_CENTER.latitude,
          longitude: TETE_CENTER.longitude,
          horario: '08:00 - 20:00',
          dias_funcionamento: 'Segunda a Sábado',
          descricao: '',
          motivacao_cadastro: 'Promover o acesso ágil e transparente a medicamentos essenciais na Província de Tete.',
          logo_url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=200&auto=format&fit=crop&q=80',
          access_code: '',
          pin: '2026',
          aceita_seguro: false,
          seguradoras: [],
          instrucoes_seguro: '',
          tipo_estabelecimento: 'farmacia_comunitaria',
        });
      } else if (tabStr === 'orders' || tabStr === 'pedidos') {
        setActiveSubTab('orders');
      } else if (tabStr === 'analytics' || tabStr === 'relatorios') {
        setActiveSubTab('analytics');
      } else if (tabStr === 'photos' || tabStr === 'fotos') {
        setActiveSubTab('photos');
      } else {
        setActiveSubTab('dashboard');
      }
    }
  }, [initialTab, currentUser]);

  useEffect(() => {
    if (initialPharmacyId) {
      setSelectedPharmacyId(initialPharmacyId);
      localStorage.setItem('farmalink_last_active_pharmacy_id', initialPharmacyId);
    }
  }, [initialPharmacyId]);

  // Reactive listener for storage updates across components
  useEffect(() => {
    const handleStorageUpdate = () => {
      FarmaLinkDB.clearMemoryCache();
      triggerRefresh();
    };
    window.addEventListener('farmalink_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('farmalink_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const allPharmacies = FarmaLinkDB.getPharmacies();
  const [isRegisteringNewPharmacy, setIsRegisteringNewPharmacy] = useState(false);

  const directorPharmacies = useMemo(() => {
    const qId = currentUser.user_id || currentUser.id;
    const qEmail = currentUser.email?.toLowerCase();
    const qName = currentUser.nome?.toLowerCase();

    // 1. First priority: Find pharmacies where this user is genuinely the director or owner (e.g. Grácio César)
    const matched = allPharmacies.filter((p) => {
      const matchId = p.director_id === qId || p.director_id === currentUser.id || p.director_id === currentUser.user_id;
      const matchPharmacyId = currentUser.pharmacy_id && p.id === currentUser.pharmacy_id;
      const matchEmail = p.email && qEmail && p.email.toLowerCase() === qEmail;
      const matchName =
        p.director_name &&
        qName &&
        (p.director_name.toLowerCase().includes(qName) ||
          qName.includes(p.director_name.toLowerCase()) ||
          (qName.includes('grácio') && p.director_name.toLowerCase().includes('grácio')));
      return matchId || matchPharmacyId || matchEmail || matchName;
    });

    if (matched.length > 0) {
      return matched;
    }

    // 2. If the user is admin/superadmin with no personal pharmacy yet, return all pharmacies for oversight
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      return allPharmacies;
    }

    return matched;
  }, [allPharmacies, currentUser, refreshKey]);

  const myPharmacy = useMemo(() => {
    // 1. Explicitly selected pharmacy via dropdown or state
    if (selectedPharmacyId) {
      const found = FarmaLinkDB.getPharmacyById(selectedPharmacyId);
      if (found) return found;
    }
    // 2. Bound directly to the current user's pharmacy_id
    if (currentUser.pharmacy_id) {
      const found = FarmaLinkDB.getPharmacyById(currentUser.pharmacy_id);
      if (found) return found;
    }
    // 3. User is authentically affiliated with a pharmacy (e.g. Grácio César -> Farmácia Clínica Mais Saúde)
    if (directorPharmacies.length > 0) {
      const userDirectPharm = directorPharmacies.find((p) => {
        const dName = p.director_name?.toLowerCase() || '';
        const uName = currentUser.nome?.toLowerCase() || '';
        return (
          p.director_id === (currentUser.user_id || currentUser.id) ||
          (uName.includes('grácio') && dName.includes('grácio')) ||
          (currentUser.email && p.email && p.email.toLowerCase() === currentUser.email.toLowerCase())
        );
      });
      if (userDirectPharm) return userDirectPharm;

      return directorPharmacies[0];
    }
    // 4. Saved active pharmacy in localStorage (for this browser/device session)
    const savedActiveId = localStorage.getItem('farmalink_last_active_pharmacy_id');
    if (savedActiveId) {
      const found = FarmaLinkDB.getPharmacyById(savedActiveId);
      if (found) return found;
    }
    // 5. Fallback to first available pharmacy in system so director/admin is never blocked
    return allPharmacies[0] || undefined;
  }, [selectedPharmacyId, currentUser.pharmacy_id, currentUser.user_id, currentUser.id, currentUser.nome, currentUser.email, directorPharmacies, allPharmacies]);

  // Keep saved active pharmacy synchronized
  useEffect(() => {
    if (myPharmacy?.id) {
      localStorage.setItem('farmalink_last_active_pharmacy_id', myPharmacy.id);
    }
  }, [myPharmacy?.id]);

  const allMedicines = FarmaLinkDB.getMedicines();
  const myStocks = myPharmacy ? FarmaLinkDB.getPharmacyMedicines(myPharmacy.id) : [];
  const myOrders = myPharmacy ? FarmaLinkDB.getOrders({ pharmacyId: myPharmacy.id }) : [];
  const myPhotos = myPharmacy ? FarmaLinkDB.getPhotos(myPharmacy.id) : [];

  // Medicines Filter & Search State
  const [medSearchTerm, setMedSearchTerm] = useState('');
  const [medAvailabilityFilter, setMedAvailabilityFilter] = useState<string>('Todos');
  const [medHealthFilter, setMedHealthFilter] = useState<
    'all' | 'available' | 'low_stock' | 'quarantine' | 'expiring_soon' | 'expired'
  >('all');

  // Orders Filter State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Todos');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  // Auto-saved draft state for Registration (Requirement #10)
  const savedDraft = FarmaLinkDB.getDraft(currentUser.user_id);
  const [draftSavedMsg, setDraftSavedMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: isRegisteringNewPharmacy ? '' : (myPharmacy?.nome || savedDraft?.nome || ''),
    nuit: isRegisteringNewPharmacy ? '' : (myPharmacy?.nuit || savedDraft?.nuit || ''),
    license_number: isRegisteringNewPharmacy ? '' : (myPharmacy?.license_number || savedDraft?.license_number || ''),
    director_name: isRegisteringNewPharmacy ? (currentUser.nome || 'Grácio César') : (savedDraft?.director_name || myPharmacy?.director_name || currentUser.nome || 'Grácio César'),
    numero_profissional: savedDraft?.numero_profissional || currentUser.numero_profissional || '',
    telefone: isRegisteringNewPharmacy ? (currentUser.telefone || '+258 84 123 4567') : (myPharmacy?.telefone || savedDraft?.telefone || currentUser.telefone || '+258 84 123 4567'),
    email: isRegisteringNewPharmacy ? (currentUser.email || 'gracioalicete7@gmail.com') : (myPharmacy?.email || savedDraft?.email || currentUser.email || 'gracioalicete7@gmail.com'),
    endereco: isRegisteringNewPharmacy ? '' : (myPharmacy?.endereco || savedDraft?.endereco || ''),
    bairro: isRegisteringNewPharmacy ? (currentUser.bairro || 'Francisco Manyanga') : (myPharmacy?.bairro || savedDraft?.bairro || currentUser.bairro || 'Francisco Manyanga'),
    cidade: 'Cidade de Tete',
    provincia: 'Tete',
    latitude: isRegisteringNewPharmacy ? TETE_CENTER.latitude : (myPharmacy?.latitude || savedDraft?.latitude || TETE_CENTER.latitude),
    longitude: isRegisteringNewPharmacy ? TETE_CENTER.longitude : (myPharmacy?.longitude || savedDraft?.longitude || TETE_CENTER.longitude),
    horario: isRegisteringNewPharmacy ? '08:00 - 20:00' : (myPharmacy?.horario || savedDraft?.horario || '08:00 - 20:00'),
    dias_funcionamento: isRegisteringNewPharmacy ? 'Segunda a Sábado' : (myPharmacy?.dias_funcionamento || savedDraft?.dias_funcionamento || 'Segunda a Sábado'),
    descricao: isRegisteringNewPharmacy ? '' : (myPharmacy?.descricao || savedDraft?.descricao || ''),
    motivacao_cadastro:
      myPharmacy?.motivacao_cadastro ||
      savedDraft?.motivacao_cadastro ||
      'Promover o acesso ágil e transparente a medicamentos de qualidade na Província de Tete, reduzindo o tempo de espera dos cidadãos com reservas digitais.',
    logo_url:
      myPharmacy?.logo_url ||
      savedDraft?.logo_url ||
      'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=200&auto=format&fit=crop&q=80',
    access_code: isRegisteringNewPharmacy ? '' : (myPharmacy?.access_code || savedDraft?.access_code || ''),
    pin: isRegisteringNewPharmacy ? '2026' : (myPharmacy?.pin || savedDraft?.pin || '2026'),
    aceita_seguro: isRegisteringNewPharmacy ? false : (myPharmacy?.aceita_seguro ?? savedDraft?.aceita_seguro ?? false),
    seguradoras: isRegisteringNewPharmacy ? [] : (myPharmacy?.seguradoras || savedDraft?.seguradoras || []),
    instrucoes_seguro: isRegisteringNewPharmacy ? '' : (myPharmacy?.instrucoes_seguro || savedDraft?.instrucoes_seguro || ''),
    tipo_estabelecimento: isRegisteringNewPharmacy ? 'farmacia_comunitaria' : (myPharmacy?.tipo_estabelecimento || savedDraft?.tipo_estabelecimento || 'farmacia_comunitaria'),
  });

  // Keep formData in sync whenever myPharmacy is loaded or switched (only when NOT in the middle of registering a new pharmacy)
  useEffect(() => {
    if (isRegisteringNewPharmacy) {
      return;
    }
    if (myPharmacy) {
      setFormData((prev) => ({
        ...prev,
        nome: myPharmacy.nome || prev.nome,
        nuit: myPharmacy.nuit || prev.nuit,
        license_number: myPharmacy.license_number || prev.license_number,
        director_name: myPharmacy.director_name || currentUser.nome || prev.director_name || 'Grácio César',
        numero_profissional: currentUser.numero_profissional || prev.numero_profissional,
        telefone: myPharmacy.telefone || prev.telefone,
        email: myPharmacy.email || prev.email,
        endereco: myPharmacy.endereco || prev.endereco,
        bairro: myPharmacy.bairro || prev.bairro,
        horario: myPharmacy.horario || prev.horario,
        dias_funcionamento: myPharmacy.dias_funcionamento || prev.dias_funcionamento,
        descricao: myPharmacy.descricao || prev.descricao,
        motivacao_cadastro: myPharmacy.motivacao_cadastro || prev.motivacao_cadastro,
        logo_url: myPharmacy.logo_url || prev.logo_url,
        access_code: myPharmacy.access_code || prev.access_code,
        pin: myPharmacy.pin || prev.pin,
        aceita_seguro: myPharmacy.aceita_seguro !== undefined ? myPharmacy.aceita_seguro : prev.aceita_seguro,
        seguradoras: myPharmacy.seguradoras || prev.seguradoras,
        instrucoes_seguro: myPharmacy.instrucoes_seguro !== undefined ? myPharmacy.instrucoes_seguro : prev.instrucoes_seguro,
        tipo_estabelecimento: myPharmacy.tipo_estabelecimento || prev.tipo_estabelecimento,
      }));
    }
  }, [myPharmacy?.id, myPharmacy?.updated_at, myPharmacy?.telefone, myPharmacy?.aceita_seguro, isRegisteringNewPharmacy]);

  // Modal states for Medicine / Stock Creation & Editing with Validity & Lot
  const [showMasterCatalogModal, setShowMasterCatalogModal] = useState(false);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [modalMode, setModalMode] = useState<'existing' | 'new'>('existing');
  const [editingStock, setEditingStock] = useState<PharmacyMedicine | null>(null);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [stockQty, setStockQty] = useState(50);
  const [stockPrice, setStockPrice] = useState<number | ''>(150);
  const [stockDisponibilidade, setStockDisponibilidade] = useState<MedicineAvailability>('Disponível');
  const [stockUnidade, setStockUnidade] = useState('caixas');
  const [stockValidade, setStockValidade] = useState('');
  const [stockLote, setStockLote] = useState('');
  const [stockEmQuarentena, setStockEmQuarentena] = useState(false);
  const [stockMotivoQuarentena, setStockMotivoQuarentena] = useState('');

  // Quarantine & Discard Modal States
  const [quarantineModalStock, setQuarantineModalStock] = useState<PharmacyMedicine | null>(null);
  const [quarantineModalReason, setQuarantineModalReason] = useState('Desvio de temperatura na conservação');
  const [discardModalStock, setDiscardModalStock] = useState<PharmacyMedicine | null>(null);
  const [discardModalReason, setDiscardModalReason] = useState('Prazo de validade expirado');

  // Access Code Modal (Director Entering With Code/PIN)
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [enteredAccessCode, setEnteredAccessCode] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);

  // Custom Code Editor Modal (Director Configuring Custom Code/PIN for Pharmacy)
  const [showEditCodeModal, setShowEditCodeModal] = useState(false);
  const [customAccessCode, setCustomAccessCode] = useState(myPharmacy?.access_code || '');
  const [customPin, setCustomPin] = useState(myPharmacy?.pin || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [newInsurerName, setNewInsurerName] = useState('');

  // Form for Creating a Brand New Medicine
  const [newMedData, setNewMedData] = useState({
    nome: '',
    principio_ativo: '',
    concentracao: '',
    forma_farmaceutica: 'Comprimidos',
    categoria: 'Analgésicos e Antipiréticos',
    precisa_receita: false,
    descricao: '',
  });

  // Order status modal
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('Em análise');
  const [orderStatusNote, setOrderStatusNote] = useState('');

  // Photo Upload Modal
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoDesc, setNewPhotoDesc] = useState('');

  // Batch CSV/Excel Stock Import Modal
  const [showBatchImportModal, setShowBatchImportModal] = useState(false);

  // Delete Stock confirmation
  const [deletingStockId, setDeletingStockId] = useState<string | null>(null);

  // Success toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // State to track if director dismissed the "Cadastro aprovado com sucesso" banner
  const [dismissedApprovedBanners, setDismissedApprovedBanners] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('farmalink_dismissed_approved_banners');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleDismissApprovalBanner = (pharmacyId: string) => {
    setDismissedApprovedBanners((prev) => {
      const updated = [...prev, pharmacyId];
      try {
        localStorage.setItem('farmalink_dismissed_approved_banners', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Auto-Save Draft on Form change (Requirement #10)
  useEffect(() => {
    if (!myPharmacy || myPharmacy.status !== 'Aprovada') {
      const timer = setTimeout(() => {
        FarmaLinkDB.saveDraft({
          user_id: currentUser.user_id,
          ...formData,
          fotos: [],
        });
        setDraftSavedMsg('Rascunho salvo automaticamente.');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, currentUser.user_id, myPharmacy]);

  const startNewPharmacyRegistration = () => {
    setIsRegisteringNewPharmacy(true);
    setSelectedPharmacyId(null);
    setFormData({
      nome: '',
      nuit: '',
      license_number: '',
      director_name: currentUser.nome || 'Grácio César',
      numero_profissional: currentUser.numero_profissional || '',
      telefone: currentUser.telefone || '+258 84 123 4567',
      email: currentUser.email || 'gracioalicete7@gmail.com',
      endereco: '',
      bairro: currentUser.bairro || 'Francisco Manyanga',
      cidade: 'Cidade de Tete',
      provincia: 'Tete',
      latitude: TETE_CENTER.latitude,
      longitude: TETE_CENTER.longitude,
      horario: '08:00 - 20:00',
      dias_funcionamento: 'Segunda a Sábado',
      descricao: '',
      motivacao_cadastro: 'Promover o acesso ágil e transparente a medicamentos essenciais em Tete.',
      logo_url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=200&auto=format&fit=crop&q=80',
      access_code: '',
      pin: '2026',
      aceita_seguro: false,
      seguradoras: [],
      instrucoes_seguro: '',
      tipo_estabelecimento: 'farmacia_comunitaria',
    });
    setActiveSubTab('register');
  };

  // Handle Submit Registration to Admin (Manual Approval Workflow)
  const handleSubmitPharmacyRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = isRegisteringNewPharmacy || !myPharmacy || (myPharmacy && formData.nome.trim().toLowerCase() !== myPharmacy.nome.toLowerCase());
    const targetPharmacyId = isNew
      ? `pharm-${Date.now()}`
      : myPharmacy.id;

    // Standard manual approval workflow: New registrations enter as 'Pendente' for Admin review
    const targetStatus: PharmacyStatus = isNew
      ? 'Pendente'
      : (myPharmacy?.status || 'Pendente');

    const nowIso = new Date().toISOString();
    const cleanDirectorName = (formData.director_name && formData.director_name.trim()) || currentUser.nome || 'Grácio César';
    const newPharmacy: Pharmacy = {
      id: targetPharmacyId,
      nome: formData.nome.trim(),
      nuit: formData.nuit.trim(),
      license_number: formData.license_number.trim(),
      director_id: currentUser.user_id || currentUser.id,
      director_name: cleanDirectorName,
      telefone: formData.telefone.trim(),
      email: formData.email.trim(),
      endereco: formData.endereco.trim(),
      bairro: formData.bairro,
      cidade: formData.cidade,
      provincia: formData.provincia,
      latitude: formData.latitude,
      longitude: formData.longitude,
      horario: formData.horario.trim(),
      dias_funcionamento: formData.dias_funcionamento.trim(),
      descricao: formData.descricao.trim(),
      motivacao_cadastro: formData.motivacao_cadastro?.trim(),
      logo_url: formData.logo_url?.trim() || 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=200&auto=format&fit=crop&q=80',
      access_code: formData.access_code?.trim().toUpperCase() || (!isNew ? myPharmacy?.access_code : '') || `${formData.nome.split(' ')[0]?.toUpperCase().replace(/[^A-Z]/g, '') || 'FARMA'}-${Math.floor(1000 + Math.random() * 9000)}`,
      pin: formData.pin?.trim() || (!isNew ? myPharmacy?.pin : '') || '2026',
      aceita_seguro: Boolean(formData.aceita_seguro),
      seguradoras: formData.seguradoras || [],
      instrucoes_seguro: formData.instrucoes_seguro?.trim() || '',
      tipo_estabelecimento: formData.tipo_estabelecimento as any,
      status: targetStatus,
      is_verified: targetStatus === 'Aprovada',
      auto_approved: false,
      created_at: !isNew && myPharmacy ? myPharmacy.created_at : nowIso,
      updated_at: nowIso,
    };

    FarmaLinkDB.savePharmacy(newPharmacy, currentUser);
    FarmaLinkDB.clearDraft(currentUser.user_id);
    CloudSync.syncPharmacy(newPharmacy);

    // Seed essential medicine stock template immediately so director can see and edit medicines
    FarmaLinkDB.seedEssentialStockForPharmacy(newPharmacy.id, currentUser);

    setSelectedPharmacyId(newPharmacy.id);
    localStorage.setItem('farmalink_last_active_pharmacy_id', newPharmacy.id);
    setIsRegisteringNewPharmacy(false);

    // Update current user's profile with pharmacy_id and ensure director role
    const updatedUser: UserProfile = {
      ...currentUser,
      pharmacy_id: newPharmacy.id,
      role: currentUser.role === 'admin' || currentUser.role === 'superadmin' ? currentUser.role : 'director',
    };
    FarmaLinkDB.saveProfile(updatedUser);
    CloudSync.syncProfile(updatedUser);
    FarmaLinkDB.setCurrentUser(updatedUser);
    if (onSwitchUser) onSwitchUser(updatedUser);

    if (isNew) {
      // Notify Administrator for audit and approval
      FarmaLinkDB.addNotification({
        user_id: 'admin-1',
        titulo: `Novo Pedido de Cadastro: ${formData.nome}`,
        mensagem: `A farmácia "${formData.nome}" (${formData.bairro}) foi cadastrada pelo Director Técnico Dr. ${formData.director_name} e está na fila de aprovação no Painel do Administrador.`,
        tipo: 'pharmacy_approval',
        link: 'admin-approvals',
      });
      showToast(`Farmácia "${newPharmacy.nome}" cadastrada com sucesso! Abrindo tela de medicamentos para gerir o estoque.`);
    } else {
      showToast(`Dados da farmácia "${newPharmacy.nome}" atualizados com sucesso!`);
    }

    triggerRefresh();
    setActiveSubTab('medicines');
  };

  // Instant Approval for immediate testing or administrator override
  const handleInstantApprove = () => {
    if (!myPharmacy) return;
    FarmaLinkDB.updatePharmacyStatus(myPharmacy.id, 'Aprovada', 'Homologação aprovada para testes/operação em Tete', currentUser);
    CloudSync.syncPharmacy({ ...myPharmacy, status: 'Aprovada' });
    showToast(`Farmácia "${myPharmacy.nome}" foi aprovada e homologada com sucesso!`);
    triggerRefresh();
  };

  // Helpers for stock expiration calculation
  const isStockExpired = (validade?: string) => {
    if (!validade) return false;
    const expDate = new Date(validade).getTime();
    return expDate < Date.now();
  };

  const isStockExpiringSoon = (validade?: string) => {
    if (!validade) return false;
    const expDate = new Date(validade).getTime();
    const diffDays = (expDate - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 90;
  };

  // Stock Save Handler (Handles medicine, validity, lot, and quarantine settings)
  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPharmacy) return;

    let targetMedicineId = selectedMedId;

    // If Director is creating a brand new medicine in catalog
    if (modalMode === 'new' && !editingStock) {
      if (!newMedData.nome.trim() || !newMedData.principio_ativo.trim()) {
        alert('Por favor preencha o Nome e o Princípio Ativo do medicamento.');
        return;
      }

      const generatedMedId = `med-${Date.now().toString().slice(-6)}`;
      const newMed: Medicine = {
        id: generatedMedId,
        nome: newMedData.nome.trim(),
        principio_ativo: newMedData.principio_ativo.trim(),
        concentracao: newMedData.concentracao.trim() || 'Dose padrão',
        forma_farmaceutica: newMedData.forma_farmaceutica,
        apresentacao: `${newMedData.forma_farmaceutica} (${newMedData.concentracao || 'Dose padrão'})`,
        categoria: newMedData.categoria,
        precisa_receita: newMedData.precisa_receita,
        descricao:
          newMedData.descricao.trim() ||
          `Medicamento ${newMedData.nome} cadastrado pelo Director Técnico da ${myPharmacy.nome}.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      FarmaLinkDB.saveMedicine(newMed, currentUser);
      targetMedicineId = generatedMedId;
    }

    if (!targetMedicineId) {
      alert('Selecione ou cadastre um medicamento válido.');
      return;
    }

    const pmId = editingStock?.id || `pm-${myPharmacy.id}-${targetMedicineId}`;

    const stockRecord: PharmacyMedicine = {
      id: pmId,
      pharmacy_id: myPharmacy.id,
      medicine_id: targetMedicineId,
      quantidade: stockQty,
      unidade: stockUnidade,
      preco: stockPrice === '' ? null : Number(stockPrice),
      disponibilidade: stockDisponibilidade,
      data_validade: stockValidade ? stockValidade : undefined,
      lote: stockLote.trim() ? stockLote.trim().toUpperCase() : undefined,
      em_quarentena: stockEmQuarentena,
      motivo_quarentena: stockEmQuarentena ? (stockMotivoQuarentena.trim() || 'Retenção sanitária preventiva') : undefined,
      data_quarentena: stockEmQuarentena ? (editingStock?.data_quarentena || new Date().toISOString()) : undefined,
      ultima_atualizacao: new Date().toISOString(),
      created_at: editingStock?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    FarmaLinkDB.savePharmacyMedicine(stockRecord, currentUser);
    CloudSync.syncStock(stockRecord);

    showToast(
      editingStock
        ? 'Estoque, validade e lote do medicamento atualizados com sucesso!'
        : 'Novo medicamento com validade e lote cadastrado com sucesso!'
    );

    setShowAddMedicineModal(false);
    setEditingStock(null);
    setStockValidade('');
    setStockLote('');
    setStockEmQuarentena(false);
    setStockMotivoQuarentena('');
    setNewMedData({
      nome: '',
      principio_ativo: '',
      concentracao: '',
      forma_farmaceutica: 'Comprimidos',
      categoria: 'Analgésicos e Antipiréticos',
      precisa_receita: false,
      descricao: '',
    });
    triggerRefresh();
  };

  // Quarantine Handlers
  const handleQuarantineStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarantineModalStock || !quarantineModalReason.trim()) return;

    FarmaLinkDB.quarantinePharmacyMedicine(
      quarantineModalStock.id,
      quarantineModalReason.trim(),
      currentUser
    );
    showToast('Medicamento colocado em quarentena sanitária com sucesso.');
    setQuarantineModalStock(null);
    setQuarantineModalReason('Desvio de temperatura na conservação');
    triggerRefresh();
  };

  const handleReleaseQuarantine = (stockId: string) => {
    FarmaLinkDB.releaseFromQuarantine(stockId, currentUser);
    showToast('Medicamento liberado da quarentena sanitária e reintegrado ao estoque público!');
    triggerRefresh();
  };

  // Discard Expired Medicine Handler
  const handleDiscardExpiredSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discardModalStock) return;

    FarmaLinkDB.discardExpiredMedicine(
      discardModalStock.id,
      discardModalReason.trim() || 'Prazo de validade expirado',
      currentUser
    );
    showToast('Medicamento expirado removido e registrado no Livro de Descarte Sanitário com sucesso.');
    setDiscardModalStock(null);
    setDiscardModalReason('Prazo de validade expirado');
    triggerRefresh();
  };

  const handleConfirmDeleteStock = () => {
    if (!deletingStockId) return;
    FarmaLinkDB.deletePharmacyMedicine(deletingStockId, currentUser);
    CloudSync.deleteStock(deletingStockId);
    showToast('Medicamento removido com sucesso do estoque da farmácia.');
    setDeletingStockId(null);
    triggerRefresh();
  };

  // Access Code Entry (Director entering with custom code / PIN)
  const handleAccessCodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessCodeError(null);
    if (!enteredAccessCode.trim()) {
      setAccessCodeError('Por favor digite o código de acesso da farmácia.');
      return;
    }

    const foundPharmacy = FarmaLinkDB.getPharmacyByAccessCode(enteredAccessCode.trim());
    if (!foundPharmacy) {
      setAccessCodeError('Código de acesso não localizado no sistema. Verifique o código e tente novamente.');
      return;
    }

    if (foundPharmacy.pin && enteredPin && foundPharmacy.pin.trim() !== enteredPin.trim()) {
      setAccessCodeError('PIN de segurança incorreto para esta farmácia.');
      return;
    }

    setSelectedPharmacyId(foundPharmacy.id);
    setShowAccessCodeModal(false);
    setEnteredAccessCode('');
    setEnteredPin('');
    showToast(`Painel desbloqueado com sucesso para "${foundPharmacy.nome}"!`);
    setActiveSubTab('medicines');
    triggerRefresh();
  };

  // Update Custom Access Code & PIN for Pharmacy (Full Self-Service for Director)
  const handleSaveAccessCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPharmacy) return;
    const cleanCode = customAccessCode.trim().toUpperCase().replace(/\s+/g, '-');
    if (!cleanCode || cleanCode.length < 3) {
      alert('Por favor insira um código de acesso com pelo menos 3 caracteres (ex: MAIS-SAUDE, MINHA-FARMACIA).');
      return;
    }

    // Check if another pharmacy already uses this code
    const existingPharm = FarmaLinkDB.getPharmacies().find(
      (p) => p.id !== myPharmacy.id && p.access_code && p.access_code.trim().toUpperCase() === cleanCode
    );
    if (existingPharm) {
      alert(`O código "${cleanCode}" já está sendo utilizado por outra farmácia (${existingPharm.nome}). Por favor, escolha outro código exclusivo.`);
      return;
    }

    const cleanPin = customPin.trim() || undefined;

    const updated = FarmaLinkDB.updatePharmacyAccessCode(
      myPharmacy.id,
      cleanCode,
      cleanPin,
      currentUser
    );

    if (updated) {
      CloudSync.syncPharmacy(updated);
    }

    // Update form data state
    setFormData((prev) => ({
      ...prev,
      access_code: cleanCode,
      pin: cleanPin || '',
    }));

    showToast(`Chave de acesso "${cleanCode}" ${cleanPin ? `(PIN: ${cleanPin})` : ''} salva com sucesso!`);
    setShowEditCodeModal(false);
    triggerRefresh();
  };

  // Remove stock item handler
  const handleDeleteStock = (pmId: string) => {
    FarmaLinkDB.deletePharmacyMedicine(pmId, currentUser);
    setDeletingStockId(null);
    showToast('Medicamento removido do estoque da sua farmácia.');
    triggerRefresh();
  };

  // Seed Essential Stock Kit handler (10 essential medications with prices and batches)
  const handleSeedEssentialKit = () => {
    if (!myPharmacy) return;
    const count = FarmaLinkDB.seedEssentialStockForPharmacy(myPharmacy.id, currentUser);
    showToast(`Kit Essencial carregado! ${count} medicamentos adicionados ao catálogo com preços e validades.`);
    triggerRefresh();
    window.dispatchEvent(new Event('farmalink_storage_updated'));
  };

  // Order status update handler
  const handleUpdateOrderStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrder) return;

    const updatedOrder = FarmaLinkDB.updateOrderStatus(
      updatingOrder.id,
      newOrderStatus,
      orderStatusNote.trim() || undefined,
      currentUser
    );

    if (updatedOrder) {
      CloudSync.syncOrder(updatedOrder);
    }

    showToast(`Estado do Pedido #${updatingOrder.id.toUpperCase()} alterado para "${newOrderStatus}".`);
    setUpdatingOrder(null);
    setOrderStatusNote('');
    triggerRefresh();
  };

  // Add Photo Handler
  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPharmacy || !newPhotoUrl.trim()) return;

    const newPhoto: PharmacyPhoto = {
      id: `photo-${Date.now().toString().slice(-6)}`,
      pharmacy_id: myPharmacy.id,
      image_url: newPhotoUrl.trim(),
      type: 'fachada',
      caption: newPhotoDesc.trim() || 'Fotografia das instalações da farmácia',
      created_at: new Date().toISOString(),
    };

    FarmaLinkDB.savePhoto(newPhoto);
    showToast('Fotografia adicionada à galeria da farmácia com sucesso!');
    setShowAddPhotoModal(false);
    setNewPhotoUrl('');
    setNewPhotoDesc('');
    triggerRefresh();
  };

  // Delete Photo Handler
  const handleDeletePhoto = (photoId: string) => {
    FarmaLinkDB.deletePhoto(photoId);
    showToast('Fotografia removida da galeria.');
    triggerRefresh();
  };

  // Filtered Stock list
  const filteredStocks = myStocks.filter((stock) => {
    const med = allMedicines.find((m) => m.id === stock.medicine_id);
    if (!med) return false;

    const matchesSearch =
      med.nome.toLowerCase().includes(medSearchTerm.toLowerCase()) ||
      med.principio_ativo.toLowerCase().includes(medSearchTerm.toLowerCase()) ||
      med.categoria.toLowerCase().includes(medSearchTerm.toLowerCase()) ||
      (stock.lote && stock.lote.toLowerCase().includes(medSearchTerm.toLowerCase()));

    const matchesAvail =
      medAvailabilityFilter === 'Todos' || stock.disponibilidade === medAvailabilityFilter;

    let matchesHealth = true;
    if (medHealthFilter === 'available') {
      matchesHealth = !stock.em_quarentena && stock.disponibilidade === 'Disponível' && !isStockExpired(stock.data_validade);
    } else if (medHealthFilter === 'low_stock') {
      matchesHealth = !stock.em_quarentena && stock.quantidade <= 10;
    } else if (medHealthFilter === 'quarantine') {
      matchesHealth = stock.em_quarentena === true;
    } else if (medHealthFilter === 'expiring_soon') {
      matchesHealth = !stock.em_quarentena && isStockExpiringSoon(stock.data_validade);
    } else if (medHealthFilter === 'expired') {
      matchesHealth = isStockExpired(stock.data_validade);
    }

    return matchesSearch && matchesAvail && matchesHealth;
  });

  // Filtered Orders list
  const filteredOrders = myOrders.filter((order) => {
    const matchesStatus =
      orderStatusFilter === 'Todos'
        ? true
        : orderStatusFilter === 'Pendentes'
        ? ['Enviado', 'Recebido', 'Em análise'].includes(order.status)
        : order.status === orderStatusFilter;

    const matchesSearch =
      order.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      order.medicine_nome.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      order.user_nome.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      order.user_telefone.includes(orderSearchTerm);

    return matchesStatus && matchesSearch;
  });

  return (
    <div id="director-portal-view" className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title="Portal do Director Técnico"
          subtitle={myPharmacy ? myPharmacy.nome : 'Gestão Farmacêutica em Tete'}
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
        />
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-850 via-emerald-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-emerald-700/60 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Portal Oficial do Director Técnico de Farmácia</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">
              {myPharmacy ? myPharmacy.nome : 'Gestão Farmacêutica em Tete'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
              Director Técnico: <strong>{currentUser.nome}</strong> • {currentUser.numero_profissional || 'Carteira Farmacêutica OFM'}
            </p>
          </div>

          {myPharmacy ? (
            <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                  myPharmacy.status === 'Aprovada'
                    ? 'bg-emerald-500 text-white'
                    : myPharmacy.status === 'Necessita correção'
                    ? 'bg-amber-500 text-white'
                    : myPharmacy.status === 'Rejeitada'
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>Estado: {myPharmacy.status}</span>
              </span>
              <span className="text-[11px] text-emerald-200">
                NUIT: {myPharmacy.nuit} • Bairro {myPharmacy.bairro}
              </span>
              {myPharmacy.status === 'Aprovada' && (
                <button
                  type="button"
                  onClick={() => onNavigate('pharmacy-detail', { pharmacyId: myPharmacy.id })}
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-white font-bold underline"
                >
                  <Eye className="w-3 h-3" />
                  <span>Ver página pública no mapa</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startNewPharmacyRegistration()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Nova Farmácia</span>
            </button>
          )}
        </div>

        {/* Sub-Navigation Tabs & Access Code Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-emerald-700/60">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'dashboard'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-700/60'
              }`}
            >
              Visão Geral
            </button>

            {myPharmacy && (
              <>
                <button
                  type="button"
                  id="director-nav-medicines"
                  onClick={() => setActiveSubTab('medicines')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeSubTab === 'medicines'
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-emerald-100 hover:bg-emerald-700/60'
                  }`}
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span>Estoque & Validades ({myStocks.length})</span>
                </button>

                <button
                  type="button"
                  id="director-nav-orders"
                  onClick={() => setActiveSubTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeSubTab === 'orders'
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-emerald-100 hover:bg-emerald-700/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Pedidos Recebidos ({myOrders.length})</span>
                  {myOrders.filter((o) => ['Enviado', 'Recebido', 'Em análise'].includes(o.status)).length > 0 && (
                    <span className="w-5 h-5 bg-amber-400 text-slate-900 rounded-full text-[10px] flex items-center justify-center font-black">
                      {myOrders.filter((o) => ['Enviado', 'Recebido', 'Em análise'].includes(o.status)).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="director-nav-analytics"
                  onClick={() => setActiveSubTab('analytics')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeSubTab === 'analytics'
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-emerald-100 hover:bg-emerald-700/60'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Relatórios & Procura</span>
                </button>

                <button
                  type="button"
                  id="director-nav-photos"
                  onClick={() => setActiveSubTab('photos')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeSubTab === 'photos'
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-emerald-100 hover:bg-emerald-700/60'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Fotos da Farmácia ({myPhotos.length})</span>
                </button>
              </>
            )}

            <button
              type="button"
              id="director-nav-register"
              onClick={() => setActiveSubTab('register')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'register'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-700/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{myPharmacy ? 'Dados & Alvará' : 'Cadastrar Farmácia'}</span>
            </button>
          </div>

          {/* Quick Access Code Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {myPharmacy && (
              <button
                type="button"
                id="director-manage-code-btn"
                onClick={() => {
                  setCustomAccessCode(myPharmacy.access_code || '');
                  setCustomPin(myPharmacy.pin || '');
                  setShowEditCodeModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-700/70 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-600/60"
                title="Configurar ou alterar código de acesso e PIN da farmácia"
              >
                <Key className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  Código:{' '}
                  <strong className="text-white font-mono">{myPharmacy.access_code || 'Não criado'}</strong>
                </span>
              </button>
            )}

            <button
              type="button"
              id="director-enter-code-btn"
              onClick={() => {
                setAccessCodeError(null);
                setShowAccessCodeModal(true);
              }}
              className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Entrar com Código</span>
            </button>

            {allPharmacies.length > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-700/80 rounded-xl px-2.5 py-1">
                <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-200 hidden md:inline">Farmácia:</span>
                <select
                  value={myPharmacy?.id || ''}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setSelectedPharmacyId(chosenId);
                    localStorage.setItem('farmalink_last_active_pharmacy_id', chosenId);
                    setIsRegisteringNewPharmacy(false);
                    triggerRefresh();
                  }}
                  className="bg-transparent text-emerald-100 text-xs font-extrabold focus:outline-none cursor-pointer max-w-full sm:max-w-xs md:max-w-sm"
                >
                  {allPharmacies.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.nome} ({p.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => startNewPharmacyRegistration()}
              className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-emerald-500/80 shadow-xs cursor-pointer"
              title="Cadastrar uma nova farmácia em Tete"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Farmácia</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {!myPharmacy ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto">
                <Store className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Nenhuma Farmácia Vinculada a este Perfil</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Está autenticado como <strong>{currentUser.nome}</strong>. Inicie o cadastro oficial da sua farmácia na Cidade de Tete para disponibilizar medicamentos, horários e atendimento aos utentes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  id="director-start-register-btn"
                  onClick={() => startNewPharmacyRegistration()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Iniciar Cadastro da Minha Farmácia</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Notificação Especial Exclusiva para o Director Técnico: Cadastro Aprovado com Sucesso */}
              {myPharmacy.status === 'Aprovada' && !dismissedApprovedBanners.includes(myPharmacy.id) && (
                <div
                  id="director-approved-notification-banner"
                  className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-400/80 shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

                  <div className="flex items-start justify-between gap-3 sm:gap-4 relative z-10">
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                            Notificação do Sistema
                          </span>
                          <span className="text-[11px] text-emerald-200/80 font-medium">
                            Homologação Concluída
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                          Cadastro aprovado com sucesso!
                        </h3>
                        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
                          A sua farmácia <strong className="text-white font-bold">{myPharmacy.nome}</strong> foi aprovada pelo Administrador. A sua farmácia já está ativa, visível aos utentes no mapa da Cidade de Tete e pronta para receber reservas e pedidos.
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveSubTab('medicines')}
                            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Pill className="w-3.5 h-3.5" />
                            <span>Gerir Estoque de Medicamentos</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate('pharmacy-detail', { pharmacyId: myPharmacy.id })}
                            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-emerald-200 hover:text-white text-xs font-bold rounded-xl border border-emerald-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ver Página Pública</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="dismiss-approved-banner-btn"
                      onClick={() => handleDismissApprovalBanner(myPharmacy.id)}
                      className="text-emerald-300 hover:text-white hover:bg-emerald-800/60 p-2 rounded-xl transition-all cursor-pointer shrink-0"
                      title="Fechar notificação"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Notificação Especial: Aprovação Automática Provisória (Auditoria Posterior) */}
              {myPharmacy.status === 'Aprovação Provisória' && (
                <div
                  id="director-provisional-approval-banner"
                  className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-400/80 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

                  <div className="flex items-start justify-between gap-3 sm:gap-4 relative z-10">
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                        <Sparkles className="w-6 h-6 text-amber-300" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                            ⚡ Aprovação Automática Provisória
                          </span>
                          <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                            Conformidade Documental: {myPharmacy.compliance_score || 100}%
                          </span>
                          <span className="text-[11px] text-emerald-200/90 font-medium">
                            Auditoria Posterior (14 dias)
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                          A sua farmácia está ONLINE e aberta ao público!
                        </h3>
                        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
                          Graças à conformidade completa do NUIT e Alvará Sanitário, a <strong className="text-white font-bold">{myPharmacy.nome}</strong> foi aprovada provisoriamente de forma imediata. O seu catálogo já está ativo no FarmaLink Tete para atender pacientes. A homologação formal definitiva será realizada pelo Administrador Provincial por auditoria posterior sem interrupção dos seus serviços.
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveSubTab('medicines')}
                            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Pill className="w-3.5 h-3.5" />
                            <span>Gerir Medicamentos & Stock de Balcão</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate('pharmacy-detail', { pharmacyId: myPharmacy.id })}
                            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-emerald-200 hover:text-white text-xs font-bold rounded-xl border border-emerald-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ver Página Pública no Mapa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {myPharmacy.status !== 'Aprovada' && myPharmacy.status !== 'Aprovação Provisória' && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-amber-200/90 space-y-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap justify-between">
                        <h3 className="font-bold text-slate-900 text-lg">
                          Estado do Cadastro da Farmácia: <span className="text-amber-700 font-extrabold">{myPharmacy.status}</span>
                        </h3>
                        <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-xl">
                          Em Análise DPS Tete
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600">
                        O cadastro da farmácia <strong className="text-slate-900">{myPharmacy.nome}</strong> foi enviado. Você já pode <strong>cadastrar todos os seus medicamentos, lotes, preços e validades</strong> na aba <em>"Estoque & Validades"</em> para preparar o catálogo da farmácia!
                      </p>

                      {myPharmacy.motivacao_cadastro && (
                        <div className="mt-2 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900">
                          <span className="font-bold block mb-0.5 text-emerald-950">Motivação Apresentada:</span>
                          <p className="italic text-slate-700">"{myPharmacy.motivacao_cadastro}"</p>
                        </div>
                      )}
                      {myPharmacy.rejection_reason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900">
                          <span className="font-bold block mb-0.5">Nota do Administrador:</span>
                          {myPharmacy.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions to directly manage medicines or instantly approve */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        id="pending-go-to-medicines-btn"
                        onClick={() => setActiveSubTab('medicines')}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Pill className="w-4 h-4" />
                        <span>Adicionar Medicamentos ao Estoque ({myStocks.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowBatchImportModal(true)}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Importar Excel / CSV</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleInstantApprove}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Aprova a farmácia imediatamente para liberar todos os recursos"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-100" />
                        <span>Aprovar Farmácia Agora (Modo Teste)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSubTab('register')}
                        className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Editar Dados
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Chave de Acesso & PIN do Director Técnico (Controlo Total do Proprietário) */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-800/80 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                      <Key className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base sm:text-lg text-white">
                          Chave de Acesso & PIN do Director Técnico
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                          Acesso Livre & Direto
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Como proprietário ou diretor técnico, você tem total autonomia para <strong>definir o seu próprio código</strong> (ex: <span className="text-amber-200 font-mono font-bold">MAIS-SAUDE</span> ou <span className="text-amber-200 font-mono font-bold">MINHA-FARMACIA</span>) e PIN para entrar diretamente no seu painel em qualquer telemóvel ou tablet.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      id="edit-director-credentials-main-btn"
                      onClick={() => {
                        setCustomAccessCode(myPharmacy.access_code || '');
                        setCustomPin(myPharmacy.pin || '');
                        setShowEditCodeModal(true);
                      }}
                      className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-slate-950" />
                      <span>Editar Meu Código / PIN</span>
                    </button>
                  </div>
                </div>

                {/* Display Credentials Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-emerald-800/60 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-emerald-700/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Código de Acesso:</span>
                      <strong className="text-amber-300 font-mono text-sm tracking-wider font-extrabold">
                        {myPharmacy.access_code || 'NÃO CONFIGURADO'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (myPharmacy.access_code) {
                          navigator.clipboard.writeText(myPharmacy.access_code);
                          showToast(`Código "${myPharmacy.access_code}" copiado!`);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                      title="Copiar código"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-emerald-700/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">PIN Rápido:</span>
                      <strong className="text-emerald-300 font-mono text-sm tracking-wider font-extrabold">
                        {myPharmacy.pin || 'Sem PIN (Livre)'}
                      </strong>
                    </div>
                    {myPharmacy.pin && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(myPharmacy.pin || '');
                          showToast(`PIN "${myPharmacy.pin}" copiado!`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                        title="Copiar PIN"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-emerald-700/50 flex items-center gap-2 sm:col-span-2 lg:col-span-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-slate-300">
                      Sincronizado na Nuvem & pronto para acesso no app instalado
                    </span>
                  </div>
                </div>
              </div>

              {/* Ficha Cadastral Completa da Farmácia & Direcção Técnica (Informações Transparentes) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Ficha Oficial da Farmácia
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          myPharmacy.status === 'Aprovada'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : myPharmacy.status === 'Aprovação Provisória'
                            ? 'bg-teal-100 text-teal-900 border border-teal-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        Status: {myPharmacy.status}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 break-words">
                      {myPharmacy.nome}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('register')}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Actualizar Dados</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('pharmacy-detail', { pharmacyId: myPharmacy.id })}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Perfil Público</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* Director Técnico */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      Director Técnico / Proprietário:
                    </span>
                    <p className="text-base font-extrabold text-emerald-950 break-words">
                      {myPharmacy.director_name}
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Responsável Técnico Farmacêutico Homologado
                    </p>
                  </div>

                  {/* Licença & NUIT */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Alvará Sanitário & NUIT Fiscal:
                    </span>
                    <p className="text-sm font-bold text-slate-900 font-mono break-words">
                      {myPharmacy.license_number || 'Em tramitação DPS'}
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      NUIT: <strong className="text-slate-900">{myPharmacy.nuit || 'Não especificado'}</strong>
                    </p>
                  </div>

                  {/* Localização em Tete */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Localização & Bairro:
                    </span>
                    <p className="text-xs font-bold text-slate-900 flex items-start gap-1 break-words">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        {myPharmacy.endereco}, Bairro <strong>{myPharmacy.bairro}</strong> — {myPharmacy.cidade}
                      </span>
                    </p>
                  </div>

                  {/* Contacto & WhatsApp */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Telefone & WhatsApp:
                    </span>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <a href={`tel:${myPharmacy.telefone}`} className="hover:underline text-emerald-800 font-bold">
                        {myPharmacy.telefone}
                      </a>
                    </p>
                    {myPharmacy.email && (
                      <p className="text-[11px] text-slate-600 flex items-center gap-1 break-words">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{myPharmacy.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Horário de Atendimento */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Horário de Funcionamento:
                    </span>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{myPharmacy.horario}</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Dias: <strong>{myPharmacy.dias_funcionamento || 'Segunda a Sábado'}</strong>
                    </p>
                  </div>

                  {/* Código de Gestão Rápida */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Código de Acesso Rápido:
                    </span>
                    <p className="text-sm font-mono font-black text-amber-800">
                      {myPharmacy.access_code || 'Não configurado'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      PIN: {myPharmacy.pin || 'Livre'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Medicamentos</span>
                    <Pill className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{myStocks.length}</p>
                  <span className="text-[11px] text-slate-400">Em estoque na farmácia</span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-800 font-semibold">Disponíveis</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                    {myStocks.filter((s) => s.disponibilidade === 'Disponível').length}
                  </p>
                  <span className="text-[11px] text-emerald-700/80">Prontos para reserva</span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-800 font-semibold">Pedidos Totais</span>
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">{myOrders.length}</p>
                  <span className="text-[11px] text-blue-700/80">Solicitações de utentes</span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-800 font-semibold">Pendentes</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">
                    {myOrders.filter((o) => ['Enviado', 'Recebido', 'Em análise'].includes(o.status)).length}
                  </p>
                  <span className="text-[11px] text-amber-700/80">Aguardam resposta</span>
                </div>
              </div>

              {/* Expiry & Lot Warning Cards for Pharmacy Owner */}
              {(() => {
                const expiringCount = myStocks.filter((s) => !s.em_quarentena && isStockExpiringSoon(s.data_validade)).length;
                const expiredCount = myStocks.filter((s) => isStockExpired(s.data_validade)).length;
                const lowStockCount = myStocks.filter((s) => !s.em_quarentena && s.quantidade <= 10).length;

                if (expiringCount === 0 && expiredCount === 0 && lowStockCount === 0) return null;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {expiredCount > 0 && (
                      <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded">
                            Atenção Sanitária
                          </span>
                          <h4 className="font-extrabold text-sm text-rose-950">
                            {expiredCount} {expiredCount === 1 ? 'medicamento vencido' : 'medicamentos vencidos'}
                          </h4>
                          <p className="text-xs text-rose-800">
                            Retire do estoque público ou coloque em quarentena imediatamente.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubTab('medicines');
                            setMedHealthFilter('expired');
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs shrink-0 cursor-pointer"
                        >
                          Verificar
                        </button>
                      </div>
                    )}

                    {expiringCount > 0 && (
                      <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 bg-orange-200/80 px-2 py-0.5 rounded">
                            Validade Próxima
                          </span>
                          <h4 className="font-extrabold text-sm text-orange-950">
                            {expiringCount} {expiringCount === 1 ? 'medicamento a vencer' : 'medicamentos a vencer'} (≤ 90 dias)
                          </h4>
                          <p className="text-xs text-orange-800">
                            Planeje promoções ou queima rápida de lote para evitar perdas financeiras.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubTab('medicines');
                            setMedHealthFilter('expiring_soon');
                          }}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-2xs shrink-0 cursor-pointer"
                        >
                          Verificar
                        </button>
                      </div>
                    )}

                    {lowStockCount > 0 && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                            Estoque Baixo
                          </span>
                          <h4 className="font-extrabold text-sm text-amber-950">
                            {lowStockCount} {lowStockCount === 1 ? 'medicamento com poucas unidades' : 'medicamentos com poucas unidades'}
                          </h4>
                          <p className="text-xs text-amber-800">
                            Reponha o estoque com os distribuidores farmacêuticos.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubTab('medicines');
                            setMedHealthFilter('low_stock');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs shrink-0 cursor-pointer"
                        >
                          Repor
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Quick Actions Bar */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    id="director-open-master-catalog-dash-btn"
                    onClick={() => setShowMasterCatalogModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 hover:from-emerald-700 hover:to-teal-850 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 border border-emerald-500/30 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Catálogo Mestre (5.000+ Medicamentos)</span>
                  </button>

                  <button
                    type="button"
                    id="director-quick-add-med-btn"
                    onClick={() => {
                      setEditingStock(null);
                      setModalMode('new');
                      setSelectedMedId(allMedicines[0]?.id || '');
                      setStockQty(50);
                      setStockPrice(150);
                      setStockDisponibilidade('Disponível');
                      setStockUnidade('caixas');
                      setShowAddMedicineModal(true);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Novo Medicamento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingStock(null);
                      setModalMode('existing');
                      setSelectedMedId(allMedicines[0]?.id || '');
                      setStockQty(50);
                      setStockPrice(150);
                      setStockDisponibilidade('Disponível');
                      setStockUnidade('caixas');
                      setShowAddMedicineModal(true);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Vincular do Catálogo Geral</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('orders')}
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-700" />
                    <span>Gerir Pedidos ({myOrders.length})</span>
                  </button>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">Pedidos Recentes Recebidos</h3>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('orders')}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>Ver todos ({myOrders.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {myOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Nenhum pedido recebido ainda.</p>
                ) : (
                  <div className="space-y-2.5">
                    {myOrders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-400">#{order.id.toUpperCase()}</span>
                            <span className="font-bold text-slate-900 text-sm">{order.medicine_nome}</span>
                            <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-bold">
                              Qtd: {order.quantidade}
                            </span>
                          </div>
                          <p className="text-slate-500">
                            Utente: <strong className="text-slate-700">{order.user_nome}</strong> ({order.user_telefone})
                          </p>
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <span
                            className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                              order.status === 'Pronto para levantamento' || order.status === 'Concluído'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'Rejeitado' || order.status === 'Não disponível'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setUpdatingOrder(order);
                              setNewOrderStatus(order.status);
                              setOrderStatusNote(order.status_note || '');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                          >
                            Atender
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: MEDICINES & STOCK MANAGEMENT */}
      {activeSubTab === 'medicines' && myPharmacy && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Gestão de Medicamentos, Validades & Quarentena
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadastre novos medicamentos com prazo de validade e lote, controle quarentenas sanitárias e remova medicamentos expirados da <strong className="text-emerald-800">{myPharmacy.nome}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                id="director-open-master-catalog-btn"
                onClick={() => setShowMasterCatalogModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 hover:from-emerald-700 hover:to-teal-850 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all border border-emerald-500/40 cursor-pointer"
                title="Abrir Catálogo Mestre Nacional e Internacional com mais de 5.000 medicamentos pré-formatados"
              >
                <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>Catálogo Mestre (5.000+)</span>
              </button>

              <button
                type="button"
                id="director-seed-essential-kit-btn"
                onClick={handleSeedEssentialKit}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Carregar rapidamente 10 medicamentos essenciais de alta rotatividade com preços em Meticais e validades válidas"
              >
                <Zap className="w-4 h-4 text-amber-200" />
                <span>Kit Essencial (10 Itens)</span>
              </button>

              <button
                type="button"
                id="director-open-batch-import-btn"
                onClick={() => setShowBatchImportModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl shadow-2xs flex items-center gap-1.5 transition-all border border-slate-200"
                title="Importar catálogo em lote via planilha Excel ou CSV"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Importar Excel/CSV</span>
              </button>

              <button
                type="button"
                id="director-open-new-medicine-modal-btn"
                onClick={() => {
                  setEditingStock(null);
                  setModalMode('new');
                  setSelectedMedId(allMedicines[0]?.id || '');
                  setStockQty(50);
                  setStockPrice(150);
                  setStockDisponibilidade('Disponível');
                  setStockUnidade('caixas');
                  setStockValidade('');
                  setStockLote('');
                  setStockEmQuarentena(false);
                  setStockMotivoQuarentena('');
                  setShowAddMedicineModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Manual</span>
              </button>
            </div>
          </div>

          {/* Quick Health & Expiration Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMedHealthFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                medHealthFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todos ({myStocks.length})
            </button>

            <button
              type="button"
              onClick={() => setMedHealthFilter('available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                medHealthFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Disponíveis ({myStocks.filter((s) => !s.em_quarentena && s.disponibilidade === 'Disponível' && !isStockExpired(s.data_validade)).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMedHealthFilter('low_stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                medHealthFilter === 'low_stock'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Pouca Quantidade ({myStocks.filter((s) => !s.em_quarentena && s.quantidade <= 10).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMedHealthFilter('quarantine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                medHealthFilter === 'quarantine'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Em Quarentena ({myStocks.filter((s) => s.em_quarentena).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMedHealthFilter('expiring_soon')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                medHealthFilter === 'expiring_soon'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white border border-orange-200 text-orange-800 hover:bg-orange-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>A Vencer em ≤ 90 Dias ({myStocks.filter((s) => !s.em_quarentena && isStockExpiringSoon(s.data_validade)).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMedHealthFilter('expired')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                medHealthFilter === 'expired'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Expirados / Descarte ({myStocks.filter((s) => isStockExpired(s.data_validade)).length})</span>
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={medSearchTerm}
                onChange={(e) => setMedSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome, princípio ativo ou lote..."
                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={medAvailabilityFilter}
                onChange={(e) => setMedAvailabilityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none w-full sm:w-auto"
              >
                <option value="Todos">Todas as disponibilidades</option>
                <option value="Disponível">Disponível</option>
                <option value="Pouca quantidade">Pouca quantidade</option>
                <option value="Indisponível">Indisponível</option>
                <option value="Temporariamente indisponível">Temporariamente indisponível</option>
              </select>
            </div>
          </div>

          {/* Stock items list */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-600">
                {filteredStocks.length} {filteredStocks.length === 1 ? 'medicamento listado' : 'medicamentos listados'}
              </span>
              <span className="text-[11px] text-slate-400">Controlo de Stock & Validade de Balcão</span>
            </div>

            {filteredStocks.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Pill className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">
                  {myStocks.length === 0
                    ? 'Nenhum medicamento adicionado ao estoque da sua farmácia ainda.'
                    : 'Nenhum medicamento encontrado para os filtros selecionados.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMasterCatalogModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 hover:from-emerald-700 hover:to-teal-850 text-white font-black text-xs rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer border border-emerald-500/30"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Explorar Catálogo Mestre (5.000+ Medicamentos)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSeedEssentialKit}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-200" />
                    <span>Kit de 10 Essenciais</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingStock(null);
                      setModalMode('new');
                      setSelectedMedId(allMedicines[0]?.id || '');
                      setStockQty(50);
                      setStockPrice(150);
                      setStockDisponibilidade('Disponível');
                      setStockUnidade('caixas');
                      setStockValidade('');
                      setStockLote('');
                      setStockEmQuarentena(false);
                      setStockMotivoQuarentena('');
                      setShowAddMedicineModal(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Manual</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredStocks.map((stock) => {
                const med = allMedicines.find((m) => m.id === stock.medicine_id);
                if (!med) return null;

                const expired = isStockExpired(stock.data_validade);
                const expiringSoon = !expired && isStockExpiringSoon(stock.data_validade);

                return (
                  <div
                    key={stock.id}
                    className={`p-4 transition-colors rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      stock.em_quarentena
                        ? 'bg-purple-50/70 border-purple-200'
                        : expired
                        ? 'bg-red-50/70 border-red-200'
                        : expiringSoon
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200/80'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base">{med.nome}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-md">
                          {med.concentracao}
                        </span>

                        {stock.em_quarentena ? (
                          <span className="text-[11px] font-black bg-purple-200 text-purple-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>EM QUARENTENA SANITÁRIA</span>
                          </span>
                        ) : expired ? (
                          <span className="text-[11px] font-black bg-red-200 text-red-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            <span>PRAZO EXPIRADO</span>
                          </span>
                        ) : expiringSoon ? (
                          <span className="text-[11px] font-bold bg-orange-200 text-orange-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>VENCE EM BREVE</span>
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              stock.disponibilidade === 'Disponível'
                                ? 'bg-emerald-100 text-emerald-800'
                                : stock.disponibilidade === 'Pouca quantidade'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {stock.disponibilidade}
                          </span>
                        )}

                        {med.precisa_receita && (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            Exige Receita
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600">
                        Princípio ativo: <span className="font-semibold text-slate-800">{med.principio_ativo}</span> • {med.forma_farmaceutica} • {med.categoria}
                      </p>

                      {/* Validade, Lote and Details */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] pt-0.5">
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-semibold text-slate-700">
                          Estoque: <strong className="text-slate-900 font-bold">{stock.quantidade} {stock.unidade}</strong>
                        </span>

                        {stock.data_validade && (
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold border ${
                              expired
                                ? 'bg-red-100 text-red-900 border-red-300'
                                : expiringSoon
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            Validade: {new Date(stock.data_validade).toLocaleDateString('pt-MZ')}
                          </span>
                        )}

                        {stock.lote && (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[10px] border border-slate-200">
                            Lote: <strong>{stock.lote}</strong>
                          </span>
                        )}

                        <span className="text-slate-400 text-[10px]">
                          Atualizado: {new Date(stock.ultima_atualizacao).toLocaleDateString('pt-MZ')}
                        </span>
                      </div>

                      {/* Quarantine Note Banner */}
                      {stock.em_quarentena && (
                        <div className="mt-2 p-2 bg-purple-100/90 border border-purple-300 rounded-xl text-xs text-purple-950 space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                            <span>Retenção / Motivo da Quarentena:</span>
                          </div>
                          <p className="italic text-purple-900">{stock.motivo_quarentena || 'Aguardando verificação técnica'}</p>
                          {stock.data_quarentena && (
                            <span className="text-[10px] text-purple-800 block">
                              Em quarentena desde: {new Date(stock.data_quarentena).toLocaleDateString('pt-MZ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <div className="text-right">
                        {stock.preco !== null ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-700 text-sm">
                              {stock.preco.toFixed(2).replace('.', ',')} MZN
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">(Interno)</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sem preço interno</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Quarantine Action Toggle */}
                        {stock.em_quarentena ? (
                          <button
                            type="button"
                            onClick={() => handleReleaseQuarantine(stock.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                            title="Liberar da quarentena sanitária para venda pública"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Liberar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setQuarantineModalStock(stock);
                              setQuarantineModalReason('Desvio de temperatura na conservação');
                            }}
                            className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-purple-200"
                            title="Colocar lote em quarentena preventiva"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                            <span>Quarentena</span>
                          </button>
                        )}

                        {/* Discard Expired Action */}
                        {expired && (
                          <button
                            type="button"
                            onClick={() => {
                              setDiscardModalStock(stock);
                              setDiscardModalReason('Prazo de validade expirado');
                            }}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                            title="Remover e registar descarte sanitário de medicamento expirado"
                          >
                            <Flame className="w-3.5 h-3.5 text-amber-300" />
                            <span>Descarte</span>
                          </button>
                        )}

                        {/* Edit Stock */}
                        <button
                          type="button"
                          id={`edit-stock-${stock.id}`}
                          onClick={() => {
                            setEditingStock(stock);
                            setModalMode('existing');
                            setSelectedMedId(stock.medicine_id);
                            setStockQty(stock.quantidade);
                            setStockPrice(stock.preco !== null ? stock.preco : '');
                            setStockDisponibilidade(stock.disponibilidade);
                            setStockUnidade(stock.unidade);
                            setStockValidade(stock.data_validade || '');
                            setStockLote(stock.lote || '');
                            setStockEmQuarentena(stock.em_quarentena || false);
                            setStockMotivoQuarentena(stock.motivo_quarentena || '');
                            setShowAddMedicineModal(true);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                          title="Editar Preço, Quantidade, Validade e Lote"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingStockId(stock.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Remover do Estoque"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: MEDICINES & STOCK MANAGEMENT (EMPTY / NO PHARMACY SELECTED) */}
      {activeSubTab === 'medicines' && !myPharmacy && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-5 shadow-sm max-w-xl mx-auto my-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200">
            <Pill className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900">Selecione uma Farmácia para Gerir o Estoque</h2>
            <p className="text-xs text-slate-500">
              Escolha uma das farmácias registadas na Província de Tete para gerir medicamentos, prazos de validade e preços ao público.
            </p>
          </div>

          {allPharmacies.length > 0 && (
            <div className="max-w-sm mx-auto space-y-2 pt-2 text-left">
              <label className="text-xs font-bold text-slate-700 block">Escolha a farmácia:</label>
              <select
                onChange={(e) => {
                  setSelectedPharmacyId(e.target.value);
                  localStorage.setItem('farmalink_last_active_pharmacy_id', e.target.value);
                  triggerRefresh();
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                defaultValue=""
              >
                <option value="" disabled>Selecione uma farmácia...</option>
                {allPharmacies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {p.bairro} ({p.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => startNewPharmacyRegistration()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Farmácia</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ORDERS MANAGEMENT */}
      {activeSubTab === 'orders' && myPharmacy && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Pedidos & Reservas dos Utentes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Analise solicitações, confirme a disponibilidade e marque pedidos prontos para levantamento no balcão em Tete.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                Total: <strong className="text-slate-900">{myOrders.length} pedidos</strong>
              </span>
            </div>
          </div>

          {/* Orders Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                placeholder="Pesquisar por ID, medicamento, nome do utente ou telefone..."
                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none w-full sm:w-auto"
              >
                <option value="Todos">Todos os estados</option>
                <option value="Pendentes">Pendentes (Novos / Em análise)</option>
                <option value="Pronto para levantamento">Prontos para levantamento</option>
                <option value="Concluído">Concluídos (Levantados)</option>
                <option value="Rejeitado">Rejeitados / Não disponíveis</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center text-slate-400 text-xs border border-slate-200">
                Nenhum pedido encontrado.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        #{order.id.toUpperCase()}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">{order.medicine_nome}</h4>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-md">
                        Qtd: {order.quantidade}
                      </span>
                      {order.preco_total && (
                        <span className="font-extrabold text-slate-800 text-xs">
                          {order.preco_total.toFixed(2).replace('.', ',')} MZN
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      Utente: <strong className="text-slate-800 font-bold">{order.user_nome}</strong> • Telefone:{' '}
                      <a
                        href={`tel:${order.user_telefone}`}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        {order.user_telefone}
                      </a>
                    </p>

                    {order.usa_seguro && (
                      <div className="bg-blue-50/90 border border-blue-200 p-2.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-blue-950 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Pedido com Seguro de Saúde: <strong>{order.seguradora_nome || 'Convénio'}</strong></span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900">
                            {order.autorizacao_seguro_status === 'autorizado'
                              ? '✓ Autorizado'
                              : order.autorizacao_seguro_status === 'nao_autorizado'
                              ? '✕ Não Coberto'
                              : '⏳ Aguarda Pré-Autorização'}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px]">
                          Cartão / Apólice: <strong className="font-mono text-slate-950">{order.numero_cartao_seguro || 'Não especificado'}</strong>
                        </p>
                        <p className="text-[10px] text-blue-800 italic">
                          ℹ️ Obrigatório validar Termo de Responsabilidade junto à asseguradora antes de autorizar levantamento.
                        </p>
                      </div>
                    )}

                    {order.observacao && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        "{order.observacao}"
                      </p>
                    )}

                    {order.status_note && (
                      <p className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                        <strong className="font-bold">Resposta da farmácia:</strong> {order.status_note}
                      </p>
                    )}

                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      Data da solicitação: {new Date(order.created_at).toLocaleDateString('pt-MZ')} às{' '}
                      {new Date(order.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2.5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span
                      className={`font-bold text-xs px-3 py-1 rounded-full ${
                        order.status === 'Pronto para levantamento' || order.status === 'Concluído'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'Rejeitado' || order.status === 'Não disponível'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChatOrder(order)}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl transition-colors shadow-2xs"
                        title="Chat Directo com o Utente"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <a
                        href={`https://wa.me/${order.user_telefone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Olá ${order.user_nome}, contacto da ${myPharmacy.nome} em Tete sobre o seu pedido #${order.id.toUpperCase()} de ${order.medicine_nome}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
                        title="Contactar via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      <a
                        href={`tel:${order.user_telefone}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                        title="Ligar para o Utente"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        id={`manage-order-${order.id}`}
                        onClick={() => {
                          setUpdatingOrder(order);
                          setNewOrderStatus(order.status);
                          setOrderStatusNote(order.status_note || '');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        Alterar Estado / Responder
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: DIRECTOR ANALYTICS & MARKET DEMAND */}
      {activeSubTab === 'analytics' && myPharmacy && (
        <DirectorAnalyticsSection
          pharmacy={myPharmacy}
          currentUser={currentUser}
          orders={myOrders}
        />
      )}

      {/* SUB-VIEW 5: PHARMACY PHOTOS */}
      {activeSubTab === 'photos' && myPharmacy && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Galeria de Fotos da Farmácia
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Adicione fotos da fachada, balcão de atendimento e interior para facilitar a identificação pelos cidadãos de Tete.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPhotoModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Fotografia</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPhotos.length === 0 ? (
              <div className="sm:col-span-3 bg-white rounded-3xl p-10 text-center text-slate-400 text-xs border border-slate-200 space-y-3">
                <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
                <p>Nenhuma foto adicionada à galeria ainda.</p>
                <button
                  type="button"
                  onClick={() => setShowAddPhotoModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Adicionar Primeira Foto
                </button>
              </div>
            ) : (
              myPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs group"
                >
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.caption || 'Foto da Farmácia'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-colors"
                      title="Excluir Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{photo.caption || 'Fachada da Farmácia'}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Adicionada em {new Date(photo.created_at).toLocaleDateString('pt-MZ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: PHARMACY REGISTRATION / DATA EDIT */}
      {activeSubTab === 'register' && (
        <form
          onSubmit={handleSubmitPharmacyRegistration}
          className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-6"
        >
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {myPharmacy && !isRegisteringNewPharmacy
                  ? `Atualizar Dados & Alvará: ${myPharmacy.nome}`
                  : 'Formulário Oficial de Cadastro de Nova Farmácia'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Preencha as informações oficiais para homologação junto à Direcção Provincial de Saúde e FarmaLink Tete.
              </p>
            </div>
            {draftSavedMsg && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                ✓ {draftSavedMsg}
              </span>
            )}
          </div>

          {myPharmacy && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setIsRegisteringNewPharmacy(false);
                  setFormData({
                    nome: myPharmacy.nome || '',
                    nuit: myPharmacy.nuit || '',
                    license_number: myPharmacy.license_number || '',
                    director_name: myPharmacy.director_name || currentUser.nome || '',
                    numero_profissional: currentUser.numero_profissional || '',
                    telefone: myPharmacy.telefone || currentUser.telefone || '',
                    email: myPharmacy.email || currentUser.email || '',
                    endereco: myPharmacy.endereco || '',
                    bairro: myPharmacy.bairro || 'Francisco Manyanga',
                    cidade: 'Cidade de Tete',
                    provincia: 'Tete',
                    latitude: myPharmacy.latitude || TETE_CENTER.latitude,
                    longitude: myPharmacy.longitude || TETE_CENTER.longitude,
                    horario: myPharmacy.horario || '08:00 - 20:00',
                    dias_funcionamento: myPharmacy.dias_funcionamento || 'Segunda a Sábado',
                    descricao: myPharmacy.descricao || '',
                    motivacao_cadastro: myPharmacy.motivacao_cadastro || '',
                    logo_url: myPharmacy.logo_url || '',
                    access_code: myPharmacy.access_code || '',
                    pin: myPharmacy.pin || '',
                    aceita_seguro: myPharmacy.aceita_seguro || false,
                    seguradoras: myPharmacy.seguradoras || [],
                    instrucoes_seguro: myPharmacy.instrucoes_seguro || '',
                    tipo_estabelecimento: myPharmacy.tipo_estabelecimento || 'farmacia_comunitaria',
                  });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isRegisteringNewPharmacy
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏢 Editar: {myPharmacy.nome}
              </button>
              <button
                type="button"
                onClick={() => startNewPharmacyRegistration()}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isRegisteringNewPharmacy
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ➕ Cadastrar Nova Farmácia
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Nome da Farmácia */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome Oficial da Farmácia *</label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Farmácia Central de Tete"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* NUIT */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">NUIT da Empresa *</label>
              <input
                type="text"
                required
                value={formData.nuit}
                onChange={(e) => setFormData({ ...formData, nuit: e.target.value })}
                placeholder="Ex: 400192837"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Número da Licença / Alvará */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Número de Alvará / Licença Sanitária *</label>
              <input
                type="text"
                required
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="Ex: MS/DISP/TETE/2023/12"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Nome do Director Técnico ou Proprietário */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nome do Director Técnico ou Proprietário *
              </label>
              <input
                type="text"
                required
                value={formData.director_name}
                onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                placeholder="Ex: Grácio César"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Insira o nome do profissional farmacêutico ou proprietário responsável que constará no alvará sanitário e na página da farmácia.
              </p>
            </div>

            {/* Carteira Profissional */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Carteira Profissional (Ordem dos Farmacêuticos)</label>
              <input
                type="text"
                value={formData.numero_profissional}
                onChange={(e) => setFormData({ ...formData, numero_profissional: e.target.value })}
                placeholder="Ex: OFM-MZ/2021-440"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contacto Telefónico / WhatsApp *</label>
              <input
                type="tel"
                required
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="+258 84 123 4567"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Institucional *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="geral@farmacia.co.mz"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Bairro em Tete */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bairro em Tete *</label>
              <select
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {TETE_BAIRROS.filter((b) => b !== 'Todos os Bairros').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Endereço Completo */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Endereço Completo / Ponto de Referência *</label>
              <input
                type="text"
                required
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Ex: Av. Eduardo Mondlane, nº 140, perto da Praça da Independência"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Horário de Funcionamento */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Horário de Funcionamento *</label>
              <input
                type="text"
                required
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                placeholder="Ex: 08:00 - 20:00 ou 24 Horas"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Dias de Funcionamento */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dias de Atendimento</label>
              <input
                type="text"
                value={formData.dias_funcionamento}
                onChange={(e) => setFormData({ ...formData, dias_funcionamento: e.target.value })}
                placeholder="Ex: Segunda a Sábado"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Logotipo Upload Real */}
            <div className="sm:col-span-2 space-y-2">
              <RealFileUpload
                label="Logotipo / Foto de Identificação da Farmácia"
                description="Carregue o logotipo oficial da farmácia ou foto nítida da fachada (PNG/JPG)"
                currentValue={formData.logo_url}
                onFileSelect={(url) => setFormData({ ...formData, logo_url: url })}
                onRemove={() => setFormData({ ...formData, logo_url: '' })}
              />
            </div>

            {/* Descrição */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Descrição Geral dos Serviços Farmacêuticos</label>
              <textarea
                rows={2}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Informações sobre instalações, estoque, aconselhamento farmacêutico, produtos de puericultura..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* SEÇÃO: Convénios & Seguros de Saúde (Asseguradoras) */}
            <div className="sm:col-span-2 p-5 bg-linear-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <span>Convénios com Asseguradoras & Seguros de Saúde</span>
                      <span className="text-[10px] font-bold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-md">
                        Tete & Moatize
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      Configure se a sua farmácia ou clínica atende utentes com seguro e quais asseguradoras estão vinculadas.
                    </p>
                  </div>
                </div>

                {/* Toggle Ativação Seguro */}
                <label className="inline-flex items-center gap-2.5 cursor-pointer self-start sm:self-auto bg-white px-3.5 py-2 rounded-xl border border-blue-300 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={formData.aceita_seguro}
                    onChange={(e) => setFormData({ ...formData, aceita_seguro: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-900">
                    {formData.aceita_seguro ? '✓ Aceita Seguro' : 'Não Aceita Seguro'}
                  </span>
                </label>
              </div>

              {formData.aceita_seguro && (
                <div className="space-y-4 pt-1">
                  {/* Tipo de Estabelecimento */}
                  <div>
                    <label className="block font-bold text-slate-800 text-xs mb-1.5">
                      Tipo de Estabelecimento de Saúde:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo_estabelecimento: 'farmacia_comunitaria' })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          formData.tipo_estabelecimento === 'farmacia_comunitaria'
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-bold">🏪 Farmácia Comunitária</span>
                        <span className={`text-[10px] ${formData.tipo_estabelecimento === 'farmacia_comunitaria' ? 'text-blue-100' : 'text-slate-500'}`}>
                          Balcão farmacêutico tradicional
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo_estabelecimento: 'farmacia_clinica' })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          formData.tipo_estabelecimento === 'farmacia_clinica'
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-bold">🏥 Farmácia Clínica / Policlínica</span>
                        <span className={`text-[10px] ${formData.tipo_estabelecimento === 'farmacia_clinica' ? 'text-blue-100' : 'text-slate-500'}`}>
                          Vinculada a consultórios / clínica médica
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo_estabelecimento: 'posto_medicamentos' })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          formData.tipo_estabelecimento === 'posto_medicamentos'
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-bold">💊 Posto de Medicamentos</span>
                        <span className={`text-[10px] ${formData.tipo_estabelecimento === 'posto_medicamentos' ? 'text-blue-100' : 'text-slate-500'}`}>
                          Dispensário em bairro ou zona rural
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Asseguradoras Vinculadas (Multi-seleção) */}
                  <div>
                    <label className="block font-bold text-slate-800 text-xs mb-1.5">
                      Selecione as Asseguradoras Parceiras / Vinculadas:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {MOZAMBIQUE_INSURANCE_COMPANIES.map((ins) => {
                        const isSelected = (formData.seguradoras || []).includes(ins.name);
                        return (
                          <button
                            key={ins.id}
                            type="button"
                            onClick={() => {
                              const current = formData.seguradoras || [];
                              const updated = isSelected
                                ? current.filter((s) => s !== ins.name)
                                : [...current, ins.name];
                              setFormData({ ...formData, seguradoras: updated });
                            }}
                            className={`p-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white border-blue-600 text-blue-900 shadow-2xs font-bold'
                                : 'bg-white/60 border-slate-300/80 text-slate-600 hover:bg-white'
                            }`}
                          >
                            <span className="text-xs truncate">{ins.name}</span>
                            <span
                              className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white font-bold' : 'border border-slate-300'
                              }`}
                            >
                              {isSelected && '✓'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Adicionar outra asseguradora personalizada */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <input
                        type="text"
                        value={newInsurerName}
                        onChange={(e) => setNewInsurerName(e.target.value)}
                        placeholder="Nome de outra asseguradora ou plano corporativo..."
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newInsurerName.trim();
                          if (trimmed && !(formData.seguradoras || []).includes(trimmed)) {
                            setFormData({
                              ...formData,
                              seguradoras: [...(formData.seguradoras || []), trimmed],
                            });
                            setNewInsurerName('');
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        + Adicionar
                      </button>
                    </div>

                    {/* Lista das selecionadas */}
                    {(formData.seguradoras || []).length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-600">Vinculadas:</span>
                        {formData.seguradoras.map((ins, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-100/90 px-2.5 py-0.5 rounded-lg border border-blue-200"
                          >
                            <span>{ins}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  seguradoras: formData.seguradoras.filter((s) => s !== ins),
                                });
                              }}
                              className="text-blue-500 hover:text-red-600 ml-0.5 cursor-pointer font-black"
                              title="Remover"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Instruções de Pré-Autorização e Procedimento */}
                  <div>
                    <label className="block font-bold text-slate-800 text-xs mb-1">
                      Instruções para o Utente (Exigências de Pré-Autorização & Termo de Responsabilidade):
                    </label>
                    <textarea
                      rows={2}
                      value={formData.instrucoes_seguro}
                      onChange={(e) => setFormData({ ...formData, instrucoes_seguro: e.target.value })}
                      placeholder="Ex: A dispensa de medicamentos comparticipados requer apresentação do cartão do seguro, BI e receita médica carimbada. Não dispensamos sem autorização prévia da seguradora."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      ℹ️ Em Moçambique e na Cidade de Tete, as farmácias e clínicas vinculadas a asseguradoras não dispensam medicamentos sem autorização prévia. Esta mensagem ficará visível aos utentes na página da farmácia e na reserva.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Código de Acesso Personalizado e PIN do Director Técnico */}
            <div className="sm:col-span-2 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-300" />
                  <label className="font-bold text-white text-xs sm:text-sm">
                    Código de Acesso Exclusivo da Farmácia & PIN (Livre Escolha do Proprietário)
                  </label>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Credencial Direta
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Defina o código de acesso (ex: <span className="text-amber-300 font-mono font-bold">MAIS-SAUDE</span>, <span className="text-amber-300 font-mono font-bold">FARMA-CENTRAL</span>) para você e os farmacêuticos da sua farmácia entrarem rapidamente no painel a partir de qualquer celular ou tablet.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Código de Acesso Personalizado *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      value={formData.access_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          access_code: e.target.value.toUpperCase().replace(/\s+/g, '-'),
                        })
                      }
                      placeholder="Ex: MAIS-SAUDE, MINHA-FARMACIA"
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono font-bold text-amber-300 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = formData.nome.split(' ')[0]?.toUpperCase().replace(/[^A-Z]/g, '') || 'FARMA';
                        const rand = Math.floor(1000 + Math.random() * 9000);
                        setFormData({
                          ...formData,
                          access_code: `${prefix}-${rand}`,
                        });
                      }}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold shrink-0"
                      title="Gerar código aleatório"
                    >
                      Sugerir
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    PIN Rápido Numérico (4 a 6 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pin: e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    placeholder="Ex: 2026"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono font-bold text-emerald-300 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Motivação do Director Técnico para Adesão */}
            <div className="sm:col-span-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-emerald-950 text-xs sm:text-sm">
                  Motivação & Justificativa do Director Técnico para Adesão à Plataforma *
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  Avaliado pelo Administrador
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Descreva os objetivos comunitários e sanitários da sua farmácia para a província de Tete (ex.: atendimento de emergência, cobertura no bairro, facilitação de medicamentos crónicos, transparência de preços).
              </p>
              <textarea
                rows={3}
                required
                value={formData.motivacao_cadastro}
                onChange={(e) => setFormData({ ...formData, motivacao_cadastro: e.target.value })}
                placeholder="Ex: Pretendemos garantir cobertura farmacêutica 24h e acesso rápido a antibióticos e antimaláricos no bairro..."
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              {/* Sugestões rápidas de motivação */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Sugestões Rápidas de Motivação (Clique para preencher):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Garantir atendimento farmacêutico de urgência 24h para emergências no bairro.',
                    'Digitalizar o estoque para que os pacientes encontrem medicamentos essenciais sem deslocações.',
                    'Garantir a consulta rápida de disponibilidade e reservas directas no balcão para reduzir filas.',
                    'Expandir a cobertura de tratamentos contínuos, antimaláricos e saúde materno-infantil em Tete.',
                  ].map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, motivacao_cadastro: sug })}
                      className="text-[10px] font-medium bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors text-left"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 italic">
              * Todos os dados serão validados pela Administração antes da aprovação pública.
            </span>
            <button
              type="submit"
              id="submit-pharmacy-approval-btn"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{myPharmacy ? 'Salvar & Atualizar Dados' : 'Enviar para Aprovação'}</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL: CADASTRO E EDIÇÃO DE MEDICAMENTO / ESTOQUE */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingStock
                    ? 'Editar Estoque do Medicamento'
                    : 'Cadastrar Medicamento na Farmácia'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Farmácia: <strong className="text-emerald-800">{myPharmacy?.nome}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMedicineModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Mode: Novo Medicamento vs Do Catálogo Geral */}
            {!editingStock && (
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 p-3 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-emerald-950">Catálogo Mestre com 5.000+ Medicamentos</p>
                      <p className="text-[11px] text-emerald-700">Cadastre em 1 clique sem precisar digitar nomes e dosagens.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMedicineModal(false);
                      setShowMasterCatalogModal(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
                  >
                    Usar Catálogo
                  </button>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setModalMode('new')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      modalMode === 'new'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Medicamento Manual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('existing')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      modalMode === 'existing'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Escolher dos Existentes</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveStock} className="space-y-4 text-xs">
              {modalMode === 'existing' || editingStock ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Medicamento do Catálogo Geral *</label>
                  <select
                    disabled={!!editingStock}
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {allMedicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({m.concentracao}) — {m.forma_farmaceutica} [{m.principio_ativo}]
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Formulário de Novo Medicamento */
                <div className="space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs pb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dados do Novo Medicamento:</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nome Comercial do Medicamento *</label>
                    <input
                      type="text"
                      required
                      value={newMedData.nome}
                      onChange={(e) => setNewMedData({ ...newMedData, nome: e.target.value })}
                      placeholder="Ex: Paracetamol Infantil, Coartem 20/120, Amoxicilina"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Princípio Ativo (DCI) *</label>
                      <input
                        type="text"
                        required
                        value={newMedData.principio_ativo}
                        onChange={(e) => setNewMedData({ ...newMedData, principio_ativo: e.target.value })}
                        placeholder="Ex: Paracetamol"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Dosagem / Concentração *</label>
                      <input
                        type="text"
                        required
                        value={newMedData.concentracao}
                        onChange={(e) => setNewMedData({ ...newMedData, concentracao: e.target.value })}
                        placeholder="Ex: 500mg, 120mg/5ml"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Forma Farmacêutica</label>
                      <select
                        value={newMedData.forma_farmaceutica}
                        onChange={(e) => setNewMedData({ ...newMedData, forma_farmaceutica: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none"
                      >
                        <option value="Comprimidos">Comprimidos</option>
                        <option value="Cápsulas">Cápsulas</option>
                        <option value="Xarope">Xarope</option>
                        <option value="Suspensão Oral">Suspensão Oral</option>
                        <option value="Pomada">Pomada / Gel</option>
                        <option value="Gotas">Gotas</option>
                        <option value="Injetável">Injetável</option>
                        <option value="Saquetas">Saquetas</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Categoria Terapêutica</label>
                      <select
                        value={newMedData.categoria}
                        onChange={(e) => setNewMedData({ ...newMedData, categoria: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none"
                      >
                        <option value="Analgésicos e Antipiréticos">Analgésicos e Antipiréticos</option>
                        <option value="Antimaláricos">Antimaláricos</option>
                        <option value="Antibióticos">Antibióticos</option>
                        <option value="Anti-inflamatórios">Anti-inflamatórios</option>
                        <option value="Antidiabéticos">Antidiabéticos</option>
                        <option value="Cardiovascular e Hipertensão">Cardiovascular e Hipertensão</option>
                        <option value="Gastrointestinal">Gastrointestinal</option>
                        <option value="Respiratório">Respiratório</option>
                        <option value="Saúde Materno-Infantil">Saúde Materno-Infantil</option>
                        <option value="Vitaminas e Suplementos">Vitaminas e Suplementos</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="new-med-prescription"
                      checked={newMedData.precisa_receita}
                      onChange={(e) => setNewMedData({ ...newMedData, precisa_receita: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="new-med-prescription" className="font-bold text-slate-800 cursor-pointer">
                      Exige Receita Médica Obrigatória (Conforme legislação de Moçambique)
                    </label>
                  </div>
                </div>
              )}

              {/* Informações de Estoque, Preço, Validade e Lote */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantidade em Estoque *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={stockQty}
                      onChange={(e) => setStockQty(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unidade de Embalagem</label>
                    <select
                      value={stockUnidade}
                      onChange={(e) => setStockUnidade(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:outline-none"
                    >
                      <option value="caixas">caixas</option>
                      <option value="embalagens">embalagens</option>
                      <option value="frascos">frascos</option>
                      <option value="saquetas">saquetas</option>
                      <option value="comprimidos">comprimidos</option>
                      <option value="tubos">tubos</option>
                      <option value="ampolas">ampolas</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Preço Interno / Balcão (MZN) <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={stockPrice}
                      onChange={(e) => setStockPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="Ex: 150.00 (opcional)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Uso interno da farmácia (não é exibido na busca pública).
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estado de Disponibilidade *</label>
                    <select
                      value={stockDisponibilidade}
                      onChange={(e) => setStockDisponibilidade(e.target.value as MedicineAvailability)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Pouca quantidade">Pouca quantidade</option>
                      <option value="Indisponível">Indisponível</option>
                      <option value="Temporariamente indisponível">Temporariamente indisponível</option>
                    </select>
                  </div>
                </div>

                {/* Prazo de Validade & Lote */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Controlo Sanitário de Lote & Prazo de Validade:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Prazo de Validade (Data de Expiração) *</label>
                      <input
                        type="date"
                        value={stockValidade}
                        onChange={(e) => setStockValidade(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      {/* Quick date presets */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setMonth(d.getMonth() + 6);
                            setStockValidade(d.toISOString().split('T')[0]);
                          }}
                          className="text-[10px] bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 px-1.5 py-0.5 rounded"
                        >
                          +6 Meses
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setFullYear(d.getFullYear() + 1);
                            setStockValidade(d.toISOString().split('T')[0]);
                          }}
                          className="text-[10px] bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 px-1.5 py-0.5 rounded"
                        >
                          +1 Ano
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setFullYear(d.getFullYear() + 2);
                            setStockValidade(d.toISOString().split('T')[0]);
                          }}
                          className="text-[10px] bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 px-1.5 py-0.5 rounded"
                        >
                          +2 Anos
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setFullYear(d.getFullYear() + 3);
                            setStockValidade(d.toISOString().split('T')[0]);
                          }}
                          className="text-[10px] bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 px-1.5 py-0.5 rounded"
                        >
                          +3 Anos
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Número de Lote (Fabricante)</label>
                      <input
                        type="text"
                        value={stockLote}
                        onChange={(e) => setStockLote(e.target.value)}
                        placeholder="Ex: LOT-MZ-2026-09"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-semibold text-slate-900 text-xs focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Facilita rastreabilidade e recolhas sanitárias.
                      </span>
                    </div>
                  </div>

                  {/* Quarentena Checkbox */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="stock-quarantine-checkbox"
                        checked={stockEmQuarentena}
                        onChange={(e) => setStockEmQuarentena(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                      />
                      <label htmlFor="stock-quarantine-checkbox" className="font-bold text-purple-900 cursor-pointer">
                        Colocar este lote em Quarentena Sanitária (Oculta dos utentes na busca pública)
                      </label>
                    </div>

                    {stockEmQuarentena && (
                      <div className="p-2.5 bg-purple-100/70 border border-purple-200 rounded-xl space-y-1">
                        <label className="block font-bold text-purple-900 text-[11px]">
                          Motivo Sanitário da Quarentena:
                        </label>
                        <input
                          type="text"
                          value={stockMotivoQuarentena}
                          onChange={(e) => setStockMotivoQuarentena(e.target.value)}
                          placeholder="Ex: Suspeita de alteração física, aguardando relatório do fornecedor..."
                          className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddMedicineModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="save-stock-confirm-btn"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingStock ? 'Salvar Alterações' : 'Confirmar Cadastro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUSÃO DE ESTOQUE */}
      {deletingStockId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Remover Medicamento do Estoque?</h3>
            <p className="text-xs text-slate-500">
              Esta ação removerá este medicamento da lista de estoque da sua farmácia. Poderá adicioná-lo novamente a qualquer momento.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStockId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStock(deletingStockId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ATUALIZAÇÃO DO ESTADO DO PEDIDO */}
      {updatingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Atualizar Pedido #{updatingOrder.id.toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setUpdatingOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrderStatusSubmit} className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{updatingOrder.medicine_nome}</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Qtd: {updatingOrder.quantidade}
                  </span>
                </div>
                <p className="text-slate-600">
                  Utente: <strong>{updatingOrder.user_nome}</strong> ({updatingOrder.user_telefone})
                </p>
                {updatingOrder.observacao && (
                  <p className="text-[11px] text-slate-500 italic">"{updatingOrder.observacao}"</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Novo Estado do Pedido *</label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                >
                  <option value="Recebido">Recebido</option>
                  <option value="Em análise">Em análise</option>
                  <option value="Disponível">Disponível</option>
                  <option value="Reservado">Reservado</option>
                  <option value="Pronto para levantamento">Pronto para levantamento</option>
                  <option value="Concluído">Concluído (Medicamento Levantado)</option>
                  <option value="Não disponível">Não disponível</option>
                  <option value="Rejeitado">Rejeitado</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instruções / Nota para o Cidadão</label>
                <textarea
                  rows={2}
                  value={orderStatusNote}
                  onChange={(e) => setOrderStatusNote(e.target.value)}
                  placeholder="Ex: Medicamento separado. Pode levantar no balcão 1 mediante apresentação da receita médica original."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Sugestões rápidas:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewOrderStatus('Pronto para levantamento');
                      setOrderStatusNote('Medicamento reservado e separado. Pode levantar no balcão de atendimento.');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg text-slate-700 font-medium"
                  >
                    ✓ Pronto para levantar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewOrderStatus('Pronto para levantamento');
                      setOrderStatusNote('Pedido embalado e entregue ao estafeta Txopela para entrega no domicílio.');
                    }}
                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg font-medium"
                  >
                    🛵 Despachado por Txopela
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewOrderStatus('Concluído');
                      setOrderStatusNote('Medicamento entregue com sucesso.');
                    }}
                    className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 rounded-lg font-medium"
                  >
                    ✅ Concluído / Entregue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewOrderStatus('Reservado');
                      setOrderStatusNote('Medicamento reservado. Favor trazer a receita médica original.');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg text-slate-700 font-medium"
                  >
                    📋 Exigir receita física
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdatingOrder(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="confirm-update-order-status-btn"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Atualizar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR FOTOGRAFIA */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Adicionar Foto da Farmácia</h3>
              <button
                type="button"
                onClick={() => setShowAddPhotoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-3 text-xs">
              <RealFileUpload
                label="Carregar Fotografia Real"
                description="Carregue fotos reais das instalações, balcão, vitrines ou armazém (PNG/JPG)"
                currentValue={newPhotoUrl}
                onFileSelect={(url) => setNewPhotoUrl(url)}
                onRemove={() => setNewPhotoUrl('')}
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição da Foto</label>
                <input
                  type="text"
                  value={newPhotoDesc}
                  onChange={(e) => setNewPhotoDesc(e.target.value)}
                  placeholder="Ex: Fachada exterior e entrada principal"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              {/* Sample Quick Pick Photo URLs */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Fotos sugeridas para teste:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhotoUrl('https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&auto=format&fit=crop&q=80');
                      setNewPhotoDesc('Balcão de atendimento e dispensação');
                    }}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] text-slate-700 font-semibold text-left line-clamp-1"
                  >
                    🏪 Balcão de atendimento
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhotoUrl('https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80');
                      setNewPhotoDesc('Estantes de medicamentos e armazém');
                    }}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] text-slate-700 font-semibold text-left line-clamp-1"
                  >
                    💊 Estantes de estoque
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Salvar Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COLOCAR EM QUARENTENA SANITÁRIA */}
      {quarantineModalStock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Colocar em Quarentena Sanitária</h3>
                  <p className="text-[11px] text-slate-500">
                    Oculta o medicamento da visualização pública
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuarantineModalStock(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuarantineStockSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 space-y-1">
                <span className="font-bold text-purple-950 text-sm">
                  {allMedicines.find((m) => m.id === quarantineModalStock.medicine_id)?.nome} (
                  {allMedicines.find((m) => m.id === quarantineModalStock.medicine_id)?.concentracao})
                </span>
                <div className="text-[11px] text-purple-900 flex items-center gap-3 pt-0.5">
                  <span>Quantidade: <strong>{quarantineModalStock.quantidade} {quarantineModalStock.unidade}</strong></span>
                  {quarantineModalStock.lote && <span>Lote: <strong>{quarantineModalStock.lote}</strong></span>}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo da Retenção / Quarentena *
                </label>
                <textarea
                  rows={2}
                  required
                  value={quarantineModalReason}
                  onChange={(e) => setQuarantineModalReason(e.target.value)}
                  placeholder="Ex: Desvio de temperatura na conservação, embalagem violada, suspeita de alteração física..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Sugestões rápidas de motivos */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Motivos frequentes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Desvio de temperatura na conservação',
                    'Suspeita de alteração física/organoléptica',
                    'Recolha de lote pelo fabricante/MISAU',
                    'Embalagem exterior danificada no transporte',
                  ].map((motivo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuarantineModalReason(motivo)}
                      className="text-[10px] bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 px-2 py-1 rounded-lg transition-colors text-left"
                    >
                      {motivo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuarantineModalStock(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Confirmar Quarentena</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DESCARTE SANITÁRIO DE MEDICAMENTO EXPIRADO */}
      {discardModalStock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Descarte Sanitário de Medicamento</h3>
                  <p className="text-[11px] text-slate-500">
                    Remoção definitiva e auto de incineração/descarte
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiscardModalStock(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDiscardExpiredSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-red-50 rounded-2xl border border-red-100 space-y-1">
                <span className="font-bold text-red-950 text-sm">
                  {allMedicines.find((m) => m.id === discardModalStock.medicine_id)?.nome} (
                  {allMedicines.find((m) => m.id === discardModalStock.medicine_id)?.concentracao})
                </span>
                <div className="text-[11px] text-red-900 flex items-center gap-3 pt-0.5">
                  <span>Quantidade: <strong>{discardModalStock.quantidade} {discardModalStock.unidade}</strong></span>
                  {discardModalStock.data_validade && (
                    <span>Validade Expirada: <strong>{new Date(discardModalStock.data_validade).toLocaleDateString('pt-MZ')}</strong></span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nota / Auto de Descarte Sanitário *
                </label>
                <textarea
                  rows={2}
                  required
                  value={discardModalReason}
                  onChange={(e) => setDiscardModalReason(e.target.value)}
                  placeholder="Ex: Prazo de validade expirado. Encaminhado para incineração sanitária conforme normas do MISAU Moçambique."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDiscardModalStock(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Flame className="w-4 h-4" />
                  <span>Registar Descarte & Remover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTRAR COM CÓDIGO DE ACESSO OU PIN DA FARMÁCIA */}
      {showAccessCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Acesso por Código da Farmácia</h3>
                  <p className="text-[11px] text-slate-500">
                    Entre com o código alfanumérico ou PIN criado pelo Director Técnico
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccessCodeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAccessCodeLogin} className="space-y-3.5 text-xs">
              {accessCodeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{accessCodeError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Código de Acesso da Farmácia *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={enteredAccessCode}
                    onChange={(e) => {
                      setEnteredAccessCode(e.target.value.toUpperCase());
                      setAccessCodeError(null);
                    }}
                    placeholder="Ex: CENTRAL-TETE, MATUNDO-FARMA ou FLT-7840"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Permite gerir instantaneamente a farmácia associada ao código.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN de Segurança da Farmácia (Opcional se configurado)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setAccessCodeError(null);
                  }}
                  placeholder="Ex: 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Códigos de demonstração rápidos */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-400">Códigos rápidos para teste:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEnteredAccessCode('CENTRAL-TETE');
                      setEnteredPin('2026');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 px-2 py-1 rounded-lg font-mono font-bold"
                  >
                    CENTRAL-TETE (PIN 2026)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnteredAccessCode('FLT-7840');
                      setEnteredPin('2026');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 px-2 py-1 rounded-lg font-mono font-bold"
                  >
                    FLT-7840 (Farmácia Zambeze)
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAccessCodeModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validar & Entrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR CÓDIGO DE ACESSO PERSONALIZADO E PIN */}
      {showEditCodeModal && myPharmacy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Definir Meu Código de Acesso</h3>
                  <p className="text-[11px] text-slate-500">
                    Farmácia: <strong className="text-emerald-800">{myPharmacy.nome}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditCodeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccessCode} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Código de Acesso Personalizado *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={customAccessCode}
                    onChange={(e) => setCustomAccessCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                    placeholder="Ex: MAIS-SAUDE, FARMA-CENTRAL, MINHA-FARMACIA"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = myPharmacy.nome.split(' ')[0]?.toUpperCase().replace(/[^A-Z]/g, '') || 'FARMA';
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setCustomAccessCode(`${prefix}-${rand}`);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs shrink-0"
                    title="Gerar código aleatório"
                  >
                    Gerar
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Escolha um código fácil de lembrar para entrar direto no seu telemóvel.
                </span>

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    myPharmacy.nome.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 14),
                    `${myPharmacy.bairro.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-2026`,
                    `${myPharmacy.nome.split(' ')[0]?.toUpperCase()}-TETE`,
                  ].filter(Boolean).map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomAccessCode(sug)}
                      className="text-[10px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 px-2 py-0.5 rounded-lg font-mono font-bold transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN Numérico de Segurança (4 a 6 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ex: 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Opcional: Adicione um PIN numérico para dupla proteção de acesso.
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-[11px] space-y-1">
                <span className="font-bold block flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Autonomia Total do Proprietário</span>
                </span>
                <p className="text-slate-600">
                  Ao salvar, o novo código fica ativo imediatamente e sincronizado com o servidor na nuvem. Você poderá entrar em qualquer celular digitando apenas este código!
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditCodeModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Meu Código & PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time In-App Pharmacist Chat Modal */}
      {chatOrder && myPharmacy && (
        <RealChatModal
          isOpen={!!chatOrder}
          onClose={() => setChatOrder(null)}
          pharmacyId={myPharmacy.id}
          pharmacyNome={myPharmacy.nome}
          currentUser={currentUser}
          orderId={chatOrder.id}
        />
      )}

      {/* Master Medicine Catalog Modal (5,000+ items) */}
      {showMasterCatalogModal && myPharmacy && (
        <MasterMedicineCatalogModal
          isOpen={showMasterCatalogModal}
          onClose={() => setShowMasterCatalogModal(false)}
          pharmacy={myPharmacy}
          currentUser={currentUser}
          onSuccess={(count) => {
            showToast(`${count} medicamento(s) adicionado(s) com sucesso ao estoque da farmácia!`);
            triggerRefresh();
          }}
          onOpenCustomRegister={() => {
            setEditingStock(null);
            setModalMode('new');
            setSelectedMedId(allMedicines[0]?.id || '');
            setStockQty(50);
            setStockPrice(150);
            setStockDisponibilidade('Disponível');
            setStockUnidade('caixas');
            setStockValidade('');
            setStockLote('');
            setStockEmQuarentena(false);
            setStockMotivoQuarentena('');
            setShowAddMedicineModal(true);
          }}
        />
      )}

      {/* Batch Stock Import Modal (Excel / CSV) */}
      {showBatchImportModal && myPharmacy && (
        <BatchStockImportModal
          pharmacy={myPharmacy}
          isOpen={showBatchImportModal}
          onClose={() => setShowBatchImportModal(false)}
          onSuccess={(count) => {
            showToast(`${count} medicamentos importados com sucesso!`);
            triggerRefresh();
          }}
        />
      )}

      {/* Modal: Confirm Stock Item Deletion */}
      {deletingStockId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-red-100">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Remover Medicamento do Estoque?
                </h3>
                <p className="text-xs text-slate-500">
                  O item deixará de estar listado para venda e consulta pública nesta farmácia.
                </p>
              </div>
            </div>

            {(() => {
              const stockItem = myStocks.find((s) => s.id === deletingStockId);
              const medInfo = stockItem ? allMedicines.find((m) => m.id === stockItem.medicine_id) : null;
              return stockItem ? (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-900 text-sm block">
                    {medInfo?.nome || stockItem.medicine_id} ({medInfo?.concentracao})
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                    <span>Quantidade: <strong>{stockItem.quantidade} {stockItem.unidade}</strong></span>
                    {stockItem.preco !== null && (
                      <span>Preço: <strong className="text-emerald-700">{stockItem.preco.toFixed(2)} MZN</strong></span>
                    )}
                    {stockItem.data_validade && (
                      <span>Validade: <strong>{new Date(stockItem.data_validade).toLocaleDateString('pt-MZ')}</strong></span>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingStockId(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-delete-stock-btn"
                onClick={handleConfirmDeleteStock}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Remover do Estoque</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
