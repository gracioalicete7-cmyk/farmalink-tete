import React, { useState } from 'react';
import { FarmaLinkDB } from '../lib/storage';
import { CloudSync } from '../lib/firestoreSync';
import { AdminAnalyticsDashboard } from '../components/AdminAnalyticsDashboard';
import { AdminMasterCatalogGovernance } from '../components/AdminMasterCatalogGovernance';
import { AdminLiveUpdatesMonitor } from '../components/AdminLiveUpdatesMonitor';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  UserProfile,
  Pharmacy,
  Medicine,
  Order,
  AuditLog,
  PharmacyStatus,
  UserRole,
  UserStatus,
  PharmacyPhoto,
  PharmacyMedicine,
} from '../types';
import {
  ShieldCheck,
  Building2,
  Store,
  Pill,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RotateCcw,
  Search,
  Filter,
  Check,
  Ban,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Info,
  RefreshCw,
  UserCheck,
  FileSpreadsheet,
  Camera,
  TrendingUp,
  BarChart3,
  Activity,
  ShoppingBag,
  CircleDollarSign,
  Layers,
  Map,
  BadgeCheck,
  ArrowUpRight,
  PackageCheck,
  PackageX,
  UserPlus,
  FileCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface AdminPortalViewProps {
  currentUser: UserProfile;
  initialTab?: string;
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
  onSelectPharmacy?: (pharmacyId: string) => void;
  onSwitchUser?: (user: UserProfile) => void;
  onUpdateUser?: (user: UserProfile) => void;
  onBack?: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  currentUser,
  initialTab = 'stats',
  onNavigate,
  onSelectPharmacy,
  onSwitchUser,
  onUpdateUser,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    'stats' | 'approvals' | 'catalog' | 'medicines' | 'updates' | 'logs' | 'pharmacies' | 'users' | 'reports' | 'profile'
  >((initialTab as any) || 'stats');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // Reactive listener for storage and cloud sync events
  React.useEffect(() => {
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

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

  const handleActivateAdmin = () => {
    const adminUser = FarmaLinkDB.getProfiles().find((p) => p.role === 'admin') || {
      id: 'prof-admin-1',
      user_id: 'admin-1',
      nome: 'Grácio Hortêncio César (Licenciado em Farmácia)',
      telefone: '+258 84 123 4567',
      email: 'gracioalicete7@gmail.com',
      numero_profissional: 'OFM-MZ/2019-540 (Licenciado em Farmácia)',
      role: 'admin' as UserRole,
      status: 'active' as UserStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    FarmaLinkDB.setCurrentUser(adminUser);
    if (onSwitchUser) onSwitchUser(adminUser);
    triggerRefresh();
    showToast('Perfil de Administrador Geral (Dr. Grácio Hortêncio César) ativado com sucesso!');
  };

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // DB Data fetched with reactivity
  const pharmacies = FarmaLinkDB.getPharmacies();
  const medicines = FarmaLinkDB.getMedicines();
  const orders = FarmaLinkDB.getOrders();
  const logs = FarmaLinkDB.getLogs();
  const users = FarmaLinkDB.getUsers();
  const inventory = FarmaLinkDB.getInventory();

  // Filtered lists
  const pendingApprovals = pharmacies.filter(
    (p) =>
      p.status === 'Pendente' ||
      p.status === 'Aprovação Provisória' ||
      p.status === 'Em análise' ||
      p.status === 'Necessita correção'
  );
  const provisionalPharmacies = pharmacies.filter((p) => p.status === 'Aprovação Provisória');
  const approvedPharmacies = pharmacies.filter((p) => p.status === 'Aprovada');
  const suspendedPharmacies = pharmacies.filter((p) => p.status === 'Suspensa');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals
  const [viewDetailPharmacy, setViewDetailPharmacy] = useState<Pharmacy | null>(null);
  const [approvedSuccessPharmacy, setApprovedSuccessPharmacy] = useState<Pharmacy | null>(null);
  const [rejectionModalPharmacy, setRejectionModalPharmacy] = useState<Pharmacy | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionType, setRejectionType] = useState<'Necessita correção' | 'Rejeitada'>('Necessita correção');

  // Pharmacy Confirmation Modals (Eliminate browser alert/confirm blockages)
  const [deleteModalPharmacy, setDeleteModalPharmacy] = useState<Pharmacy | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [suspendModalPharmacy, setSuspendModalPharmacy] = useState<Pharmacy | null>(null);

  // Medicine Confirmation Modals (Eliminate browser confirm blockages)
  const [deleteModalMedicine, setDeleteModalMedicine] = useState<Medicine | null>(null);
  const [showClearAllMedicinesModal, setShowClearAllMedicinesModal] = useState(false);

  // Pharmacy Edit Modal
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);

  // Medicine Create / Edit Modal
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [medFormData, setMedFormData] = useState<Partial<Medicine>>({
    nome: '',
    principio_ativo: '',
    concentracao: '',
    forma_farmaceutica: 'Comprimidos',
    apresentacao: 'Caixa com 20 comprimidos',
    categoria: 'Analgésicos e Antipiréticos',
    precisa_receita: false,
    descricao: '',
  });

  // Admin Profile & Photo State
  const [adminNome, setAdminNome] = useState(currentUser.nome);
  const [adminTelefone, setAdminTelefone] = useState(currentUser.telefone || '+258 84 123 4567');
  const [adminNumeroProfissional, setAdminNumeroProfissional] = useState(
    currentUser.numero_profissional || 'OFM-MZ/2019-540 (Licenciado em Farmácia)'
  );
  const [adminAvatarUrl, setAdminAvatarUrl] = useState<string>(currentUser.avatar_url || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync admin state when currentUser changes
  React.useEffect(() => {
    setAdminNome(currentUser.nome);
    setAdminTelefone(currentUser.telefone || '+258 84 123 4567');
    setAdminNumeroProfissional(currentUser.numero_profissional || 'OFM-MZ/2019-540 (Licenciado em Farmácia)');
    setAdminAvatarUrl(currentUser.avatar_url || '');
  }, [currentUser]);

  const handleAdminPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('A imagem seleccionada deve ter menos de 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAdminAvatarUrl(base64);
        showToast('Foto carregada! Clique em "Salvar Alterações do Perfil" para confirmar.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated: UserProfile = {
        ...currentUser,
        nome: adminNome.trim(),
        telefone: adminTelefone.trim(),
        numero_profissional: adminNumeroProfissional.trim(),
        avatar_url: adminAvatarUrl || undefined,
        updated_at: new Date().toISOString(),
      };

      FarmaLinkDB.saveProfile(updated);
      FarmaLinkDB.setCurrentUser(updated);
      await CloudSync.syncProfile(updated);

      if (onUpdateUser) {
        onUpdateUser(updated);
      }
      if (onSwitchUser) {
        onSwitchUser(updated);
      }

      showToast('Perfil e foto do Administrador Geral atualizados com sucesso!');
      triggerRefresh();
    } catch {
      showToast('Erro ao atualizar perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemoveAdminPhoto = () => {
    setAdminAvatarUrl('');
    showToast('Foto removida. Clique em "Salvar Alterações do Perfil" para aplicar.');
  };

  // ==========================================
  // Global Statistics & Performance Analytics
  // ==========================================
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'Concluído').length;
  const readyOrders = orders.filter((o) => o.status === 'Pronto para levantamento' || o.status === 'Reservado').length;
  const inAnalysisOrders = orders.filter((o) => o.status === 'Em análise' || o.status === 'Enviado' || o.status === 'Recebido').length;
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelado' || o.status === 'Rejeitado' || o.status === 'Não disponível').length;

  const totalRevenue = orders.reduce((sum, o) => {
    if (o.preco_total) return sum + o.preco_total;
    if (o.preco_unitario) return sum + o.preco_unitario * o.quantidade;
    return sum;
  }, 0);

  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const orderSuccessRate = totalOrders > 0 ? Math.round(((completedOrders + readyOrders) / totalOrders) * 100) : 0;

  // Neighbourhood Distribution Data
  const bairroCountMap: Record<string, { total: number; approved: number }> = {};
  pharmacies.forEach((p) => {
    const b = p.bairro?.trim() || 'Outros';
    if (!bairroCountMap[b]) bairroCountMap[b] = { total: 0, approved: 0 };
    bairroCountMap[b].total += 1;
    if (p.status === 'Aprovada') bairroCountMap[b].approved += 1;
  });

  const bairroData = Object.entries(bairroCountMap)
    .map(([bairro, stats]) => ({
      bairro,
      Total: stats.total,
      Aprovadas: stats.approved,
    }))
    .sort((a, b) => b.Total - a.Total);

  // Order Status Pie Chart Data
  const orderStatusPieData = [
    { name: 'Concluído', value: completedOrders, color: '#10b981' },
    { name: 'Pronto / Reservado', value: readyOrders, color: '#3b82f6' },
    { name: 'Em Análise', value: inAnalysisOrders, color: '#f59e0b' },
    { name: 'Cancelado / Rejeitado', value: cancelledOrders, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // User Role Breakdown Data
  const userRolePieData = [
    { name: 'Utentes (Cidadãos)', value: users.filter((u) => u.role === 'user').length, color: '#065f46' },
    { name: 'Directores Técnicos', value: users.filter((u) => u.role === 'director').length, color: '#0284c7' },
    { name: 'Administradores', value: users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length, color: '#8b5cf6' },
  ].filter((item) => item.value > 0);

  // Top Requested Medicines in Tete
  const medDemandMap: Record<string, { nome: string; pedidos: number; quantidade: number; valorTotal: number }> = {};
  orders.forEach((o) => {
    const key = o.medicine_nome || 'Medicamento Geral';
    if (!medDemandMap[key]) {
      medDemandMap[key] = { nome: key, pedidos: 0, quantidade: 0, valorTotal: 0 };
    }
    medDemandMap[key].pedidos += 1;
    medDemandMap[key].quantidade += o.quantidade;
    const price = o.preco_total || (o.preco_unitario ? o.preco_unitario * o.quantidade : 0);
    medDemandMap[key].valorTotal += price;
  });

  const topDemandedMedicines = Object.values(medDemandMap)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  // Inventory Health across pharmacies
  const inStockCount = inventory.filter((i) => i.disponibilidade === 'Disponível').length;
  const lowStockCount = inventory.filter((i) => i.disponibilidade === 'Pouca quantidade').length;
  const outOfStockCount = inventory.filter((i) => i.disponibilidade === 'Indisponível' || i.disponibilidade === 'Temporariamente indisponível').length;

  const inventoryPieData = [
    { name: 'Em Estoque', value: inStockCount, color: '#10b981' },
    { name: 'Poucas Unidades', value: lowStockCount, color: '#f59e0b' },
    { name: 'Esgotado', value: outOfStockCount, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Pharmacy Performance Table Data
  const pharmacyPerformanceList = pharmacies.map((pharm) => {
    const pharmOrders = orders.filter((o) => o.pharmacy_id === pharm.id);
    const pharmInventory = inventory.filter((i) => i.pharmacy_id === pharm.id);
    const pharmRevenue = pharmOrders.reduce(
      (acc, o) => acc + (o.preco_total || (o.preco_unitario ? o.preco_unitario * o.quantidade : 0)),
      0
    );
    const completed = pharmOrders.filter((o) => o.status === 'Concluído').length;

    return {
      pharmacy: pharm,
      totalOrders: pharmOrders.length,
      completedOrders: completed,
      inventoryCount: pharmInventory.length,
      revenue: pharmRevenue,
      completionRate: pharmOrders.length > 0 ? Math.round((completed / pharmOrders.length) * 100) : 100,
    };
  }).sort((a, b) => b.totalOrders - a.totalOrders || b.inventoryCount - a.inventoryCount);

  // --- Handlers: Pharmacy Approval (Requirement #25) ---
  const handleApprovePharmacy = (pharmacyId: string) => {
    const target = pharmacies.find((p) => p.id === pharmacyId);
    if (!target) return;

    FarmaLinkDB.updatePharmacyStatus(pharmacyId, 'Aprovada', undefined, currentUser);
    target.is_verified = true;
    target.status = 'Aprovada';
    FarmaLinkDB.savePharmacy(target, currentUser);
    CloudSync.syncPharmacy(target);

    showToast(`Farmácia "${target.nome}" foi aprovada e homologada no FarmaLink Tete!`);
    if (viewDetailPharmacy?.id === pharmacyId) {
      setViewDetailPharmacy({ ...viewDetailPharmacy, status: 'Aprovada', is_verified: true });
    }
    setApprovedSuccessPharmacy(target);
    triggerRefresh();
  };

  const handleOpenRejectModal = (pharmacy: Pharmacy) => {
    setRejectionModalPharmacy(pharmacy);
    setRejectionReason('');
    setRejectionType('Necessita correção');
  };

  const handleRejectPharmacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalPharmacy || !rejectionReason.trim()) return;

    FarmaLinkDB.updatePharmacyStatus(
      rejectionModalPharmacy.id,
      rejectionType,
      rejectionReason.trim(),
      currentUser
    );

    showToast(`Decisão registada: Farmácia "${rejectionModalPharmacy.nome}" marcada como "${rejectionType}".`);
    setRejectionModalPharmacy(null);
    setRejectionReason('');
    if (viewDetailPharmacy?.id === rejectionModalPharmacy.id) {
      setViewDetailPharmacy(null);
    }
    triggerRefresh();
  };

  const handleSuspendPharmacy = (pharmacy: Pharmacy) => {
    setSuspendModalPharmacy(pharmacy);
  };

  const handleConfirmSuspendPharmacy = () => {
    if (!suspendModalPharmacy) return;
    const target = suspendModalPharmacy;
    FarmaLinkDB.updatePharmacyStatus(target.id, 'Suspensa', 'Suspensão determinada pelo Administrador', currentUser);
    showToast(`Farmácia "${target.nome}" foi suspensa temporariamente.`);
    setSuspendModalPharmacy(null);
    if (viewDetailPharmacy?.id === target.id) {
      setViewDetailPharmacy(null);
    }
    triggerRefresh();
  };

  const handleReactivatePharmacy = (pharmacyId: string) => {
    FarmaLinkDB.updatePharmacyStatus(pharmacyId, 'Aprovada', undefined, currentUser);
    showToast('Farmácia reativada com sucesso!');
    triggerRefresh();
  };

  const handleDeletePharmacy = (pharmacy: Pharmacy) => {
    setDeleteModalPharmacy(pharmacy);
  };

  const handleConfirmDeletePharmacy = () => {
    if (!deleteModalPharmacy) return;
    const target = deleteModalPharmacy;
    FarmaLinkDB.deletePharmacy(target.id, currentUser);
    showToast(`Registo da farmácia "${target.nome}" foi eliminado permanentemente.`);
    setDeleteModalPharmacy(null);
    if (viewDetailPharmacy?.id === target.id) {
      setViewDetailPharmacy(null);
    }
    triggerRefresh();
  };

  const handleClearAllPharmacies = () => {
    setShowClearAllModal(true);
  };

  const handleConfirmClearAllPharmacies = () => {
    FarmaLinkDB.clearAllPharmacies(currentUser);
    showToast('Todas as farmácias de exemplo foram removidas com sucesso.');
    setShowClearAllModal(false);
    triggerRefresh();
  };

  const handleSavePharmacyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPharmacy) return;

    FarmaLinkDB.savePharmacy(editingPharmacy, currentUser);
    showToast(`Dados da farmácia "${editingPharmacy.nome}" atualizados com sucesso.`);
    setEditingPharmacy(null);
    triggerRefresh();
  };

  // Helper to create a demo pending pharmacy for quick testing of approvals
  const handleCreateDemoPendingPharmacy = () => {
    const demoId = `pharm-pending-${Date.now().toString().slice(-4)}`;
    const randomBairros = ['Chingodzi', 'Matundo', 'Degue', 'Francisco Manyanga', 'Josina Machel', 'Samora Machel'];
    const randomBairro = randomBairros[Math.floor(Math.random() * randomBairros.length)];
    const motivations = [
      `Garantir cobertura farmacêutica e assistência rápida no Bairro ${randomBairro}, com serviço de atendimento de urgência 24h e estoque em Meticais integrado na plataforma provincial.`,
      `Expandir a oferta de antibióticos essenciais, antimaláricos e acompanhamento farmacêutico humanizado para as famílias residentes em ${randomBairro}.`,
      `Modernizar o atendimento ao utente em Tete através de reservas antecipadas e transparência no catálogo oficial de medicamentos.`,
      `Prover serviços de aferição de tensão, glicemia e dispensa responsável de medicamentos crónicos no Bairro ${randomBairro}.`,
    ];
    const chosenMotivation = motivations[Math.floor(Math.random() * motivations.length)];

    const newDemoPharmacy: Pharmacy = {
      id: demoId,
      nome: `Farmácia Zambeze Saúde ${Math.floor(Math.random() * 90) + 10}`,
      nuit: `400${Math.floor(Math.random() * 899999 + 100000)}`,
      license_number: `MS/DISP/TETE/${new Date().getFullYear()}/${Math.floor(Math.random() * 90 + 10)}`,
      director_id: `dir-demo-${Date.now().toString().slice(-4)}`,
      director_name: `Dr. Inácio Macamo (${randomBairro})`,
      telefone: `+258 84 ${Math.floor(Math.random() * 899 + 100)} ${Math.floor(Math.random() * 8999 + 1000)}`,
      email: `contacto.farmacia${Date.now().toString().slice(-4)}@farmalink.mz`,
      endereco: `Avenida Principal de ${randomBairro}, Parcela ${Math.floor(Math.random() * 150 + 1)}`,
      bairro: randomBairro,
      cidade: 'Cidade de Tete',
      provincia: 'Tete',
      latitude: -16.155 + (Math.random() - 0.5) * 0.04,
      longitude: 33.585 + (Math.random() - 0.5) * 0.04,
      horario: '08:00 - 20:00',
      dias_funcionamento: 'Segunda a Sábado',
      descricao: `Nova unidade farmacêutica comunitária estabelecida no Bairro ${randomBairro} com instalações adequadas e directoria técnica credenciada.`,
      motivacao_cadastro: chosenMotivation,
      logo_url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=200&auto=format&fit=crop&q=80',
      status: 'Pendente',
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    FarmaLinkDB.savePharmacy(newDemoPharmacy, currentUser);

    FarmaLinkDB.savePhoto({
      id: `photo-${Date.now()}-1`,
      pharmacy_id: demoId,
      image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80',
      type: 'fachada',
      caption: 'Fachada Principal da Farmácia',
      created_at: new Date().toISOString(),
    });

    showToast(`Nova solicitação de farmácia (${newDemoPharmacy.nome}) criada na fila de aprovação!`);
    setActiveTab('approvals');
    triggerRefresh();
  };

  // --- Handlers: Catalog Medicines (Requirement #27) ---
  const handleOpenAddMedicine = () => {
    setEditingMedicine(null);
    setMedFormData({
      nome: '',
      principio_ativo: '',
      concentracao: '',
      forma_farmaceutica: 'Comprimidos',
      apresentacao: 'Caixa com 20 comprimidos',
      categoria: 'Analgésicos e Antipiréticos',
      precisa_receita: false,
      descricao: '',
    });
    setShowMedicineModal(true);
  };

  const handleOpenEditMedicine = (med: Medicine) => {
    setEditingMedicine(med);
    setMedFormData({ ...med });
    setShowMedicineModal(true);
  };

  const handleSaveMedicineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medFormData.nome?.trim() || !medFormData.principio_ativo?.trim()) {
      alert('Nome e Princípio Ativo são obrigatórios.');
      return;
    }

    const medId =
      editingMedicine?.id ||
      `med-${medFormData.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const fullMed: Medicine = {
      id: medId,
      nome: medFormData.nome.trim(),
      principio_ativo: medFormData.principio_ativo.trim(),
      concentracao: medFormData.concentracao?.trim() || 'Dose padrão',
      forma_farmaceutica: medFormData.forma_farmaceutica || 'Comprimidos',
      apresentacao: medFormData.apresentacao?.trim() || 'Embalagem padrão',
      categoria: medFormData.categoria || 'Geral',
      precisa_receita: !!medFormData.precisa_receita,
      descricao: medFormData.descricao?.trim() || '',
      created_at: editingMedicine?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    FarmaLinkDB.saveMedicine(fullMed, currentUser);
    CloudSync.syncMedicine(fullMed);
    showToast(
      editingMedicine
        ? `Medicamento "${fullMed.nome}" atualizado no catálogo!`
        : `Medicamento "${fullMed.nome}" cadastrado com sucesso no catálogo provincial de Tete!`
    );
    setShowMedicineModal(false);
    triggerRefresh();
  };

  const handleDeleteMedicine = (med: Medicine) => {
    setDeleteModalMedicine(med);
  };

  const handleConfirmDeleteMedicine = () => {
    if (!deleteModalMedicine) return;
    const medName = deleteModalMedicine.nome;
    FarmaLinkDB.deleteMedicine(deleteModalMedicine.id, currentUser);
    CloudSync.deleteMedicine(deleteModalMedicine.id);
    showToast(`Medicamento "${medName}" removido com sucesso do catálogo provincial.`);
    setDeleteModalMedicine(null);
    triggerRefresh();
  };

  const handleConfirmClearAllMedicines = () => {
    FarmaLinkDB.clearAllMedicines(currentUser);
    CloudSync.clearAllMedicines();
    showToast('Todos os medicamentos de exemplo foram excluídos do catálogo.');
    setShowClearAllMedicinesModal(false);
    triggerRefresh();
  };

  // --- Handlers: Users Management ---
  const handleUpdateUserRole = (user: UserProfile, newRole: UserRole) => {
    const updated: UserProfile = { ...user, role: newRole, updated_at: new Date().toISOString() };
    FarmaLinkDB.saveProfile(updated);
    CloudSync.syncProfile(updated);
    FarmaLinkDB.addAuditLog({
      user_id: currentUser.user_id,
      user_name: currentUser.nome,
      user_email: currentUser.email,
      action: 'ALTERAR_PAPEL_UTILIZADOR',
      entity: 'user',
      entity_id: user.user_id,
      metadata: `Alterado papel de ${user.nome} para ${newRole.toUpperCase()}`,
    });
    showToast(`Papel de "${user.nome}" alterado para ${newRole.toUpperCase()}.`);
    triggerRefresh();
  };

  const handleToggleUserStatus = (user: UserProfile) => {
    const newStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    const updated: UserProfile = { ...user, status: newStatus, updated_at: new Date().toISOString() };
    FarmaLinkDB.saveProfile(updated);
    FarmaLinkDB.addAuditLog({
      user_id: currentUser.user_id,
      user_name: currentUser.nome,
      user_email: currentUser.email,
      action: 'ALTERAR_ESTADO_UTILIZADOR',
      entity: 'user',
      entity_id: user.user_id,
      metadata: `Status de ${user.nome} alterado para ${newStatus}`,
    });
    showToast(`Status de "${user.nome}" alterado para ${newStatus === 'active' ? 'Ativo' : 'Suspenso'}.`);
    triggerRefresh();
  };

  // --- CSV Export Helper (Requirement #30) ---
  const exportToCsv = (filename: string, rows: any[]) => {
    if (rows.length === 0) {
      alert('Sem dados para exportar.');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        headers.join(','),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const val = (r as Record<string, any>)[h];
              if (val === null || val === undefined) return '""';
              if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
              return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_farmalink_tete_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Ficheiro CSV "${filename}" gerado e descarregado com sucesso!`);
  };

  return (
    <div id="admin-portal-view" className="space-y-4 pb-12">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMsg}</p>
        </div>
      )}

      {/* Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title="Portal do Administrador Geral"
          subtitle="Gestão Central da Rede & Catálogo FarmaLink Tete"
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
        />
      )}

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Foto de Perfil do Administrador com Badge e Ação Rápida */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-400/50 shadow-lg flex items-center justify-center text-white font-black text-xl sm:text-2xl ring-4 ring-white/10">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser.nome.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              {/* Botão de Trocar Foto Rápido sobreposto */}
              <label
                htmlFor="admin-quick-photo-upload"
                className="absolute -bottom-1.5 -right-1.5 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-md cursor-pointer transition-all hover:scale-110 active:scale-95 border-2 border-slate-900"
                title="Carregar ou alterar foto de perfil do administrador"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="admin-quick-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAdminPhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 px-3 py-0.5 rounded-full text-xs font-bold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Administrador Geral • FarmaLink Tete</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                {currentUser.nome}
              </h1>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-2 flex-wrap">
                <span>{currentUser.email}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300 font-semibold">{currentUser.numero_profissional || 'Licenciado em Farmácia'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-admin-view-profile-tab"
              onClick={() => setActiveTab('profile')}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <Camera className="w-4 h-4 text-emerald-300" />
              <span>Gerir Foto & Perfil</span>
            </button>

            <button
              type="button"
              onClick={handleCreateDemoPendingPharmacy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl border border-emerald-400/40 shadow-xs transition-colors"
              title="Simular pedido de cadastro para testar aprovações"
            >
              <Plus className="w-4 h-4" />
              <span>+ Simular Nova Farmácia</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja repor a base de dados oficial de lançamento? Isto irá manter o catálogo mestre de medicamentos e a Farmácia Clínica Mais Saúde do Dr. Grácio César, removendo dados e pedidos de teste.')) {
                  FarmaLinkDB.resetToOfficialCleanState();
                  showToast('Base de dados reposta com sucesso para o estado oficial de lançamento!');
                  triggerRefresh();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow-xs transition-colors"
              title="Repor dados limpos oficiais de lançamento"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Limpar Dados de Teste</span>
            </button>
          </div>
        </div>

        {/* 5 Core Pillars Quick Jump Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-4 border-t border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`p-3 rounded-2xl text-left transition-all border ${
              activeTab === 'catalog'
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-2 ring-emerald-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded">5.000+</span>
            </div>
            <p className="text-xs font-black">1. Controla Catálogo</p>
            <span className="text-[10px] text-slate-300">Base mestre & alertas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`p-3 rounded-2xl text-left transition-all border ${
              activeTab === 'approvals'
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-2 ring-emerald-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              {pendingApprovals.length > 0 ? (
                <span className="text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingApprovals.length}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-400">0 pendente</span>
              )}
            </div>
            <p className="text-xs font-black">2. Aprova Farmácias</p>
            <span className="text-[10px] text-slate-300">Homologação DPS Tete</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medicines')}
            className={`p-3 rounded-2xl text-left transition-all border ${
              activeTab === 'medicines'
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-2 ring-emerald-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Pill className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] font-black bg-teal-400/20 text-teal-300 px-1.5 py-0.5 rounded">{medicines.length}</span>
            </div>
            <p className="text-xs font-black">3. Gerencia Fármacos</p>
            <span className="text-[10px] text-slate-300">Estoques provinciais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`p-3 rounded-2xl text-left transition-all border ${
              activeTab === 'updates' || activeTab === 'logs'
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-2 ring-emerald-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-black bg-cyan-400/20 text-cyan-300 px-1.5 py-0.5 rounded">{logs.length}</span>
            </div>
            <p className="text-xs font-black">4. Acompanha Atualizações</p>
            <span className="text-[10px] text-slate-300">Feed ao vivo & auditoria</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`p-3 rounded-2xl text-left transition-all border col-span-2 sm:col-span-1 ${
              activeTab === 'stats'
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-2 ring-emerald-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded">BI</span>
            </div>
            <p className="text-xs font-black">5. Visualiza Estatísticas</p>
            <span className="text-[10px] text-slate-300">Inteligência & Recharts</span>
          </button>
        </div>

        {/* Detailed Admin Navigation Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-700/40 text-xs font-bold">
          <button
            type="button"
            id="admin-tab-stats"
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Estatísticas Globais</span>
          </button>

          <button
            type="button"
            id="admin-tab-catalog"
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Controle do Catálogo Mestre (5.000+)</span>
          </button>

          <button
            type="button"
            id="admin-tab-approvals"
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'approvals'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Aprovações Pendentes</span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {pendingApprovals.length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="admin-tab-medicines"
            onClick={() => setActiveTab('medicines')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'medicines'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Fármacos em Tete ({medicines.length})</span>
          </button>

          <button
            type="button"
            id="admin-tab-updates"
            onClick={() => setActiveTab('updates')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'updates' || activeTab === 'logs'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Atualizações & Auditoria ({logs.length})</span>
          </button>

          <button
            type="button"
            id="admin-tab-pharmacies"
            onClick={() => setActiveTab('pharmacies')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'pharmacies'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Farmácias ({pharmacies.length})</span>
          </button>

          <button
            type="button"
            id="admin-tab-users"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Utilizadores ({users.length})</span>
          </button>

          <button
            type="button"
            id="admin-tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Relatórios CSV</span>
          </button>

          <button
            type="button"
            id="admin-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Perfil</span>
          </button>
        </div>
      </div>

      {/* Admin Switcher Alert if not admin role */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Acesso Administrativo em Modo Demonstração</h3>
              <p className="text-xs text-slate-600">
                Está registado como <strong>{currentUser.nome}</strong> ({currentUser.role}). Para ter permissões máximas de auditoria e aprovação sanitária como Administrador oficial, clique no botão ao lado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleActivateAdmin}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 transition-colors"
          >
            Ativar Perfil de Administrador Oficial
          </button>
        </div>
      )}

      {/* Pending Approvals Urgent Notice - Visible on all non-approvals tabs */}
      {pendingApprovals.length > 0 && activeTab !== 'approvals' && (
        <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-amber-500/20 border-2 border-amber-400 p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Fila de Homologação Ativa
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {pendingApprovals.length} {pendingApprovals.length === 1 ? 'farmácia aguardando auditoria / homologação sanitária' : 'farmácias aguardando auditoria / homologação sanitária'}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                {pendingApprovals.map((p) => `"${p.nome}" (${p.bairro} • ${p.status})`).slice(0, 3).join(', ')}
                {pendingApprovals.length > 3 ? ` e mais ${pendingApprovals.length - 3}...` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Auditar & Homologar Agora ({pendingApprovals.length})</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 0: GLOBAL STATISTICS & PERFORMANCE (NEW MONITORING DASHBOARD)          */}
      {/* ========================================================================= */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Main Visualizer Component with Recharts: Volume de Pedidos, Farmácias Mais Ativas e Crescimento de Utilizadores em Tete */}
          <AdminAnalyticsDashboard
            pharmacies={pharmacies}
            orders={orders}
            users={users}
            inventory={inventory}
            medicines={medicines}
            onSelectPharmacy={onSelectPharmacy}
          />

          {/* Charts Row 2: Top Demanded Medicines & Inventory Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Demanded Medicines */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span>Medicamentos Mais Procurados & Reservados</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fármacos com maior demanda populacional nas farmácias de Tete.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('medicines')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Ver Catálogo</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {topDemandedMedicines.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {topDemandedMedicines.map((med, idx) => (
                    <div
                      key={med.nome}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{med.nome}</p>
                          <span className="text-[10px] text-slate-400">
                            {med.pedidos} pedido(s) • Quantidade total: {med.quantidade} un.
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-emerald-900 text-xs block">
                          {med.valorTotal.toFixed(2).replace('.', ',')} MZN
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">movimentados</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Ainda não há histórico de demanda de medicamentos.
                </div>
              )}
            </div>

            {/* Inventory Health & Stock Breakdown */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    <span>Disponibilidade & Estoque Provincial</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Visão geral dos {inventory.length} itens estocados nas farmácias licenciadas.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {medicines.length} Fármacos Cadastrados
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Em Estoque</span>
                  <p className="text-xl font-black text-emerald-900">{inStockCount}</p>
                  <span className="text-[10px] text-emerald-700">Disponibilidade Imediata</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase">Poucas Unid.</span>
                  <p className="text-xl font-black text-amber-900">{lowStockCount}</p>
                  <span className="text-[10px] text-amber-700">Atenção ao Reabastecimento</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-red-800 uppercase">Esgotados</span>
                  <p className="text-xl font-black text-red-900">{outOfStockCount}</p>
                  <span className="text-[10px] text-red-700">Ruptura de Estoque</span>
                </div>
              </div>

              {/* Rx vs OTC breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700 font-semibold">
                  <span>Regime de Aquisição de Fármacos em Tete:</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Receita Médica Obrigatória</span>
                      <strong className="text-amber-900 text-sm">
                        {medicines.filter((m) => m.precisa_receita).length} Fármacos
                      </strong>
                    </div>
                    <FileCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Venda Livre (OTC)</span>
                      <strong className="text-emerald-900 text-sm">
                        {medicines.filter((m) => !m.precisa_receita).length} Fármacos
                      </strong>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Monitoring Table */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Desempenho & Atividade Operacional por Farmácia</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ranking de atividade, inventário ativo e eficiência de atendimento aos cidadãos de Tete.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('pharmacies')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Directório Completo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3">Farmácia</th>
                    <th className="pb-3">Bairro</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Itens no Inventário</th>
                    <th className="pb-3">Pedidos Atendidos</th>
                    <th className="pb-3">Taxa de Conclusão</th>
                    <th className="pb-3 text-right">Volume (MZN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pharmacyPerformanceList.map(({ pharmacy, totalOrders: pOrders, completedOrders: pCompleted, inventoryCount, revenue: pRev, completionRate }) => (
                    <tr key={pharmacy.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <img src={pharmacy.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" />
                          <span>{pharmacy.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">{pharmacy.bairro}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pharmacy.status === 'Aprovada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pharmacy.status === 'Pendente'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pharmacy.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 font-bold">{inventoryCount} itens</td>
                      <td className="py-3 text-slate-700">
                        {pCompleted} / {pOrders}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 text-[11px]">{completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-900">
                        {pRev.toFixed(2).replace('.', ',')} MZN
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: CONTROL MASTER CATALOG (5,000+ MEDICINES GOVERNANCE)                 */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <AdminMasterCatalogGovernance
          currentUser={currentUser}
          onRefresh={triggerRefresh}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PENDING APPROVALS (Requirement #25)                                */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB 1: PENDING APPROVALS & POSTERIOR AUDIT (Requirement #25)               */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-5">
          {/* Banner de Homologação e Aprovação de Farmácias pelo Administrador */}
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 border-2 border-emerald-500/40 shadow-md relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Governança Sanitária DPS Tete
                  </span>
                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    ✓ Homologação Manual Oficial
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Auditoria & Homologação de Novas Farmácias
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Todas as farmácias recém-cadastradas na Província de Tete entram nesta fila de auditoria com estado <strong>Pendente</strong>. Como Administrador Geral, você valida os dados documentais (NUIT, Alvará da DPS e Director Técnico) e aprova a farmácia para que ela entre em operação no directório público e atenda os utentes.
                </p>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
                <div className="bg-white/10 border border-white/15 px-3.5 py-2 rounded-2xl text-center md:text-right">
                  <span className="text-[10px] text-emerald-200 block font-semibold uppercase">Fila de Aprovação</span>
                  <span className="text-lg font-black text-white">{pendingApprovals.length} pendente(s)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Fila de Auditoria & Homologação em Tete</span>
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                  {pendingApprovals.length} farmácia(s)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Avalie a conformidade do NUIT, licença sanitária da DPS Tete, director técnico e fotos das instalações antes de conferir a chancela definitiva.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateDemoPendingPharmacy}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simular Novo Cadastro para Teste</span>
            </button>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-sm">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Todas as farmácias estão homologadas em definitivo!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Não existem farmácias pendentes de auditoria posterior no momento. Todas as farmácias aprovadas encontram-se disponíveis no Directório Geral e prontas para gestão de medicamentos e estoque.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pharmacies')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-emerald-700" />
                  <span>Ver Directório de Farmácias ({pharmacies.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('director-portal', { tab: 'medicines' })}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Pill className="w-4 h-4" />
                  <span>Ir para o Portal de Medicamentos & Estoque</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((pharm) => {
                const pharmPhotos = FarmaLinkDB.getPhotos(pharm.id);
                const isProvisional = pharm.status === 'Aprovação Provisória';
                return (
                  <div
                    key={pharm.id}
                    className={`bg-white rounded-3xl p-5 sm:p-7 border shadow-sm space-y-5 transition-all ${
                      isProvisional
                        ? 'border-emerald-300 ring-2 ring-emerald-100'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={pharm.logo_url}
                          alt={pharm.nome}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-lg sm:text-xl">{pharm.nome}</h3>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                isProvisional
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : pharm.status === 'Pendente'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : pharm.status === 'Necessita correção'
                                  ? 'bg-orange-100 text-orange-900 border border-orange-200'
                                  : 'bg-blue-100 text-blue-900 border border-blue-200'
                              }`}
                            >
                              {isProvisional ? '⚡ Aprovação Provisória (Auditoria Posterior)' : `Status: ${pharm.status}`}
                            </span>
                            {pharm.compliance_score && (
                              <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                                Conformidade: {pharm.compliance_score}%
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {pharm.endereco}, <strong>{pharm.bairro}</strong> — {pharm.cidade}
                            </span>
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-1 text-xs text-slate-600">
                            <div>
                              <span className="text-slate-400">Director Técnico:</span>{' '}
                              <strong className="text-slate-900">{pharm.director_name}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">NUIT Fiscal:</span>{' '}
                              <strong className="text-slate-900 font-mono">{pharm.nuit}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Alvará Sanitário DPS:</span>{' '}
                              <strong className="text-emerald-800 font-semibold">{pharm.license_number}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Contacto:</span>{' '}
                              <span>{pharm.telefone} • {pharm.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Solicitado em: {new Date(pharm.created_at).toLocaleDateString('pt-MZ')}
                        </span>
                        {isProvisional && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            ✓ Operando em Regime Provisório
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Checkbox de Conformidade Prévia Verificada */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs flex flex-wrap items-center gap-3">
                      <span className="font-bold text-slate-700">Verificação Documental:</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        ✓ NUIT Válido
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        ✓ Alvará DPS Registado
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        ✓ Director Técnico Nomeado
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        ✓ Localização em Tete
                      </span>
                    </div>

                    {/* Motivação do Director Técnico */}
                    <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/90 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Motivação & Justificativa do Director Técnico:</span>
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          Adesão FarmaLink Tete
                        </span>
                      </div>
                      <p className="text-slate-700 italic font-medium leading-relaxed">
                        "{pharm.motivacao_cadastro || 'O Director Técnico submeteu o processo para homologação oficial da farmácia, visando disponibilizar estoques de medicamentos essenciais aos munícipes de Tete.'}"
                      </p>
                      <span className="text-[11px] text-emerald-800 font-bold block text-right">
                        — {pharm.director_name} (Director Técnico Responsável)
                      </span>
                    </div>

                    {/* Description and photos preview */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                      <div>
                        <span className="font-bold text-slate-800">Descrição das Instalações & Serviços:</span>
                        <p className="text-slate-600 mt-0.5">{pharm.descricao || 'Sem descrição informada.'}</p>
                      </div>

                      {pharmPhotos.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="font-bold text-slate-700 block mb-1.5">
                            Fotos Submetidas ({pharmPhotos.length}):
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {pharmPhotos.map((photo) => (
                              <img
                                key={photo.id}
                                src={photo.image_url}
                                alt={photo.caption || 'Foto da farmácia'}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {pharm.rejection_reason && (
                        <div className="bg-amber-100/70 border border-amber-300 p-2.5 rounded-xl text-amber-900 text-xs">
                          <strong>Observações anteriores / Motivo de correção:</strong> {pharm.rejection_reason}
                        </div>
                      )}
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewDetailPharmacy(pharm)}
                          className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver Ficha Completa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePharmacy(pharm)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Eliminar este pedido de homologação permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(pharm)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Solicitar Correção / Rejeitar</span>
                        </button>

                        <button
                          type="button"
                          id={`approve-pharmacy-btn-${pharm.id}`}
                          onClick={() => handleApprovePharmacy(pharm.id)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 scale-100 active:scale-95 cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-emerald-200" />
                          <span>{isProvisional ? 'Homologar em Definitivo (DPS)' : 'Aprovar & Homologar Farmácia'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÃO DE FARMÁCIAS HOMOLOGADAS & APROVADAS (ATIVAS NA PLATAFORMA)          */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Farmácias Homologadas & Aprovadas (Ativas na Plataforma)</span>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {approvedPharmacies.length} ativa(s)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Todas as farmácias abaixo estão ativas no directório público e no mapa, com ou sem medicamentos. O Director Técnico e o Administrador possuem acesso pleno para cadastrar e gerir medicamentos e estoques.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pharmacies')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Ver Directório Geral</span>
                </button>
              </div>
            </div>

            {approvedPharmacies.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-sm font-semibold text-slate-600">Nenhuma farmácia aprovada no momento.</p>
                <p className="text-xs text-slate-400 mt-1">Aprove as farmácias pendentes acima para ativá-las na plataforma.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedPharmacies
                  .slice()
                  .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
                  .map((pharm) => {
                    const pharmStocks = FarmaLinkDB.getPharmacyMedicines(pharm.id);
                    const hasStock = pharmStocks.length > 0;
                    return (
                      <div
                        key={pharm.id}
                        className="bg-slate-50/80 hover:bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-sm space-y-3.5"
                      >
                        <div className="flex items-start gap-3.5">
                          <img
                            src={pharm.logo_url}
                            alt={pharm.nome}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap justify-between">
                              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base break-words">
                                {pharm.nome}
                              </h3>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Ativa & Homologada</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium break-words mt-0.5">
                              {pharm.endereco}, {pharm.bairro} — {pharm.cidade}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-600 mt-1">
                              <span>Director Técnico: <strong className="text-slate-900 font-bold">{pharm.director_name}</strong></span>
                              <span>•</span>
                              <span className="font-mono text-emerald-800 font-bold">{pharm.license_number}</span>
                              <span>•</span>
                              <span>NUIT: {pharm.nuit}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status do Estoque */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800">
                                {hasStock ? `${pharmStocks.length} Medicamento(s) em Estoque` : 'Sem Medicamentos Cadastrados'}
                              </span>
                              <p className="text-[11px] text-slate-500">
                                {hasStock
                                  ? 'Disponíveis para pesquisa e pedidos de pacientes'
                                  : 'Farmácia ativa! Pronta para cadastrar o primeiro lote de remédios'}
                              </p>
                            </div>
                          </div>
                          {!hasStock && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">
                              Novo
                            </span>
                          )}
                        </div>

                        {/* Barra de Ações Rápidas para o Administrador */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/70">
                          <button
                            type="button"
                            onClick={() => onNavigate('director-portal', { pharmacyId: pharm.id, tab: 'medicines' })}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Gerir medicamentos e estoque desta farmácia"
                          >
                            <Pill className="w-3.5 h-3.5" />
                            <span>Gerir Medicamentos</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigate('pharmacy-detail', { pharmacyId: pharm.id })}
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                            title="Ver página pública da farmácia"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>Directório</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingPharmacy(pharm)}
                            className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            title="Editar dados ou alvará"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSuspendPharmacy(pharm)}
                            className="py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            title="Suspender farmácia"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL PHARMACIES DIRECTORY (Requirement #26)                         */}
      {/* ========================================================================= */}
      {activeTab === 'pharmacies' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Directório Provincial de Farmácias de Tete
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total de {pharmacies.length} farmácias registadas ({approvedPharmacies.length} ativas, {pendingApprovals.length} pendentes, {suspendedPharmacies.length} suspensas).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {pharmacies.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllPharmacies}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-red-200 transition-colors"
                    title="Remover todas as farmácias de exemplo"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Limpar Exemplos</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCreateDemoPendingPharmacy}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Nova Farmácia</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por nome, bairro, director ou NUIT..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filtrar por estado da farmácia"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-semibold"
              >
                <option value="all">Todos os Estados ({pharmacies.length})</option>
                <option value="Pendente">Pendentes & Em Homologação ({pendingApprovals.length})</option>
                <option value="Aprovação Provisória">Aprovação Provisória ({provisionalPharmacies.length})</option>
                <option value="Aprovada">Aprovadas / Ativas ({approvedPharmacies.length})</option>
                <option value="Suspensa">Suspensas ({suspendedPharmacies.length})</option>
                <option value="Rejeitada">Rejeitadas / Necessita Correção</option>
              </select>
            </div>
          </div>

          {/* Pharmacies Table */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3">Farmácia</th>
                  <th className="pb-3">Bairro / Local</th>
                  <th className="pb-3">Director Técnico</th>
                  <th className="pb-3">Alvará & NUIT</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Ações Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pharmacies
                  .slice()
                  .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
                  .filter((pharm) => {
                    const matchSearch =
                      pharm.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      pharm.bairro.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      pharm.director_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      pharm.nuit.includes(searchTerm);
                    const matchStatus =
                      statusFilter === 'all' ||
                      pharm.status === statusFilter ||
                      (statusFilter === 'Pendente' &&
                        (pharm.status === 'Pendente' ||
                          pharm.status === 'Aprovação Provisória' ||
                          pharm.status === 'Em análise' ||
                          pharm.status === 'Necessita correção')) ||
                      (statusFilter === 'Rejeitada' &&
                        (pharm.status === 'Rejeitada' || pharm.status === 'Necessita correção'));
                    return matchSearch && matchStatus;
                  })
                  .map((pharm) => (
                    <tr key={pharm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <img src={pharm.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{pharm.nome}</p>
                            <span className="text-[10px] text-slate-400 font-normal">{pharm.telefone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-700">
                        <span className="font-semibold">{pharm.bairro}</span>
                        <p className="text-[10px] text-slate-400">{pharm.cidade}</p>
                      </td>
                      <td className="py-3.5 text-slate-700 font-medium">{pharm.director_name}</td>
                      <td className="py-3.5 text-slate-600">
                        <span className="font-mono text-[11px] text-emerald-800 font-bold block">{pharm.license_number}</span>
                        <span className="text-[10px] text-slate-400">NUIT: {pharm.nuit}</span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            pharm.status === 'Aprovada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pharm.status === 'Suspensa'
                              ? 'bg-red-100 text-red-800'
                              : pharm.status === 'Pendente'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pharm.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onNavigate('director-portal', { pharmacyId: pharm.id, tab: 'medicines' })}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] border border-emerald-200 inline-flex items-center gap-1 transition-colors"
                          title={`Cadastrar medicamentos e gerir estoque de ${pharm.nome}`}
                        >
                          <Pill className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Medicamentos</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewDetailPharmacy(pharm)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px]"
                          title="Ver detalhes"
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingPharmacy(pharm)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px]"
                          title="Editar dados cadastrais"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>

                        {pharm.status === 'Aprovada' ? (
                          <button
                            type="button"
                            onClick={() => handleSuspendPharmacy(pharm)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[11px]"
                            title="Suspender farmácia"
                          >
                            Suspender
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApprovePharmacy(pharm.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                            title="Aprovar farmácia"
                          >
                            Aprovar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeletePharmacy(pharm)}
                          className="px-2 py-1 text-slate-400 hover:text-red-600 rounded-lg text-[11px]"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GENERAL MEDICINES CATALOG (Requirement #27)                        */}
      {/* ========================================================================= */}
      {activeTab === 'medicines' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Catálogo Geral de Medicamentos • Província de Tete
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Base oficial de {medicines.length} medicamentos autorizados pela Direcção de Saúde para comercialização e gestão de estoque em Tete.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {medicines.length > 0 && (
                  <button
                    type="button"
                    id="admin-clear-all-meds-btn"
                    onClick={() => setShowClearAllMedicinesModal(true)}
                    className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 flex items-center gap-1.5 transition-colors"
                    title="Remover todos os medicamentos de teste para cadastrar os reais"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Catálogo (Modo Teste)</span>
                  </button>
                )}

                <button
                  type="button"
                  id="admin-add-new-med-btn"
                  onClick={handleOpenAddMedicine}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Cadastrar Novo Medicamento</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por nome comercial ou princípio ativo (DCI)..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filtrar por categoria farmacêutica"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-semibold"
              >
                <option value="all">Todas as Categorias</option>
                <option value="Analgésicos e Antipiréticos">Analgésicos e Antipiréticos</option>
                <option value="Antibióticos">Antibióticos</option>
                <option value="Antimaláricos">Antimaláricos</option>
                <option value="Anti-inflamatórios">Anti-inflamatórios</option>
                <option value="Antialérgicos">Antialérgicos</option>
                <option value="Cardiovasculares">Cardiovasculares</option>
              </select>
            </div>
          </div>

          {/* Medicines Table */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3">Medicamento Comercial</th>
                  <th className="pb-3">Princípio Ativo (DCI)</th>
                  <th className="pb-3">Dosagem</th>
                  <th className="pb-3">Forma & Apresentação</th>
                  <th className="pb-3">Receita Obrigatória</th>
                  <th className="pb-3">Categoria</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines
                  .filter((med) => {
                    const matchSearch =
                      med.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      med.principio_ativo.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchCat = categoryFilter === 'all' || med.categoria === categoryFilter;
                    return matchSearch && matchCat;
                  })
                  .map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-slate-900">{med.nome}</td>
                      <td className="py-3 text-slate-600">{med.principio_ativo}</td>
                      <td className="py-3 text-emerald-800 font-bold">{med.concentracao}</td>
                      <td className="py-3 text-slate-600">
                        {med.forma_farmaceutica}
                        <span className="block text-[10px] text-slate-400">{med.apresentacao}</span>
                      </td>
                      <td className="py-3">
                        {med.precisa_receita ? (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                            Sim (Receita)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Venda Livre
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500">{med.categoria || 'Geral'}</td>
                      <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          id={`admin-edit-med-${med.id}`}
                          onClick={() => handleOpenEditMedicine(med)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1"
                          title="Editar dados deste medicamento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          id={`admin-delete-med-${med.id}`}
                          onClick={() => handleDeleteMedicine(med)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1"
                          title="Excluir medicamento do catálogo geral"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: USERS & DIRECTORS DIRECTORY                                        */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Directório de Utilizadores & Directores Técnicos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestão de acessos, papéis (RBAC) e status de contas registadas na província de Tete.
                </p>
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filtrar por papel do utilizador"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-semibold self-start sm:self-auto"
              >
                <option value="all">Todos os Papéis</option>
                <option value="admin">Administradores</option>
                <option value="director">Directores Técnicos</option>
                <option value="user">Utentes / Cidadãos</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3">Nome do Utilizador</th>
                  <th className="pb-3">Contactos</th>
                  <th className="pb-3">Papel Atual</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Registo</th>
                  <th className="pb-3 text-right">Ações de Permissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users
                  .filter((u) => roleFilter === 'all' || u.role === roleFilter)
                  .map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.nome.charAt(0)}
                          </div>
                          <span>{u.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600">
                        <span>{u.telefone}</span>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'admin' || u.role === 'superadmin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'director'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status === 'active' ? 'Ativo' : 'Suspenso'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 text-[10px]">
                        {new Date(u.created_at).toLocaleDateString('pt-MZ')}
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u, e.target.value as UserRole)}
                          className="px-2 py-1 text-[11px] border border-slate-300 rounded-lg bg-white font-semibold"
                        >
                          <option value="user">Mudar para Utente</option>
                          <option value="director">Mudar para Director</option>
                          <option value="admin">Mudar para Admin</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-lg ${
                            u.status === 'active'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspender' : 'Reativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4 & 5: LIVE UPDATES MONITOR & AUDIT TRAIL                             */}
      {/* ========================================================================= */}
      {(activeTab === 'updates' || activeTab === 'logs') && (
        <AdminLiveUpdatesMonitor
          logs={logs}
          orders={orders}
          pharmacies={pharmacies}
          inventory={inventory}
          currentUser={currentUser}
          onRefresh={triggerRefresh}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CSV REPORTS (Requirement #30)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Exportação Oficial de Dados em CSV
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gere relatórios completos para auditoria, arquivos do Ministério da Saúde e relatórios estatísticos da Província de Tete.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <Store className="w-8 h-8 text-emerald-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Relatório de Farmácias</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Lista com NUIT, alvarás sanitários, directores técnicos e coordenadas de {pharmacies.length} farmácias.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportToCsv('farmacias_tete', pharmacies)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar CSV</span>
              </button>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <Pill className="w-8 h-8 text-emerald-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Catálogo de Medicamentos</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Catálogo geral de {medicines.length} medicamentos com princípios ativos e apresentações.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportToCsv('medicamentos_catalogo_tete', medicines)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar CSV</span>
              </button>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <FileText className="w-8 h-8 text-emerald-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Relatório de Pedidos</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Histórico de {orders.length} reservas e pedidos de medicamentos submetidos por utentes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportToCsv('pedidos_utentes_tete', orders)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar CSV</span>
              </button>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <Users className="w-8 h-8 text-emerald-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Directório de Contas</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Lista de {users.length} utilizadores registados, directores técnicos e permissões atribuídas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportToCsv('utilizadores_tete', users)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: ADMIN PROFILE & PHOTO SETTINGS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-700">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Perfil e Foto Oficial do Administrador Geral
                </h2>
                <p className="text-xs text-slate-500">
                  Personalize a sua foto institucional e credenciais profissionais exibidas no sistema FarmaLink Tete.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAdminProfile} className="mt-6 space-y-6">
              {/* Secção da Foto de Perfil */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Visualizador da Foto com Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-950 border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-3xl ring-4 ring-emerald-500/20">
                      {adminAvatarUrl ? (
                        <img
                          src={adminAvatarUrl}
                          alt="Foto do Administrador"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{adminNome.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <label
                      htmlFor="admin-photo-input-tab"
                      className="absolute -bottom-2 -right-2 p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 border-2 border-white"
                      title="Carregar nova foto"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        id="admin-photo-input-tab"
                        type="file"
                        accept="image/*"
                        onChange={handleAdminPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Instruções e Opções da Foto */}
                  <div className="space-y-3 text-center sm:text-left flex-1">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Fotografia de Identificação do Administrador
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Carregue uma fotografia nítida (JPG, PNG ou WebP até 5MB). Esta foto será exibida no cabeçalho do portal, relatórios de auditoria e credenciais oficiais emitidas na Província de Tete.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                      <label
                        htmlFor="admin-photo-input-tab-btn"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Carregar do Dispositivo</span>
                        <input
                          id="admin-photo-input-tab-btn"
                          type="file"
                          accept="image/*"
                          onChange={handleAdminPhotoUpload}
                          className="hidden"
                        />
                      </label>

                      {adminAvatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAdminPhoto}
                          className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover Foto</span>
                        </button>
                      )}
                    </div>

                    {/* Avatares Rápidos Predefinidos */}
                    <div className="pt-3 border-t border-slate-200/60">
                      <span className="text-[11px] font-bold text-slate-500 block mb-2">
                        Ou escolha um avatar executivo oficial de saúde:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        {[
                          {
                            url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=250&auto=format&fit=crop&q=80',
                            label: 'Dr. Executivo',
                          },
                          {
                            url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=250&auto=format&fit=crop&q=80',
                            label: 'Especialista',
                          },
                          {
                            url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=250&auto=format&fit=crop&q=80',
                            label: 'Dra. Gestora',
                          },
                          {
                            url: 'https://images.unsplash.com/photo-1594824813688-662df943d0e3?w=250&auto=format&fit=crop&q=80',
                            label: 'Consultor',
                          },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAdminAvatarUrl(preset.url);
                              showToast(`Avatar "${preset.label}" seleccionado! Clique em Salvar.`);
                            }}
                            className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${
                              adminAvatarUrl === preset.url
                                ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105'
                                : 'border-slate-200 hover:border-emerald-400'
                            }`}
                            title={preset.label}
                          >
                            <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Cadastrais e Credenciais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome Completo do Administrador:</label>
                  <input
                    type="text"
                    required
                    value={adminNome}
                    onChange={(e) => setAdminNome(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Ex: Dr. Grácio Hortêncio César"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail Institucional:</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full p-3 border border-slate-200 bg-slate-100 rounded-xl text-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contacto Telefónico / WhatsApp:</label>
                  <input
                    type="text"
                    required
                    value={adminTelefone}
                    onChange={(e) => setAdminTelefone(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="+258 84 123 4567"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Título Profissional / Cédula:</label>
                  <input
                    type="text"
                    required
                    value={adminNumeroProfissional}
                    onChange={(e) => setAdminNumeroProfissional(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="OFM-MZ/2019-540 (Licenciado em Farmácia)"
                  />
                </div>
              </div>

              {/* Botão de Gravação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  id="btn-save-admin-profile"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingProfile ? 'A gravar perfil...' : 'Salvar Alterações do Perfil'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW PHARMACY DETAILS & APPROVAL                                   */}
      {/* ========================================================================= */}
      {viewDetailPharmacy && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={viewDetailPharmacy.logo_url}
                  alt={viewDetailPharmacy.nome}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{viewDetailPharmacy.nome}</h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      viewDetailPharmacy.status === 'Aprovada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : viewDetailPharmacy.status === 'Pendente'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Estado: {viewDetailPharmacy.status}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewDetailPharmacy(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block font-bold mb-1">Responsabilidade Técnica:</span>
                <p className="font-bold text-slate-800">{viewDetailPharmacy.director_name}</p>
                <span className="text-slate-500">{viewDetailPharmacy.email}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block font-bold mb-1">Alvará & NUIT:</span>
                <p className="font-bold text-emerald-800">{viewDetailPharmacy.license_number}</p>
                <span className="font-mono text-slate-600">NUIT: {viewDetailPharmacy.nuit}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block font-bold mb-1">Localização:</span>
                <p className="text-slate-800 font-semibold">{viewDetailPharmacy.endereco}</p>
                <span className="text-slate-500">
                  {viewDetailPharmacy.bairro}, {viewDetailPharmacy.cidade}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  GPS: {viewDetailPharmacy.latitude.toFixed(4)}, {viewDetailPharmacy.longitude.toFixed(4)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block font-bold mb-1">Horário & Contacto:</span>
                <p className="text-slate-800 font-semibold">{viewDetailPharmacy.horario}</p>
                <span className="text-slate-500">{viewDetailPharmacy.dias_funcionamento || 'Segunda a Domingo'}</span>
                <p className="text-emerald-800 font-bold mt-1">{viewDetailPharmacy.telefone}</p>
              </div>
            </div>

            {/* Motivação do Director Técnico */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Motivação do Director Técnico ({viewDetailPharmacy.director_name}):</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Ficha Oficial
                </span>
              </div>
              <p className="text-slate-700 italic font-medium">
                "{viewDetailPharmacy.motivacao_cadastro || 'O Director Técnico submeteu o pedido para homologação oficial da farmácia no FarmaLink Tete.'}"
              </p>
            </div>

            {/* Description */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block mb-1">Descrição e Serviços:</span>
              <p className="text-slate-600">{viewDetailPharmacy.descricao || 'Sem descrição cadastrada.'}</p>
            </div>

            {/* Photos */}
            <div>
              <span className="font-bold text-slate-800 text-xs block mb-2">Fotos das Instalações:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FarmaLinkDB.getPhotos(viewDetailPharmacy.id).map((photo) => (
                  <div key={photo.id} className="relative rounded-2xl overflow-hidden border border-slate-200 h-28">
                    <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                    {photo.caption && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] p-1 truncate text-center">
                        {photo.caption}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const p = viewDetailPharmacy;
                  handleDeletePharmacy(p);
                }}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Eliminar Farmácia</span>
              </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const pid = viewDetailPharmacy.id;
                      setViewDetailPharmacy(null);
                      onNavigate('director-portal', { pharmacyId: pid, tab: 'medicines' });
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Pill className="w-4 h-4" />
                    <span>Gerir Medicamentos & Estoque</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewDetailPharmacy(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors"
                  >
                    Fechar
                  </button>

                {viewDetailPharmacy.status !== 'Aprovada' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const p = viewDetailPharmacy;
                        setViewDetailPharmacy(null);
                        handleOpenRejectModal(p);
                      }}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors"
                    >
                      Rejeitar / Correção
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprovePharmacy(viewDetailPharmacy.id)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Aprovar Farmácia
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPROVED PHARMACY SUCCESS & IMMEDIATE ACTION                       */}
      {/* ========================================================================= */}
      {approvedSuccessPharmacy && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-200">
                Homologação Concluída com Sucesso
              </span>
              <h3 className="text-xl font-black text-slate-900 pt-1">
                {approvedSuccessPharmacy.nome}
              </h3>
              <p className="text-xs text-slate-600">
                A farmácia localizada no bairro <strong>{approvedSuccessPharmacy.bairro}</strong> (Alvará: <strong>{approvedSuccessPharmacy.license_number}</strong>) foi homologada e está oficialmente certificada no FarmaLink Tete.
              </p>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Próximo Passo Recomendado:</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Para que os cidadãos e pacientes de Tete encontrem remédios nesta farmácia, inicie agora mesmo o <strong>cadastro de medicamentos e preços</strong> no estoque.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const pid = approvedSuccessPharmacy.id;
                  setApprovedSuccessPharmacy(null);
                  onNavigate('director-portal', { pharmacyId: pid, tab: 'medicines' });
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Pill className="w-4 h-4" />
                <span>Começar a Cadastrar Medicamentos Desta Farmácia</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setApprovedSuccessPharmacy(null);
                    setActiveTab('pharmacies');
                  }}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                >
                  Ver no Directório de Farmácias
                </button>

                <button
                  type="button"
                  onClick={() => setApprovedSuccessPharmacy(null)}
                  className="py-2.5 px-4 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT / REQUEST CORRECTION FORM                                   */}
      {/* ========================================================================= */}
      {rejectionModalPharmacy && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRejectPharmacySubmit}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Parecer Sanitário: {rejectionModalPharmacy.nome}
              </h3>
              <p className="text-xs text-slate-500">
                Especifique os motivos técnicos para correção ou recusa da homologação. O director técnico será notificado.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Tipo de Decisão:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRejectionType('Necessita correção')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-colors ${
                    rejectionType === 'Necessita correção'
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Necessita Correção
                </button>
                <button
                  type="button"
                  onClick={() => setRejectionType('Rejeitada')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-colors ${
                    rejectionType === 'Rejeitada'
                      ? 'bg-red-100 border-red-400 text-red-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Rejeitada
                </button>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">
                Motivo / Requisitos Pendentes:
              </label>
              <textarea
                required
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: O alvará sanitário apresentado está fora do prazo de validade. É necessário anexar a credencial atualizada emitida pela Direcção Provincial de Saúde de Tete..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalPharmacy(null)}
                className="px-4 py-2 text-slate-600 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Confirmar Decisão
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PHARMACY DETAILS                                              */}
      {/* ========================================================================= */}
      {editingPharmacy && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePharmacyEdit}
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Editar Farmácia: {editingPharmacy.nome}</h3>
              <p className="text-xs text-slate-500">Atualização de dados cadastrais e sanitários oficiais.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Comercial:</label>
                <input
                  type="text"
                  required
                  value={editingPharmacy.nome}
                  onChange={(e) => setEditingPharmacy({ ...editingPharmacy, nome: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NUIT Fiscal:</label>
                  <input
                    type="text"
                    required
                    value={editingPharmacy.nuit}
                    onChange={(e) => setEditingPharmacy({ ...editingPharmacy, nuit: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alvará Sanitário:</label>
                  <input
                    type="text"
                    required
                    value={editingPharmacy.license_number}
                    onChange={(e) => setEditingPharmacy({ ...editingPharmacy, license_number: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bairro:</label>
                  <input
                    type="text"
                    required
                    value={editingPharmacy.bairro}
                    onChange={(e) => setEditingPharmacy({ ...editingPharmacy, bairro: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Director Técnico:</label>
                  <input
                    type="text"
                    required
                    value={editingPharmacy.director_name}
                    onChange={(e) => setEditingPharmacy({ ...editingPharmacy, director_name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefone:</label>
                  <input
                    type="text"
                    required
                    value={editingPharmacy.telefone}
                    onChange={(e) => setEditingPharmacy({ ...editingPharmacy, telefone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horário:</label>
                  <input
                    type="text"
                    required
                    value={editingPharmacy.horario}
                    onChange={(e) => setEditingPharmacy({ ...editingPharmacy, horario: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motivação do Director Técnico:</label>
                <textarea
                  rows={2}
                  value={editingPharmacy.motivacao_cadastro || ''}
                  onChange={(e) => setEditingPharmacy({ ...editingPharmacy, motivacao_cadastro: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estado de Homologação:</label>
                <select
                  value={editingPharmacy.status}
                  onChange={(e) => setEditingPharmacy({ ...editingPharmacy, status: e.target.value as PharmacyStatus })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                >
                  <option value="Aprovada">Aprovada / Ativa</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em análise">Em análise</option>
                  <option value="Necessita correção">Necessita correção</option>
                  <option value="Suspensa">Suspensa</option>
                  <option value="Rejeitada">Rejeitada</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPharmacy(null)}
                className="px-4 py-2 text-slate-600 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MEDICINE (Requirement #27)                              */}
      {/* ========================================================================= */}
      {showMedicineModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMedicineSubmit}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {editingMedicine ? 'Editar Medicamento no Catálogo' : 'Cadastrar Medicamento • Catálogo Provincial'}
              </h3>
              <p className="text-xs text-slate-500">
                Dados oficiais para prescrição e vinculação de estoque nas farmácias de Tete.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Comercial do Medicamento:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paracetamol FarmaTete, Coartem, Amoxicilina..."
                  value={medFormData.nome || ''}
                  onChange={(e) => setMedFormData({ ...medFormData, nome: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Princípio Ativo (DCI):</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paracetamol, Arteméter + Lumefantrina, Ibuprofeno..."
                  value={medFormData.principio_ativo || ''}
                  onChange={(e) => setMedFormData({ ...medFormData, principio_ativo: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dosagem / Concentração:</label>
                  <input
                    type="text"
                    placeholder="Ex: 500 mg, 20/120 mg, 250 mg/5ml"
                    value={medFormData.concentracao || ''}
                    onChange={(e) => setMedFormData({ ...medFormData, concentracao: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Forma Farmacêutica:</label>
                  <select
                    value={medFormData.forma_farmaceutica || 'Comprimidos'}
                    onChange={(e) => setMedFormData({ ...medFormData, forma_farmaceutica: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                  >
                    <option value="Comprimidos">Comprimidos</option>
                    <option value="Cápsulas">Cápsulas</option>
                    <option value="Xarope">Xarope</option>
                    <option value="Suspensão">Suspensão</option>
                    <option value="Pomada / Creme">Pomada / Creme</option>
                    <option value="Injetável">Injetável</option>
                    <option value="Gotas">Gotas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Apresentação:</label>
                  <input
                    type="text"
                    placeholder="Ex: Caixa com 20 comprimidos, Frasco de 100ml"
                    value={medFormData.apresentacao || ''}
                    onChange={(e) => setMedFormData({ ...medFormData, apresentacao: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria:</label>
                  <select
                    value={medFormData.categoria || 'Analgésicos e Antipiréticos'}
                    onChange={(e) => setMedFormData({ ...medFormData, categoria: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                  >
                    <option value="Analgésicos e Antipiréticos">Analgésicos e Antipiréticos</option>
                    <option value="Antibióticos">Antibióticos</option>
                    <option value="Antimaláricos">Antimaláricos</option>
                    <option value="Anti-inflamatórios">Anti-inflamatórios</option>
                    <option value="Antialérgicos">Antialérgicos</option>
                    <option value="Cardiovasculares">Cardiovasculares</option>
                    <option value="Gastrointestinais">Gastrointestinais</option>
                    <option value="Vitaminas e Suplementos">Vitaminas e Suplementos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-precisa-receita"
                  checked={!!medFormData.precisa_receita}
                  onChange={(e) => setMedFormData({ ...medFormData, precisa_receita: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="modal-precisa-receita" className="font-bold text-slate-700 cursor-pointer">
                  Exige Receita Médica Obrigatória para Dispensa
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMedicineModal(false)}
                className="px-4 py-2 text-slate-600 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {editingMedicine ? 'Atualizar Medicamento' : 'Salvar no Catálogo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM PHARMACY DELETION (Requirement: Deletar Farmácias Uma Por Uma) */}
      {/* ========================================================================= */}
      {deleteModalPharmacy && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-red-100">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Eliminar Registo de Farmácia?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação é irreversível e excluirá permanentemente o registo da base de dados oficial de Tete.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src={deleteModalPharmacy.logo_url}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{deleteModalPharmacy.nome}</h4>
                  <span className="text-[11px] text-slate-500">{deleteModalPharmacy.bairro}, {deleteModalPharmacy.cidade}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-200/70 text-[11px]">
                <div><strong className="text-slate-700">Estado:</strong> {deleteModalPharmacy.status}</div>
                <div><strong className="text-slate-700">Alvará:</strong> {deleteModalPharmacy.license_number}</div>
                <div><strong className="text-slate-700">NUIT:</strong> {deleteModalPharmacy.nuit}</div>
                <div><strong className="text-slate-700">Director:</strong> {deleteModalPharmacy.director_name}</div>
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Ao confirmar, todos os estoques, medicamentos associados e acessos da farmácia <strong>{deleteModalPharmacy.nome}</strong> serão removidos permanentemente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalPharmacy(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-delete-pharmacy-btn"
                onClick={handleConfirmDeletePharmacy}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar Farmácia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM SUSPEND PHARMACY                                           */}
      {/* ========================================================================= */}
      {suspendModalPharmacy && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-amber-100">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Suspender Operações da Farmácia?
                </h3>
                <p className="text-xs text-slate-500">
                  A farmácia deixará de aparecer com produtos ativos para os utentes até nova deliberação.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-900 text-sm block">{suspendModalPharmacy.nome}</span>
              <p className="text-[11px] text-slate-500">
                Director Responsável: {suspendModalPharmacy.director_name} ({suspendModalPharmacy.bairro})
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSuspendModalPharmacy(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspendPharmacy}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                <span>Suspender Farmácia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLEAR ALL PHARMACIES CONFIRMATION                                  */}
      {/* ========================================================================= */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-red-100">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Limpar Todas as Farmácias de Exemplo?
                </h3>
                <p className="text-xs text-slate-500">
                  Deseja esvaziar a base de dados de demonstração para cadastrar farmácias reais de Tete?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Esta ação removerá todas as <strong>{pharmacies.length} farmácias</strong> registadas e seus respectivos estoques.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-clear-all-pharmacies-btn"
                onClick={handleConfirmClearAllPharmacies}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Limpeza Total</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM MEDICINE DELETION (Requirement: Eliminar Medicamento)       */}
      {/* ========================================================================= */}
      {deleteModalMedicine && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-red-100">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Remover Medicamento do Catálogo?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação excluirá o medicamento do catálogo oficial de saúde e de todos os estoques vinculados.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">{deleteModalMedicine.nome}</h4>
                <span className="text-[11px] text-slate-500 font-medium">Princípio Ativo (DCI): {deleteModalMedicine.principio_ativo}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-200/70 text-[11px]">
                <div><strong className="text-slate-700">Dosagem:</strong> {deleteModalMedicine.concentracao}</div>
                <div><strong className="text-slate-700">Forma:</strong> {deleteModalMedicine.forma_farmaceutica}</div>
                <div><strong className="text-slate-700">Categoria:</strong> {deleteModalMedicine.categoria}</div>
                <div>
                  <strong className="text-slate-700">Receita:</strong> {deleteModalMedicine.precisa_receita ? 'Obrigatória' : 'Venda Livre'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Tem certeza que deseja remover <strong>{deleteModalMedicine.nome}</strong>? Farmácias não poderão mais vender ou listar este item no estoque.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalMedicine(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-delete-medicine-btn"
                onClick={handleConfirmDeleteMedicine}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar Medicamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLEAR ALL MEDICINES (Limpeza Total do Catálogo)                    */}
      {/* ========================================================================= */}
      {showClearAllMedicinesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-red-100">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Limpar Todo o Catálogo de Medicamentos?
                </h3>
                <p className="text-xs text-slate-500">
                  Deseja remover todos os {medicines.length} medicamentos de exemplo para cadastrar o catálogo real de Tete?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Esta ação removerá todos os <strong>{medicines.length} medicamentos</strong> do catálogo geral e todos os registros de estoque associados nas farmácias.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearAllMedicinesModal(false)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-clear-all-medicines-btn"
                onClick={handleConfirmClearAllMedicines}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Limpeza do Catálogo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
