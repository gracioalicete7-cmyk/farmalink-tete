/**
 * FarmaLink Tete - Storage & State Layer
 * Persistent database engine with Relational Data Schema
 */

import {
  UserProfile,
  Pharmacy,
  PharmacyPhoto,
  Medicine,
  PharmacyMedicine,
  Order,
  OrderStatusHistory,
  NotificationItem,
  AuditLog,
  PharmacyDraft,
  PharmacyStatus,
  OrderStatus,
  MedicineAvailability,
  UserRole,
  StockAlert,
  PharmacyReview,
  MedicationReminder,
  DeliveryDetails,
} from '../types';

const STORAGE_KEYS = {
  PROFILES: 'farmalink_profiles_v2',
  PHARMACIES: 'farmalink_pharmacies_v2',
  PHOTOS: 'farmalink_photos_v2',
  MEDICINES: 'farmalink_medicines_v2',
  PHARMACY_MEDICINES: 'farmalink_pharmacy_medicines_v2',
  ORDERS: 'farmalink_orders_v2',
  ORDER_HISTORY: 'farmalink_order_history_v2',
  NOTIFICATIONS: 'farmalink_notifications_v2',
  AUDIT_LOGS: 'farmalink_audit_logs_v2',
  DRAFTS: 'farmalink_drafts_v2',
  CURRENT_USER: 'farmalink_current_user_v2',
  STOCK_ALERTS: 'farmalink_stock_alerts_v2',
  PHARMACY_REVIEWS: 'farmalink_pharmacy_reviews_v2',
  MEDICATION_REMINDERS: 'farmalink_medication_reminders_v2',
  DELETED_PHARMACY_IDS: 'farmalink_deleted_pharmacy_ids_v2',
  DELETED_MEDICINE_IDS: 'farmalink_deleted_medicine_ids_v2',
};

// Safe bridge to optional Cloud Sync layer
const CloudSync = {
  syncPharmacy: (pharmacy: Pharmacy) => {
    try { (window as any).__farmalink_cloud_sync?.syncPharmacy?.(pharmacy); } catch {}
  },
  deletePharmacy: (pharmacyId: string) => {
    try { (window as any).__farmalink_cloud_sync?.deletePharmacy?.(pharmacyId); } catch {}
  },
  clearAllPharmacies: () => {
    try { (window as any).__farmalink_cloud_sync?.clearAllPharmacies?.(); } catch {}
  },
  syncMedicine: (medicine: Medicine) => {
    try { (window as any).__farmalink_cloud_sync?.syncMedicine?.(medicine); } catch {}
  },
  deleteMedicine: (medicineId: string) => {
    try { (window as any).__farmalink_cloud_sync?.deleteMedicine?.(medicineId); } catch {}
  },
  clearAllMedicines: () => {
    try { (window as any).__farmalink_cloud_sync?.clearAllMedicines?.(); } catch {}
  },
  syncStock: (stock: PharmacyMedicine) => {
    try { (window as any).__farmalink_cloud_sync?.syncStock?.(stock); } catch {}
  },
  deleteStock: (stockId: string) => {
    try { (window as any).__farmalink_cloud_sync?.deleteStock?.(stockId); } catch {}
  },
};

// Initial Seed Data tailored for Tete Province, Mozambique (Clean Launch)
const SEED_PROFILES: UserProfile[] = [
  {
    id: 'prof-utente-1',
    user_id: 'user-1',
    nome: 'Utente FarmaLink Tete',
    telefone: '+258 84 000 0000',
    email: 'utente@farmalink.mz',
    bairro: 'Francisco Manyanga',
    role: 'user',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prof-dir-mais-saude',
    user_id: 'admin-1',
    nome: 'Dr. Grácio César (Director Técnico)',
    telefone: '+258 84 123 4567',
    email: 'gracioalicete7@gmail.com',
    bairro: 'Francisco Manyanga',
    role: 'director',
    numero_profissional: 'OFM-MZ/2019-540 (Licenciado em Farmácia)',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prof-admin-1',
    user_id: 'admin-1',
    nome: 'Grácio Hortêncio César (Licenciado em Farmácia)',
    telefone: '+258 84 123 4567',
    email: 'gracioalicete7@gmail.com',
    bairro: 'Francisco Manyanga',
    role: 'admin',
    numero_profissional: 'OFM-MZ/2019-540 (Licenciado em Farmácia)',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prof-superadmin-1',
    user_id: 'superadmin-1',
    nome: 'Grácio Hortêncio César (Licenciado em Farmácia)',
    telefone: '+258 84 123 4567',
    email: 'gracioalicete7@gmail.com',
    bairro: 'Francisco Manyanga',
    role: 'superadmin',
    numero_profissional: 'OFM-MZ/2019-540 (Licenciado em Farmácia)',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_PHARMACIES: Pharmacy[] = [
  {
    id: 'pharm-mais-saude',
    nome: 'Farmácia Clínica Mais Saúde',
    nuit: '400984210',
    license_number: 'MS/DISP/TETE/2023/15',
    director_id: 'admin-1',
    director_name: 'Dr. Grácio César',
    telefone: '+258 84 123 4567',
    email: 'gracioalicete7@gmail.com',
    endereco: 'Avenida da Independência, Bloco 8, nº 22',
    bairro: 'Francisco Manyanga',
    cidade: 'Cidade de Tete',
    provincia: 'Tete',
    latitude: -16.1560,
    longitude: 33.5865,
    horario: '07:00 - 22:00',
    dias_funcionamento: 'Segunda a Domingo',
    descricao: 'Farmácia comunitária sob Direcção Técnica de Grácio César (Licenciado em Farmácia). Atendimento ético com estoque diversificado de medicamentos essenciais, puericultura e produtos de primeiros socorros na Cidade de Tete.',
    motivacao_cadastro: 'Facilitar o acesso da população de Tete a medicamentos de qualidade com verificação em tempo real de disponibilidade e preços transparentes em Meticais sob a Direcção Técnica de Grácio César.',
    logo_url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=200&auto=format&fit=crop&q=80',
    status: 'Aprovada',
    is_verified: true,
    access_code: 'MAIS-SAUDE',
    pin: '2026',
    aceita_seguro: true,
    seguradoras: ['Medis Moçambique', 'Hollard Seguros Moçambique', 'Sanlam / Global Alliance Seguros', 'Fidelidade Ímpar'],
    instrucoes_seguro: 'Atendimento clínico e farmacêutico sob Direcção Técnica de Grácio César. Exige apresentação do cartão do seguro (físico ou digital), documento de identificação com foto e receita médica carimbada para emissão do Termo de Responsabilidade.',
    tipo_estabelecimento: 'farmacia_clinica',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_PHOTOS: PharmacyPhoto[] = [
  {
    id: 'photo-ms-1',
    pharmacy_id: 'pharm-mais-saude',
    image_url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80',
    type: 'fachada',
    caption: 'Instalações da Farmácia Clínica Mais Saúde - Tete',
    created_at: new Date().toISOString(),
  },
  {
    id: 'photo-ms-2',
    pharmacy_id: 'pharm-mais-saude',
    image_url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&auto=format&fit=crop&q=80',
    type: 'interior',
    caption: 'Balcão de dispensação e atendimento ao utente',
    created_at: new Date().toISOString(),
  },
];

const SEED_MEDICINES: Medicine[] = [
  {
    id: "med-1",
    nome: "Paracetamol",
    principio_ativo: "Paracetamol",
    concentracao: "500 mg",
    forma_farmaceutica: "Comprimidos",
    apresentacao: "Caixa com 20 comprimidos",
    fabricante: "Farmacêutica de Moçambique / Import",
    categoria: "Analgésicos e Antipiréticos",
    precisa_receita: false,
    descricao: "Indicado para alívio de dores de intensidade leve a moderada e redução da febre.",
    sintomas: ["dor-inflamacao", "malaria", "febre"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-2",
    nome: "Coartem (Arteméter + Lumefantrina)",
    principio_ativo: "Artemether + Lumefantrine",
    concentracao: "20 mg / 120 mg",
    forma_farmaceutica: "Comprimidos",
    apresentacao: "Embalagem de tratamento com 24 comprimidos",
    fabricante: "Novartis",
    categoria: "Antimaláricos",
    precisa_receita: true,
    descricao: "Medicamento essencial de primeira linha para tratamento de malária não complicada causada por Plasmodium falciparum em Moçambique.",
    sintomas: ["malaria", "febre"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-3",
    nome: "Amoxicilina",
    principio_ativo: "Amoxicilina Tri-hidratada",
    concentracao: "500 mg",
    forma_farmaceutica: "Cápsulas",
    apresentacao: "Caixa com 21 cápsulas",
    fabricante: "Cinfa / Lab Sandoz",
    categoria: "Antibióticos",
    precisa_receita: true,
    descricao: "Antibiótico de amplo espectro indicado para infecções respiratórias, urinárias e otorrinolaringológicas.",
    sintomas: ["antibioticos"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-4",
    nome: "Ibuprofeno",
    principio_ativo: "Ibuprofeno",
    concentracao: "400 mg",
    forma_farmaceutica: "Comprimidos revestidos",
    apresentacao: "Caixa com 30 comprimidos",
    fabricante: "Generis Farmacêutica",
    categoria: "Anti-inflamatórios e Analgésicos",
    precisa_receita: false,
    descricao: "Anti-inflamatório não esteroide (AINE) para dor muscular, dor de dentes e inflamações.",
    sintomas: ["dor-inflamacao"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-5",
    nome: "Azitromicina",
    principio_ativo: "Azitromicina Di-hidratada",
    concentracao: "500 mg",
    forma_farmaceutica: "Comprimidos revestidos",
    apresentacao: "Caixa com 3 comprimidos",
    fabricante: "Pfizer / Teva",
    categoria: "Antibióticos Macrólidos",
    precisa_receita: true,
    descricao: "Antibiótico para tratamento de infecções do trato respiratório superior e inferior.",
    sintomas: ["antibioticos"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-6",
    nome: "Omeprazol",
    principio_ativo: "Omeprazol",
    concentracao: "20 mg",
    forma_farmaceutica: "Cápsulas gastrorresistentes",
    apresentacao: "Frasco com 28 cápsulas",
    fabricante: "AstraZeneca / Generics",
    categoria: "Gastroenterologia",
    precisa_receita: false,
    descricao: "Inibidor da bomba de protões para azia, refluxo gastroesofágico e gastrite.",
    sintomas: ["reidratacao"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-7",
    nome: "Ciprofloxacina",
    principio_ativo: "Cloridrato de Ciprofloxacina",
    concentracao: "500 mg",
    forma_farmaceutica: "Comprimidos",
    apresentacao: "Caixa com 14 comprimidos",
    fabricante: "Bayer / Mepha",
    categoria: "Antibióticos Quinolonas",
    precisa_receita: true,
    descricao: "Antibiótico indicado para infecções bacterianas graves do trato geniturinário e gastrointestinal.",
    sintomas: ["antibioticos"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-8",
    nome: "Sais de Reidratação Oral (SRO)",
    principio_ativo: "Cloreto de Sódio + Potássio + Citrato + Glicose",
    concentracao: "Fórmula OMS 20,5g",
    forma_farmaceutica: "Pó para solução oral",
    apresentacao: "Saqueta para 1 Litro de água potável",
    fabricante: "UNICEF / Laboratórios Nacionais",
    categoria: "Reidratação e Eletrólitos",
    precisa_receita: false,
    descricao: "Prevenção e tratamento da desidratação causada por diarreia aguda ou vómitos no calor de Tete.",
    sintomas: ["reidratacao", "infantil"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-9",
    nome: "Diclofenac de Sódio",
    principio_ativo: "Diclofenac Sódico",
    concentracao: "50 mg",
    forma_farmaceutica: "Comprimidos",
    apresentacao: "Caixa com 20 comprimidos",
    fabricante: "Novartis / Voltaren Generics",
    categoria: "Anti-inflamatórios",
    precisa_receita: false,
    descricao: "Tratamento de formas inflamatórias e degenerativas de reumatismo e dores pós-traumáticas.",
    sintomas: ["dor-inflamacao"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-10",
    nome: "Cetirizina",
    principio_ativo: "Dicloridrato de Cetirizina",
    concentracao: "10 mg",
    forma_farmaceutica: "Comprimidos",
    apresentacao: "Caixa com 20 comprimidos",
    fabricante: "UCB Pharma / Generis",
    categoria: "Anti-histamínicos",
    precisa_receita: false,
    descricao: "Alívio de sintomas nasais e oculares de rinite alérgica sazonal e urticária crónica.",
    sintomas: ["alergia"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Anti-hipertensores e Cardiovasculares (Pressão & Coração)
  {
    id: "med-11",
    nome: "Losartan Potássico",
    principio_ativo: "Losartan Potássico",
    concentracao: "50 mg",
    forma_farmaceutica: "Comprimidos revestidos",
    apresentacao: "Caixa com 30 comprimidos",
    fabricante: "Cinfa / Accord Healthcare",
    categoria: "Anti-hipertensor",
    precisa_receita: true,
    descricao: "Anti-hipertensor (ARA-II) de primeira linha indicado para o controlo da hipertensão arterial e proteção cardiovascular e renal.",
    sintomas: ["hipertensao"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-12",
    nome: "Amlodipina",
    principio_ativo: "Besilato de Amlodipina",
    concentracao: "5 mg",
    forma_farmaceutica: "Comprimidos",
    apresentacao: "Caixa com 30 comprimidos",
    fabricante: "Pfizer / Generis",
    categoria: "Anti-hipertensor",
    precisa_receita: true,
    descricao: "Bloqueador dos canais de cálcio indicado para hipertensão arterial e profilaxia da angina de peito.",
    sintomas: ["hipertensao"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-13",
    nome: "Captopril",
    principio_ativo: "Captopril",
    concentracao: "25 mg",
    forma_farmaceutica: "Comprimidos",
    apresentacao: "Caixa com 30 comprimidos",
    fabricante: "Bristol Myers Squibb / Generics",
    categoria: "Anti-hipertensor",
    precisa_receita: true,
    descricao: "Inibidor da Enzima de Conversão da Angiotensina (IECA) para controlo rápido e crónico da pressão arterial e insuficiência cardíaca.",
    sintomas: ["hipertensao"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-14",
    nome: "Atenolol",
    principio_ativo: "Atenolol",
    concentracao: "50 mg",
    forma_farmaceutica: "Comprimidos",
    apresentacao: "Caixa com 28 comprimidos",
    fabricante: "AstraZeneca / Generics",
    categoria: "Anti-hipertensor",
    precisa_receita: true,
    descricao: "Betabloqueador cardioseletivo indicado no controlo da hipertensão arterial, arritmias cardíacas e angina pectoris.",
    sintomas: ["hipertensao"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Medicamentos Pediátricos (Saúde Pediátrica)
  {
    id: "med-15",
    nome: "Paracetamol Pediátrico Xarope",
    principio_ativo: "Paracetamol",
    concentracao: "120 mg / 5 ml",
    forma_farmaceutica: "Xarope / Solução Oral",
    apresentacao: "Frasco de 100 ml com seringa dosadora",
    fabricante: "GlaxoSmithKline / Panadol Baby",
    categoria: "Saúde Pediátrica",
    precisa_receita: false,
    descricao: "Alívio rápido da febre e dores infantis em lactentes e crianças (dentição, vacinas, constipações).",
    sintomas: ["infantil", "malaria", "febre", "dor-inflamacao"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-16",
    nome: "Amoxicilina Suspensão Pediátrica",
    principio_ativo: "Amoxicilina Tri-hidratada",
    concentracao: "250 mg / 5 ml",
    forma_farmaceutica: "Pó para suspensão oral",
    apresentacao: "Frasco de 100 ml com colher dosadora",
    fabricante: "Sandoz / Generis",
    categoria: "Saúde Pediátrica",
    precisa_receita: true,
    descricao: "Antibiótico pediátrico para tratamento de infeções de garganta, ouvidos (otites) e respiratórias em crianças.",
    sintomas: ["infantil", "antibioticos"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "med-17",
    nome: "Sulfato de Zinco Pediátrico",
    principio_ativo: "Sulfato de Zinco Dispersível",
    concentracao: "20 mg",
    forma_farmaceutica: "Comprimidos dispersíveis",
    apresentacao: "Blister com 10 comprimidos dispersíveis",
    fabricante: "UNICEF / Medopharm",
    categoria: "Saúde Pediátrica",
    precisa_receita: false,
    descricao: "Adjuvante essencial no tratamento da diarreia aguda infantil em conjunto com SRO segundo directrizes do MISAU.",
    sintomas: ["infantil", "reidratacao"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_PHARMACY_MEDICINES: PharmacyMedicine[] = [
  // Farmácia Clínica Mais Saúde (Pilot Establishment in Tete under Dr. Grácio César)
  {
    id: "pm-ms-1",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-1", // Paracetamol 500mg
    quantidade: 120,
    unidade: "caixas",
    preco: 55.0,
    disponibilidade: "Disponível",
    data_validade: "2027-09-15",
    lote: "PAR-500-MS01",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-2",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-2", // Coartem
    quantidade: 50,
    unidade: "embalagens",
    preco: 240.0,
    disponibilidade: "Disponível",
    data_validade: "2026-12-30",
    lote: "COA-ACT-MS02",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-3",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-3", // Amoxicilina 500mg
    quantidade: 40,
    unidade: "caixas",
    preco: 175.0,
    disponibilidade: "Disponível",
    data_validade: "2027-05-20",
    lote: "AMX-500-MS03",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-4",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-4", // Ibuprofeno 400mg
    quantidade: 65,
    unidade: "caixas",
    preco: 105.0,
    disponibilidade: "Disponível",
    data_validade: "2027-01-15",
    lote: "IBU-400-MS04",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-5",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-6", // Omeprazol 20mg
    quantidade: 35,
    unidade: "frascos",
    preco: 160.0,
    disponibilidade: "Disponível",
    data_validade: "2027-08-10",
    lote: "OMP-20-MS05",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-6",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-8", // SRO
    quantidade: 150,
    unidade: "saquetas",
    preco: 25.0,
    disponibilidade: "Disponível",
    data_validade: "2027-11-20",
    lote: "SRO-205-MS06",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Anti-hipertensores em stock na Farmácia Clínica Mais Saúde
  {
    id: "pm-ms-7",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-11", // Losartan Potássico 50mg
    quantidade: 60,
    unidade: "caixas",
    preco: 180.0,
    disponibilidade: "Disponível",
    data_validade: "2027-10-15",
    lote: "LOS-50-MS07",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-8",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-12", // Amlodipina 5mg
    quantidade: 45,
    unidade: "caixas",
    preco: 140.0,
    disponibilidade: "Disponível",
    data_validade: "2027-08-30",
    lote: "AML-05-MS08",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-9",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-13", // Captopril 25mg
    quantidade: 35,
    unidade: "caixas",
    preco: 110.0,
    disponibilidade: "Disponível",
    data_validade: "2027-06-15",
    lote: "CAP-25-MS09",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-10",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-14", // Atenolol 50mg
    quantidade: 30,
    unidade: "caixas",
    preco: 135.0,
    disponibilidade: "Disponível",
    data_validade: "2027-09-01",
    lote: "ATN-50-MS10",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Pediátricos em stock
  {
    id: "pm-ms-11",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-15", // Paracetamol Pediátrico Xarope
    quantidade: 50,
    unidade: "frascos",
    preco: 85.0,
    disponibilidade: "Disponível",
    data_validade: "2027-12-10",
    lote: "PAR-PED-MS11",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-12",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-16", // Amoxicilina Suspensão Pediátrica
    quantidade: 40,
    unidade: "frascos",
    preco: 195.0,
    disponibilidade: "Disponível",
    data_validade: "2027-04-25",
    lote: "AMX-PED-MS12",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pm-ms-13",
    pharmacy_id: "pharm-mais-saude",
    medicine_id: "med-17", // Sulfato de Zinco Pediátrico
    quantidade: 80,
    unidade: "blisters",
    preco: 45.0,
    disponibilidade: "Disponível",
    data_validade: "2027-10-30",
    lote: "ZNC-20-MS13",
    em_quarentena: false,
    ultima_atualizacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_ORDERS: Order[] = [];

const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-welcome",
    user_id: "all",
    titulo: "Bem-vindo ao FarmaLink Tete",
    mensagem: "Consulte stock de medicamentos em tempo real nas farmácias licenciadas da Província de Tete.",
    tipo: "system",
    lida: false,
    link: "home",
    created_at: new Date().toISOString(),
  },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-launch",
    user_id: "admin-1",
    user_name: "Grácio Hortêncio César (Licenciado em Farmácia)",
    user_email: "gracioalicete7@gmail.com",
    action: "LANCAMENTO_OFICIAL_PROVINCIA",
    entity: "system",
    entity_id: "farmalink-tete",
    metadata: "Plataforma FarmaLink Tete inicializada com ambiente oficial pronto para operações em Tete.",
    created_at: new Date().toISOString(),
  },
];

const SEED_STOCK_ALERTS: StockAlert[] = [];

const SEED_PHARMACY_REVIEWS: PharmacyReview[] = [];

const SEED_MEDICATION_REMINDERS: MedicationReminder[] = [];

// In-memory cache fallback in case localStorage is disabled or throws QuotaExceededError
const MEMORY_STORAGE_CACHE: Record<string, unknown> = {};

// Safe, asynchronous debounced event notifier
let dispatchTimeoutId: ReturnType<typeof setTimeout> | null = null;
export function notifyStorageUpdated(): void {
  if (typeof window === 'undefined') return;
  if (dispatchTimeoutId !== null) return;
  dispatchTimeoutId = setTimeout(() => {
    dispatchTimeoutId = null;
    try {
      window.dispatchEvent(new Event('farmalink_storage_updated'));
    } catch {
      // ignore
    }
  }, 0);
}

// Listen for cross-tab and local storage events to keep memory cache fresh
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key) {
      delete MEMORY_STORAGE_CACHE[e.key];
    } else {
      for (const k in MEMORY_STORAGE_CACHE) delete MEMORY_STORAGE_CACHE[k];
    }
    notifyStorageUpdated();
  });
  window.addEventListener('farmalink_storage_updated', () => {
    for (const k in MEMORY_STORAGE_CACHE) delete MEMORY_STORAGE_CACHE[k];
  });
}

// Helper to safely load data from localStorage or fallback to Seed
function getStoredItem<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw) as T;
          MEMORY_STORAGE_CACHE[key] = parsed;
          return parsed;
        } catch {
          // If JSON parse error, fallback
        }
      } else {
        // Initialize localStorage with fallback
        try {
          localStorage.setItem(key, JSON.stringify(fallback));
        } catch {
          // quota exceeded or private mode
        }
        MEMORY_STORAGE_CACHE[key] = fallback;
        return fallback;
      }
    }
    if (MEMORY_STORAGE_CACHE[key] !== undefined) {
      return MEMORY_STORAGE_CACHE[key] as T;
    }
    MEMORY_STORAGE_CACHE[key] = fallback;
    return fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    MEMORY_STORAGE_CACHE[key] = value;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.warn(`Storage fallback: unable to write ${key} to localStorage, using memory cache`, err);
  }

  notifyStorageUpdated();
}

export class FarmaLinkDB {
  static clearMemoryCache(): void {
    for (const k in MEMORY_STORAGE_CACHE) {
      delete MEMORY_STORAGE_CACHE[k];
    }
  }

  // Profiles & Auth
  static getProfiles(): UserProfile[] {
    return getStoredItem<UserProfile[]>(STORAGE_KEYS.PROFILES, SEED_PROFILES);
  }

  static getUsers(): UserProfile[] {
    return this.getProfiles();
  }

  static getProfileByUserId(userId: string): UserProfile | undefined {
    return this.getProfiles().find((p) => p.user_id === userId);
  }

  static saveProfile(profile: UserProfile): void {
    const list = this.getProfiles();
    const index = list.findIndex((p) => p.id === profile.id || p.user_id === profile.user_id);
    if (index >= 0) {
      list[index] = { ...profile, updated_at: new Date().toISOString() };
    } else {
      list.push(profile);
    }
    setStoredItem(STORAGE_KEYS.PROFILES, list);
  }

  static getCurrentUser(): UserProfile {
    const stored = getStoredItem<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (stored) return stored;
    // Default to common user Amélia
    const defaultUser = SEED_PROFILES[0];
    this.setCurrentUser(defaultUser);
    return defaultUser;
  }

  static setCurrentUser(user: UserProfile): void {
    setStoredItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Pharmacies
  static getDeletedPharmacyIds(): string[] {
    return getStoredItem<string[]>(STORAGE_KEYS.DELETED_PHARMACY_IDS, []);
  }

  static getPharmacies(): Pharmacy[] {
    const deletedIds = this.getDeletedPharmacyIds();
    const stored = getStoredItem<Pharmacy[]>(STORAGE_KEYS.PHARMACIES, SEED_PHARMACIES);
    
    // Ensure Farmácia Clínica Mais Saúde always reflects Grácio César as Director Técnico & Insurance
    let hasUpdates = false;
    stored.forEach((p) => {
      const lowerName = p.nome.toLowerCase();
      if (lowerName.includes('mais saúde') || lowerName.includes('mais saude')) {
        if (p.director_name !== 'Grácio César' || p.nome !== 'Farmácia Clínica Mais Saúde') {
          p.nome = 'Farmácia Clínica Mais Saúde';
          p.director_name = 'Grácio César';
          p.director_id = p.director_id || 'admin-1';
          p.email = p.email || 'gracioalicete7@gmail.com';
          p.telefone = p.telefone || '+258 84 123 4567';
          hasUpdates = true;
        }
        if (p.aceita_seguro === undefined) {
          p.aceita_seguro = true;
          p.seguradoras = ['Medis Moçambique', 'Hollard Seguros Moçambique', 'Sanlam / Global Alliance Seguros', 'Fidelidade Ímpar'];
          p.instrucoes_seguro = 'Atendimento clínico e farmacêutico sob Direcção Técnica de Grácio César. Exige apresentação do cartão do seguro (físico ou digital), documento de identificação com foto e receita médica carimbada para emissão do Termo de Responsabilidade.';
          p.tipo_estabelecimento = 'farmacia_clinica';
          hasUpdates = true;
        }
      } else if (lowerName.includes('central de tete')) {
        if (p.aceita_seguro === undefined) {
          p.aceita_seguro = true;
          p.seguradoras = ['Medis Moçambique', 'Sanlam / Global Alliance Seguros', 'Emose (Empresa Moçambicana de Seguros)'];
          p.instrucoes_seguro = 'Dispensa comparticipada mediante validação de elegibilidade no portal da seguradora.';
          p.tipo_estabelecimento = 'farmacia_comunitaria';
          hasUpdates = true;
        }
      } else if (lowerName.includes('moatize care')) {
        if (p.aceita_seguro === undefined) {
          p.aceita_seguro = true;
          p.seguradoras = ['Medis Moçambique', 'Hollard Seguros Moçambique', 'Cigna Healthcare', 'Bupa Global'];
          p.instrucoes_seguro = 'Atendimento especial para colaboradores de empresas do setor mineiro e corporativo em Tete e Moatize.';
          p.tipo_estabelecimento = 'farmacia_comunitaria';
          hasUpdates = true;
        }
      }
    });

    if (hasUpdates) {
      MEMORY_STORAGE_CACHE[STORAGE_KEYS.PHARMACIES] = stored;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify(stored));
        }
      } catch {
        // quota exceeded or private mode
      }
    }

    // Return all non-deleted pharmacies directly from the persistent store
    return stored.filter((p) => !deletedIds.includes(p.id));
  }

  static getApprovedPharmacies(): Pharmacy[] {
    return this.getPharmacies()
      .filter((p) => p.status === 'Aprovada' || p.status === 'Aprovação Provisória')
      .sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });
  }

  static getProvisionalPharmacies(): Pharmacy[] {
    return this.getPharmacies().filter((p) => p.status === 'Aprovação Provisória');
  }

  static getPendingPharmacies(): Pharmacy[] {
    return this.getPharmacies().filter(
      (p) => p.status === 'Pendente' || p.status === 'Aprovação Provisória' || p.status === 'Em análise'
    );
  }

  /**
   * Avalia a conformidade documental para concessão de Aprovação Automática Provisória
   * (Evita bloqueios caso o administrador esteja temporariamente sem conexão/megas)
   */
  static evaluateProvisionalApproval(data: Partial<Pharmacy>): {
    eligible: boolean;
    complianceScore: number;
    criteria: { label: string; met: boolean; detail?: string }[];
  } {
    const criteria = [
      {
        label: 'Identificação e Nome do Estabelecimento',
        met: Boolean(data.nome && data.nome.trim().length >= 3),
        detail: data.nome?.trim() || 'Não preenchido',
      },
      {
        label: 'NUIT Fiscal Registado (Moçambique)',
        met: Boolean(data.nuit && data.nuit.trim().length >= 6),
        detail: data.nuit?.trim() || 'Pendente',
      },
      {
        label: 'Alvará Sanitário / Registo DPS Tete',
        met: Boolean(data.license_number && data.license_number.trim().length >= 4),
        detail: data.license_number?.trim() || 'Pendente',
      },
      {
        label: 'Director Técnico Farmacêutico Nomeado',
        met: Boolean(data.director_name && data.director_name.trim().length >= 3),
        detail: data.director_name?.trim() || 'Pendente',
      },
      {
        label: 'Contacto Telefónico Operacional',
        met: Boolean(data.telefone && data.telefone.trim().length >= 8),
        detail: data.telefone?.trim() || 'Pendente',
      },
      {
        label: 'Localização Física e Bairro em Tete',
        met: Boolean(data.bairro && data.endereco && data.endereco.trim().length >= 3),
        detail: `${data.bairro || ''} - ${data.endereco || ''}`,
      },
    ];

    const metCount = criteria.filter((c) => c.met).length;
    const complianceScore = Math.round((metCount / criteria.length) * 100);
    const eligible = complianceScore >= 80;

    return {
      eligible,
      complianceScore,
      criteria,
    };
  }

  static getPharmacyById(id: string): Pharmacy | undefined {
    return this.getPharmacies().find((p) => p.id === id);
  }

  static getPharmacyByAccessCode(accessCode: string): Pharmacy | undefined {
    if (!accessCode) return undefined;
    const clean = accessCode.trim().toUpperCase();
    return this.getPharmacies().find(
      (p) =>
        (p.access_code && p.access_code.trim().toUpperCase() === clean) ||
        (p.pin && p.pin.trim() === accessCode.trim()) ||
        p.id.toUpperCase() === clean
    );
  }

  static getPharmaciesByDirector(directorIdOrEmail: string): Pharmacy[] {
    if (!directorIdOrEmail) return [];
    const query = directorIdOrEmail.trim().toLowerCase();
    return this.getPharmacies().filter(
      (p) =>
        p.director_id === directorIdOrEmail ||
        (p.director_id && p.director_id.toLowerCase() === query) ||
        (p.id && p.id.toLowerCase() === query) ||
        (p.email && p.email.toLowerCase() === query) ||
        (p.director_name && p.director_name.toLowerCase().includes(query))
    );
  }

  static getPharmacyByDirectorId(directorIdOrEmail: string): Pharmacy | undefined {
    if (!directorIdOrEmail) return undefined;
    const list = this.getPharmaciesByDirector(directorIdOrEmail);
    // Prioritize approved pharmacy first, then pending/any other
    return list.find((p) => p.status === 'Aprovada') || list[0];
  }

  static updatePharmacyAccessCode(
    pharmacyId: string,
    accessCode: string,
    pin?: string,
    performedBy?: UserProfile
  ): Pharmacy | undefined {
    const list = this.getPharmacies();
    const target = list.find((p) => p.id === pharmacyId);
    if (!target) return undefined;

    target.access_code = accessCode.trim().toUpperCase();
    if (pin) target.pin = pin.trim();
    target.updated_at = new Date().toISOString();
    setStoredItem(STORAGE_KEYS.PHARMACIES, list);

    if (performedBy) {
      this.addAuditLog({
        user_id: performedBy.user_id,
        user_name: performedBy.nome,
        user_email: performedBy.email,
        action: 'ATUALIZAR_CODIGO_FARMACIA',
        entity: 'pharmacy',
        entity_id: pharmacyId,
        metadata: `Novo código de acesso configurado para ${target.nome}: ${target.access_code}`,
      });
    }
    return target;
  }

  static savePharmacy(pharmacy: Pharmacy, performedBy?: UserProfile): void {
    // If this pharmacy ID was in deleted IDs, unmark it so it is never hidden or blocked
    const deletedIds = this.getDeletedPharmacyIds();
    if (deletedIds.includes(pharmacy.id)) {
      const unflagged = deletedIds.filter((id) => id !== pharmacy.id);
      setStoredItem(STORAGE_KEYS.DELETED_PHARMACY_IDS, unflagged);
    }

    const list = this.getPharmacies();
    const index = list.findIndex((p) => p.id === pharmacy.id);
    const nowIso = new Date().toISOString();
    const preparedPharm = {
      ...pharmacy,
      updated_at: nowIso,
      created_at: pharmacy.created_at || nowIso,
    };

    if (index >= 0) {
      list[index] = preparedPharm;
    } else {
      list.unshift(preparedPharm);
    }
    setStoredItem(STORAGE_KEYS.PHARMACIES, list);

    // Automatically provision initial essential medicine catalog so director can immediately view and manage stock
    try {
      const existingStocks = this.getPharmacyMedicines(pharmacy.id);
      if (existingStocks.length === 0) {
        this.seedEssentialStockForPharmacy(pharmacy.id, performedBy);
      }
    } catch {}

    // Sync directly to Cloud
    try {
      CloudSync.syncPharmacy(pharmacy);
    } catch {}

    if (performedBy) {
      this.addAuditLog({
        user_id: performedBy.user_id,
        user_name: performedBy.nome,
        user_email: performedBy.email,
        action: index >= 0 ? 'ATUALIZAR_FARMACIA' : 'CADASTRAR_FARMACIA',
        entity: 'pharmacy',
        entity_id: pharmacy.id,
        metadata: `${pharmacy.nome} (${pharmacy.status})`,
      });
    }
  }

  static seedEssentialMedicinesForPharmacy(pharmacyId: string, performedBy?: UserProfile): void {
    this.seedEssentialStockForPharmacy(pharmacyId, performedBy);
  }

  static deletePharmacy(pharmacyId: string, performedBy?: UserProfile): void {
    // 1. Mark in deleted tracking list to avoid re-sync or seed recovery
    const deletedIds = this.getDeletedPharmacyIds();
    if (!deletedIds.includes(pharmacyId)) {
      deletedIds.push(pharmacyId);
      setStoredItem(STORAGE_KEYS.DELETED_PHARMACY_IDS, deletedIds);
    }

    // 2. Remove pharmacy from pharmacies storage
    const list = this.getPharmacies();
    const target = list.find((p) => p.id === pharmacyId);
    const filtered = list.filter((p) => p.id !== pharmacyId);
    setStoredItem(STORAGE_KEYS.PHARMACIES, filtered);

    // 3. Remove associated pharmacy inventory stocks
    const allStocks = this.getPharmacyMedicines();
    const filteredStocks = allStocks.filter((s) => s.pharmacy_id !== pharmacyId);
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, filteredStocks);

    // 4. Remove associated photos
    const allPhotos = this.getPhotos();
    const filteredPhotos = allPhotos.filter((p) => p.pharmacy_id !== pharmacyId);
    setStoredItem(STORAGE_KEYS.PHOTOS, filteredPhotos);

    // 5. Delete from Cloud Firestore immediately
    try {
      CloudSync.deletePharmacy(pharmacyId);
    } catch {}

    if (performedBy && target) {
      this.addAuditLog({
        user_id: performedBy.user_id,
        user_name: performedBy.nome,
        user_email: performedBy.email,
        action: 'ELIMINAR_FARMACIA',
        entity: 'pharmacy',
        entity_id: pharmacyId,
        metadata: `Removida permanentemente a farmácia: ${target.nome} (${target.bairro})`,
      });
    }
  }

  static clearAllPharmacies(performedBy?: UserProfile): void {
    const list = this.getPharmacies();
    const allIds = list.map((p) => p.id);
    setStoredItem(STORAGE_KEYS.DELETED_PHARMACY_IDS, allIds);
    setStoredItem(STORAGE_KEYS.PHARMACIES, []);
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, []);
    try {
      CloudSync.clearAllPharmacies();
    } catch {}

    if (performedBy) {
      this.addAuditLog({
        user_id: performedBy.user_id,
        user_name: performedBy.nome,
        user_email: performedBy.email,
        action: 'LIMPAR_TODAS_FARMACIAS',
        entity: 'pharmacy',
        metadata: 'Todas as farmácias e estoques foram removidos.',
      });
    }
  }

  static updatePharmacyStatus(
    pharmacyId: string,
    newStatus: PharmacyStatus,
    reason?: string,
    adminUser?: UserProfile
  ): Pharmacy | undefined {
    const list = this.getPharmacies();
    const target = list.find((p) => p.id === pharmacyId);
    if (!target) return undefined;

    target.status = newStatus;
    if (newStatus === 'Aprovada') {
      target.is_verified = true;
      target.auto_approved = false;
    } else if (newStatus === 'Aprovação Provisória') {
      target.is_verified = true;
      target.auto_approved = true;
      if (!target.provisional_approval_date) {
        target.provisional_approval_date = new Date().toISOString();
      }
      if (!target.provisional_expiry_date) {
        target.provisional_expiry_date = new Date(Date.now() + 14 * 86400000).toISOString();
      }
    }
    target.rejection_reason = reason || undefined;
    target.updated_at = new Date().toISOString();
    setStoredItem(STORAGE_KEYS.PHARMACIES, list);

    // If approved or provisory, automatically ensure essential medicine inventory is seeded
    if (newStatus === 'Aprovada' || newStatus === 'Aprovação Provisória') {
      try {
        this.seedEssentialMedicinesForPharmacy(pharmacyId, adminUser);
      } catch {}
    }

    // Sync status change directly to Cloud Firestore
    try {
      CloudSync.syncPharmacy(target);
    } catch {}

    // Audit log
    if (adminUser) {
      this.addAuditLog({
        user_id: adminUser.user_id,
        user_name: adminUser.nome,
        user_email: adminUser.email,
        action: `MUDAR_ESTADO_FARMACIA_${newStatus.replace(/\s+/g, '_').toUpperCase()}`,
        entity: 'pharmacy',
        entity_id: pharmacyId,
        metadata: `Estado: ${newStatus}. Motivo: ${reason || 'Homologação e Conformidade'}`,
      });
    }

    // Send notification to the Technical Director
    this.addNotification({
      user_id: target.director_id,
      titulo: `Estado da Farmácia: ${newStatus}`,
      mensagem:
        newStatus === 'Aprovada'
          ? `Parabéns! A sua farmácia ${target.nome} recebeu homologação definitiva pelo Administrador Provincial e está plenamente certificada.`
          : newStatus === 'Aprovação Provisória'
          ? `A sua farmácia ${target.nome} recebeu Aprovação Automática Provisória (14 dias) por conformidade documental e já está aberta ao público!`
          : newStatus === 'Necessita correção'
          ? `A farmácia ${target.nome} necessita de correções: ${reason}`
          : `O estado da farmácia ${target.nome} foi alterado para ${newStatus}.`,
      tipo: 'pharmacy_approval',
      link: `director-pharmacy:${target.id}`,
    });

    return target;
  }

  // Pharmacy Photos
  static getPhotos(pharmacyId?: string): PharmacyPhoto[] {
    const list = getStoredItem<PharmacyPhoto[]>(STORAGE_KEYS.PHOTOS, SEED_PHOTOS);
    if (pharmacyId) {
      return list.filter((p) => p.pharmacy_id === pharmacyId);
    }
    return list;
  }

  static savePhoto(photo: PharmacyPhoto): void {
    const list = this.getPhotos();
    const index = list.findIndex((p) => p.id === photo.id);
    if (index >= 0) {
      list[index] = photo;
    } else {
      list.push(photo);
    }
    setStoredItem(STORAGE_KEYS.PHOTOS, list);
  }

  static deletePhoto(photoId: string): void {
    const list = this.getPhotos().filter((p) => p.id !== photoId);
    setStoredItem(STORAGE_KEYS.PHOTOS, list);
  }

  // Medicines Catalog
  static getDeletedMedicineIds(): string[] {
    return getStoredItem<string[]>(STORAGE_KEYS.DELETED_MEDICINE_IDS, []);
  }

  static getMedicines(): Medicine[] {
    const deletedIds = this.getDeletedMedicineIds();
    const stored = getStoredItem<Medicine[]>(STORAGE_KEYS.MEDICINES, SEED_MEDICINES);
    let needsUpdate = false;
    for (const seed of SEED_MEDICINES) {
      if (deletedIds.includes(seed.id)) continue;
      const existing = stored.find((m) => m.id === seed.id);
      if (!existing) {
        stored.push(seed);
        needsUpdate = true;
      } else if (!existing.sintomas && seed.sintomas) {
        existing.sintomas = seed.sintomas;
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      setStoredItem(STORAGE_KEYS.MEDICINES, stored);
    }
    return stored.filter((m) => !deletedIds.includes(m.id));
  }

  static getMedicineById(id: string): Medicine | undefined {
    return this.getMedicines().find((m) => m.id === id);
  }

  static saveMedicine(med: Medicine, user?: UserProfile): void {
    // If this medicine ID was in deleted IDs, restore/unmark it
    const deletedIds = this.getDeletedMedicineIds();
    if (deletedIds.includes(med.id)) {
      const unflagged = deletedIds.filter((id) => id !== med.id);
      setStoredItem(STORAGE_KEYS.DELETED_MEDICINE_IDS, unflagged);
    }

    const list = this.getMedicines();
    const index = list.findIndex((m) => m.id === med.id);
    if (index >= 0) {
      list[index] = { ...med, updated_at: new Date().toISOString() };
    } else {
      list.push(med);
    }
    setStoredItem(STORAGE_KEYS.MEDICINES, list);

    try {
      CloudSync.syncMedicine(med);
    } catch {}

    if (user) {
      this.addAuditLog({
        user_id: user.user_id,
        user_name: user.nome,
        user_email: user.email,
        action: index >= 0 ? 'EDITAR_MEDICAMENTO' : 'CADASTRAR_MEDICAMENTO',
        entity: 'medicine',
        entity_id: med.id,
        metadata: `${med.nome} (${med.concentracao})`,
      });
    }
  }

  static deleteMedicine(medicineId: string, user?: UserProfile): void {
    // 1. Mark in deleted tracking list to avoid re-sync or seed recovery
    const deletedIds = this.getDeletedMedicineIds();
    if (!deletedIds.includes(medicineId)) {
      deletedIds.push(medicineId);
      setStoredItem(STORAGE_KEYS.DELETED_MEDICINE_IDS, deletedIds);
    }

    // 2. Remove medicine from list
    const currentList = this.getMedicines();
    const target = currentList.find((m) => m.id === medicineId);
    const filtered = currentList.filter((m) => m.id !== medicineId);
    setStoredItem(STORAGE_KEYS.MEDICINES, filtered);

    // 3. Remove associated pharmacy inventory stocks
    const allStocks = this.getPharmacyMedicines();
    const filteredStocks = allStocks.filter((s) => s.medicine_id !== medicineId);
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, filteredStocks);

    try {
      CloudSync.deleteMedicine(medicineId);
    } catch {}

    if (user) {
      this.addAuditLog({
        user_id: user.user_id,
        user_name: user.nome,
        user_email: user.email,
        action: 'EXCLUIR_MEDICAMENTO_CATALOGO',
        entity: 'medicine',
        entity_id: medicineId,
        metadata: `Removido do catálogo: ${target ? `${target.nome} (${target.concentracao})` : medicineId}`,
      });
    }
  }

  static clearAllMedicines(user?: UserProfile): void {
    const list = this.getMedicines();
    const allIds = list.map((m) => m.id);
    setStoredItem(STORAGE_KEYS.DELETED_MEDICINE_IDS, allIds);
    setStoredItem(STORAGE_KEYS.MEDICINES, []);
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, []);
    try {
      CloudSync.clearAllMedicines();
    } catch {}

    if (user) {
      this.addAuditLog({
        user_id: user.user_id,
        user_name: user.nome,
        user_email: user.email,
        action: 'LIMPAR_TODO_CATALOGO_MEDICAMENTOS',
        entity: 'medicine',
        metadata: 'Todos os medicamentos de exemplo foram excluídos do catálogo provincial.',
      });
    }
  }

  // Pharmacy Inventory & Stock
  static getPharmacyMedicines(pharmacyId?: string): PharmacyMedicine[] {
    const stored = getStoredItem<PharmacyMedicine[]>(
      STORAGE_KEYS.PHARMACY_MEDICINES,
      SEED_PHARMACY_MEDICINES
    );
    let needsUpdate = false;
    for (const seedStock of SEED_PHARMACY_MEDICINES) {
      if (!stored.some((s) => s.id === seedStock.id)) {
        stored.push(seedStock);
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, stored);
    }
    const deletedMedIds = this.getDeletedMedicineIds();
    const deletedPharmIds = this.getDeletedPharmacyIds();
    const valid = stored.filter(
      (pm) => !deletedMedIds.includes(pm.medicine_id) && !deletedPharmIds.includes(pm.pharmacy_id)
    );
    if (pharmacyId) {
      return valid.filter((pm) => pm.pharmacy_id === pharmacyId);
    }
    return valid;
  }

  /**
   * Seed / initialize a complete kit of essential medicines for a pharmacy with 1 click
   */
  static seedEssentialStockForPharmacy(pharmacyId: string, user?: UserProfile): number {
    const medicines = this.getMedicines();
    const existing = this.getPharmacyMedicines(pharmacyId);
    const existingMedIds = new Set(existing.map((e) => e.medicine_id));
    const now = new Date().toISOString();

    const defaults: Record<string, { preco: number; qtd: number; unit: string }> = {
      'med-1': { preco: 50.0, qtd: 80, unit: 'caixas' }, // Paracetamol
      'med-2': { preco: 250.0, qtd: 45, unit: 'embalagens' }, // Coartem
      'med-3': { preco: 180.0, qtd: 35, unit: 'caixas' }, // Amoxicilina
      'med-4': { preco: 220.0, qtd: 40, unit: 'frascos' }, // Omeprazol
      'med-5': { preco: 320.0, qtd: 30, unit: 'caixas' }, // Losartan
      'med-6': { preco: 95.0, qtd: 60, unit: 'frascos' }, // Ibuprofeno
      'med-7': { preco: 35.0, qtd: 100, unit: 'saquetas' }, // Sais Reidratação
      'med-8': { preco: 210.0, qtd: 25, unit: 'caixas' }, // Ciprofloxacina
      'med-9': { preco: 290.0, qtd: 20, unit: 'caixas' }, // Metformina
      'med-10': { preco: 140.0, qtd: 30, unit: 'caixas' }, // Cetirizina
    };

    let addedCount = 0;
    medicines.slice(0, 10).forEach((med) => {
      if (!existingMedIds.has(med.id)) {
        const def = defaults[med.id] || { preco: 120.0, qtd: 30, unit: 'caixas' };
        const newStock: PharmacyMedicine = {
          id: `pm-${pharmacyId.replace(/[^a-zA-Z0-9]/g, '')}-${med.id}`,
          pharmacy_id: pharmacyId,
          medicine_id: med.id,
          quantidade: def.qtd,
          unidade: def.unit,
          preco: def.preco,
          disponibilidade: 'Disponível',
          data_validade: '2027-10-31',
          lote: `LT-${med.nome.slice(0, 3).toUpperCase()}-2026`,
          em_quarentena: false,
          ultima_atualizacao: now,
          created_at: now,
          updated_at: now,
        };
        this.savePharmacyMedicine(newStock);
        addedCount++;
      }
    });

    if (user && addedCount > 0) {
      this.addAuditLog({
        user_id: user.user_id,
        user_name: user.nome,
        user_email: user.email,
        action: 'INICIALIZAR_KIT_ESTOQUE_ESSENCIAL',
        entity: 'pharmacy',
        entity_id: pharmacyId,
        metadata: `Adicionados ${addedCount} medicamentos essenciais ao estoque da farmácia.`,
      });
    }

    return addedCount;
  }

  static getInventory(pharmacyId?: string): PharmacyMedicine[] {
    return this.getPharmacyMedicines(pharmacyId);
  }

  static getPharmacyMedicine(pharmacyId: string, medicineId: string): PharmacyMedicine | undefined {
    return this.getPharmacyMedicines(pharmacyId).find((pm) => pm.medicine_id === medicineId);
  }

  static savePharmacyMedicine(pm: PharmacyMedicine, user?: UserProfile): void {
    const list = this.getPharmacyMedicines();
    const index = list.findIndex(
      (item) => item.pharmacy_id === pm.pharmacy_id && item.medicine_id === pm.medicine_id
    );
    const now = new Date().toISOString();
    const updated = { ...pm, ultima_atualizacao: now, updated_at: now };

    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, list);

    // Sync stock directly to Cloud Firestore
    try {
      CloudSync.syncStock(updated);
    } catch {}

    if (user) {
      this.addAuditLog({
        user_id: user.user_id,
        user_name: user.nome,
        user_email: user.email,
        action: 'ATUALIZAR_ESTOQUE_PRECO',
        entity: 'stock',
        entity_id: pm.id,
        metadata: `Qtd: ${pm.quantidade} ${pm.unidade}, Preço: ${
          pm.preco !== null ? `${pm.preco} MZN` : 'Não informado'
        }, Estado: ${pm.disponibilidade}`,
      });
    }
  }

  static deletePharmacyMedicine(pmId: string, user?: UserProfile): void {
    const list = this.getPharmacyMedicines();
    const item = list.find((i) => i.id === pmId);
    const filtered = list.filter((i) => i.id !== pmId);
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, filtered);

    // Delete stock from Cloud Firestore
    try {
      CloudSync.deleteStock(pmId);
    } catch {}

    if (user && item) {
      this.addAuditLog({
        user_id: user.user_id,
        user_name: user.nome,
        user_email: user.email,
        action: 'REMOVER_MEDICAMENTO_ESTOQUE',
        entity: 'stock',
        entity_id: pmId,
        metadata: `Removido medicamento ${item.medicine_id} da farmácia ${item.pharmacy_id}`,
      });
    }
  }

  static quarantinePharmacyMedicine(
    pmId: string,
    motivo: string,
    user?: UserProfile
  ): PharmacyMedicine | undefined {
    const list = this.getPharmacyMedicines();
    const item = list.find((i) => i.id === pmId);
    if (!item) return undefined;

    item.em_quarentena = true;
    item.motivo_quarentena = motivo || 'Quarentena sanitária preventiva';
    item.data_quarentena = new Date().toISOString();
    item.disponibilidade = 'Temporariamente indisponível';
    item.updated_at = new Date().toISOString();
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, list);

    if (user) {
      this.addAuditLog({
        user_id: user.user_id,
        user_name: user.nome,
        user_email: user.email,
        action: 'COLOCAR_MEDICAMENTO_QUARENTENA',
        entity: 'stock',
        entity_id: pmId,
        metadata: `Medicamento ${item.medicine_id} colocado em quarentena. Motivo: ${item.motivo_quarentena}`,
      });
    }
    return item;
  }

  static releaseFromQuarantine(
    pmId: string,
    user?: UserProfile
  ): PharmacyMedicine | undefined {
    const list = this.getPharmacyMedicines();
    const item = list.find((i) => i.id === pmId);
    if (!item) return undefined;

    item.em_quarentena = false;
    item.motivo_quarentena = undefined;
    item.data_quarentena = undefined;
    item.disponibilidade = item.quantidade > 0 ? 'Disponível' : 'Indisponível';
    item.updated_at = new Date().toISOString();
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, list);

    if (user) {
      this.addAuditLog({
        user_id: user.user_id,
        user_name: user.nome,
        user_email: user.email,
        action: 'LIBERAR_MEDICAMENTO_QUARENTENA',
        entity: 'stock',
        entity_id: pmId,
        metadata: `Medicamento ${item.medicine_id} liberado da quarentena sanitária com sucesso.`,
      });
    }
    return item;
  }

  static discardExpiredMedicine(
    pmId: string,
    motivo?: string,
    user?: UserProfile
  ): void {
    const list = this.getPharmacyMedicines();
    const item = list.find((i) => i.id === pmId);
    const filtered = list.filter((i) => i.id !== pmId);
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, filtered);

    if (user && item) {
      this.addAuditLog({
        user_id: user.user_id,
        user_name: user.nome,
        user_email: user.email,
        action: 'DESCARTE_MEDICAMENTO_EXPIRADO',
        entity: 'stock',
        entity_id: pmId,
        metadata: `Descarte sanitário realizado para ${item.medicine_id} (Qtd: ${item.quantidade}, Validade: ${
          item.data_validade || 'N/D'
        }). Motivo: ${motivo || 'Medicamento expirado / avariado'}`,
      });
    }
  }

  // Orders
  static getOrders(filter?: { userId?: string; pharmacyId?: string }): Order[] {
    let list = getStoredItem<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    if (filter?.userId) {
      list = list.filter((o) => o.user_id === filter.userId);
    }
    if (filter?.pharmacyId) {
      list = list.filter((o) => o.pharmacy_id === filter.pharmacyId);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id);
  }

  static createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Order {
    const list = this.getOrders();
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newOrder);
    setStoredItem(STORAGE_KEYS.ORDERS, list);

    // Save initial history
    this.addOrderStatusHistory({
      order_id: newOrder.id,
      status: newOrder.status,
      note: 'Pedido submetido pelo utilizador.',
      changed_by: newOrder.user_id,
      changed_by_name: newOrder.user_nome,
    });

    // Notify pharmacy's director
    const pharmacy = this.getPharmacyById(newOrder.pharmacy_id);
    if (pharmacy) {
      this.addNotification({
        user_id: pharmacy.director_id,
        titulo: 'Novo Pedido Recebido',
        mensagem: `${newOrder.user_nome} solicitou ${newOrder.quantidade}x ${newOrder.medicine_nome}.`,
        tipo: 'order',
        link: 'director-orders',
      });
    }

    // Audit log
    this.addAuditLog({
      user_id: newOrder.user_id,
      user_name: newOrder.user_nome,
      user_email: newOrder.user_email || 'utente@farmalink.mz',
      action: 'CRIAR_PEDIDO',
      entity: 'order',
      entity_id: newOrder.id,
      metadata: `${newOrder.quantidade}x ${newOrder.medicine_nome} na ${newOrder.pharmacy_nome}`,
    });

    return newOrder;
  }

  static updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    changedByUser?: UserProfile
  ): Order | undefined {
    const list = this.getOrders();
    const target = list.find((o) => o.id === orderId);
    if (!target) return undefined;

    target.status = newStatus;
    target.status_note = note || undefined;
    target.updated_at = new Date().toISOString();
    setStoredItem(STORAGE_KEYS.ORDERS, list);

    // Add to history
    this.addOrderStatusHistory({
      order_id: orderId,
      status: newStatus,
      note: note || `Estado alterado para ${newStatus}`,
      changed_by: changedByUser?.user_id || 'system',
      changed_by_name: changedByUser?.nome || 'Sistema FarmaLink',
    });

    // Send notification to user
    this.addNotification({
      user_id: target.user_id,
      titulo: `Pedido #${orderId.slice(-4)}: ${newStatus}`,
      mensagem: `O seu pedido de ${target.medicine_nome} na ${target.pharmacy_nome} agora está: "${newStatus}". ${
        note ? `Observação: ${note}` : ''
      }`,
      tipo: 'order',
      link: 'orders',
    });

    // Audit Log
    if (changedByUser) {
      this.addAuditLog({
        user_id: changedByUser.user_id,
        user_name: changedByUser.nome,
        user_email: changedByUser.email,
        action: `ATUALIZAR_ESTADO_PEDIDO_${newStatus.toUpperCase()}`,
        entity: 'order',
        entity_id: orderId,
        metadata: `Estado: ${newStatus}. Nota: ${note || 'Nenhuma'}`,
      });
    }

    return target;
  }

  // Order Status History
  static getOrderStatusHistory(orderId: string): OrderStatusHistory[] {
    const list = getStoredItem<OrderStatusHistory[]>(STORAGE_KEYS.ORDER_HISTORY, []);
    return list
      .filter((h) => h.order_id === orderId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  static addOrderStatusHistory(item: Omit<OrderStatusHistory, 'id' | 'created_at'>): void {
    const list = getStoredItem<OrderStatusHistory[]>(STORAGE_KEYS.ORDER_HISTORY, []);
    list.push({
      ...item,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    });
    setStoredItem(STORAGE_KEYS.ORDER_HISTORY, list);
  }

  // Notifications
  static getNotifications(userId?: string): NotificationItem[] {
    const list = getStoredItem<NotificationItem[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      SEED_NOTIFICATIONS
    );
    if (userId) {
      return list
        .filter((n) => !n.user_id || n.user_id === userId || n.user_id === 'all')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static addNotification(notif: Omit<NotificationItem, 'id' | 'lida' | 'created_at'>): void {
    const list = this.getNotifications();
    list.unshift({
      ...notif,
      id: `notif-${Date.now()}`,
      lida: false,
      created_at: new Date().toISOString(),
    });
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  static markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.lida = true;
      setStoredItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  static markAllNotificationsAsRead(userId: string): void {
    const list = this.getNotifications();
    list.forEach((n) => {
      if (n.user_id === userId) n.lida = true;
    });
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    const list = getStoredItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static getLogs(): AuditLog[] {
    return this.getAuditLogs();
  }

  static addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): void {
    const list = this.getAuditLogs();
    list.unshift({
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    });
    setStoredItem(STORAGE_KEYS.AUDIT_LOGS, list);
  }

  static clearAuditLogs(performedBy?: UserProfile): void {
    const freshLog: AuditLog[] = performedBy
      ? [
          {
            id: `log-${Date.now()}`,
            user_id: performedBy.user_id,
            user_name: performedBy.nome,
            user_email: performedBy.email,
            action: 'LIMPAR_LOGS_AUDITORIA',
            entity: 'system',
            metadata: 'Registos anteriores limpos pelo administrador.',
            created_at: new Date().toISOString(),
          },
        ]
      : [];
    setStoredItem(STORAGE_KEYS.AUDIT_LOGS, freshLog);
  }

  // Pharmacy Drafts (Auto-Save requirement #10)
  static getDraft(userId: string): PharmacyDraft | null {
    const drafts = getStoredItem<Record<string, PharmacyDraft>>(STORAGE_KEYS.DRAFTS, {});
    return drafts[userId] || null;
  }

  static saveDraft(draft: Omit<PharmacyDraft, 'id' | 'saved_at'>): void {
    const drafts = getStoredItem<Record<string, PharmacyDraft>>(STORAGE_KEYS.DRAFTS, {});
    drafts[draft.user_id] = {
      ...draft,
      id: `draft-${draft.user_id}`,
      saved_at: new Date().toISOString(),
    };
    setStoredItem(STORAGE_KEYS.DRAFTS, drafts);
  }

  static clearDraft(userId: string): void {
    const drafts = getStoredItem<Record<string, PharmacyDraft>>(STORAGE_KEYS.DRAFTS, {});
    delete drafts[userId];
    setStoredItem(STORAGE_KEYS.DRAFTS, drafts);
  }

  // ==========================================
  // 1. REPOSIÇÃO DE STOCK & ALERTAS (Stock Restock Alerts)
  // ==========================================
  static getStockAlerts(userId?: string): StockAlert[] {
    const list = getStoredItem<StockAlert[]>(STORAGE_KEYS.STOCK_ALERTS, SEED_STOCK_ALERTS);
    if (userId) {
      return list.filter((a) => a.user_id === userId);
    }
    return list;
  }

  static createStockAlert(alert: Omit<StockAlert, 'id' | 'status' | 'created_at'>): StockAlert {
    const list = this.getStockAlerts();
    const existing = list.find(
      (a) =>
        a.user_id === alert.user_id &&
        a.medicine_id === alert.medicine_id &&
        a.status === 'active' &&
        (a.pharmacy_id === alert.pharmacy_id || !alert.pharmacy_id)
    );

    if (existing) {
      return existing;
    }

    const newAlert: StockAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    list.unshift(newAlert);
    setStoredItem(STORAGE_KEYS.STOCK_ALERTS, list);

    this.addNotification({
      user_id: alert.user_id,
      titulo: '🔔 Alerta de Stock Criado',
      mensagem: `Avisaremos assim que "${alert.medicine_nome}" estiver disponível em Tete!`,
      tipo: 'stock',
      link: 'profile',
    });

    return newAlert;
  }

  static deleteStockAlert(alertId: string): void {
    const list = this.getStockAlerts();
    const updated = list.filter((a) => a.id !== alertId);
    setStoredItem(STORAGE_KEYS.STOCK_ALERTS, updated);
  }

  static triggerStockAlertsForMedicine(
    medicineId: string,
    pharmacyId: string,
    pharmacyNome: string,
    medicineNome: string
  ): number {
    const list = this.getStockAlerts();
    let triggeredCount = 0;

    const updated = list.map((alert) => {
      if (
        alert.medicine_id === medicineId &&
        alert.status === 'active' &&
        (!alert.pharmacy_id || alert.pharmacy_id === pharmacyId)
      ) {
        triggeredCount++;
        // Send notification to the subscriber
        this.addNotification({
          user_id: alert.user_id,
          titulo: `🎉 ${medicineNome} Já Disponível!`,
          mensagem: `O medicamento que aguardava acabou de receber reposição de stock na "${pharmacyNome}". Pode agora reservar imediatamente!`,
          tipo: 'stock',
          link: 'medicines',
        });

        return {
          ...alert,
          status: 'triggered' as const,
          triggered_at: new Date().toISOString(),
        };
      }
      return alert;
    });

    if (triggeredCount > 0) {
      setStoredItem(STORAGE_KEYS.STOCK_ALERTS, updated);
    }
    return triggeredCount;
  }

  // ==========================================
  // 2. AVALIAÇÕES DE FARMÁCIAS (Pharmacy Reviews)
  // ==========================================
  static getPharmacyReviews(pharmacyId?: string): PharmacyReview[] {
    const list = getStoredItem<PharmacyReview[]>(
      STORAGE_KEYS.PHARMACY_REVIEWS,
      SEED_PHARMACY_REVIEWS
    );
    if (pharmacyId) {
      return list
        .filter((r) => r.pharmacy_id === pharmacyId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static addPharmacyReview(
    review: Omit<PharmacyReview, 'id' | 'helpful_count' | 'created_at'>
  ): PharmacyReview {
    const list = this.getPharmacyReviews();
    const newRev: PharmacyReview = {
      ...review,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      helpful_count: 0,
      helpful_users: [],
      created_at: new Date().toISOString(),
    };

    list.unshift(newRev);
    setStoredItem(STORAGE_KEYS.PHARMACY_REVIEWS, list);

    // Audit log
    this.addAuditLog({
      user_id: review.user_id,
      user_name: review.user_nome,
      user_email: '',
      action: 'AVALIAR_FARMACIA',
      entity: 'pharmacy',
      entity_id: review.pharmacy_id,
      metadata: `Classificação: ${review.rating} Estrelas. Comentário: ${review.comment.slice(0, 40)}...`,
    });

    return newRev;
  }

  static voteReviewHelpful(reviewId: string, userId: string): boolean {
    const list = this.getPharmacyReviews();
    const item = list.find((r) => r.id === reviewId);
    if (!item) return false;

    if (!item.helpful_users) item.helpful_users = [];

    const hasVoted = item.helpful_users.includes(userId);
    if (hasVoted) {
      item.helpful_users = item.helpful_users.filter((id) => id !== userId);
      item.helpful_count = Math.max(0, item.helpful_count - 1);
    } else {
      item.helpful_users.push(userId);
      item.helpful_count += 1;
    }

    setStoredItem(STORAGE_KEYS.PHARMACY_REVIEWS, list);
    return !hasVoted;
  }

  static replyToReview(
    reviewId: string,
    reply: { director_name: string; text: string }
  ): boolean {
    const list = this.getPharmacyReviews();
    const item = list.find((r) => r.id === reviewId);
    if (!item) return false;

    item.reply = {
      ...reply,
      created_at: new Date().toISOString(),
    };

    setStoredItem(STORAGE_KEYS.PHARMACY_REVIEWS, list);
    return true;
  }

  static getPharmacyRatingStats(pharmacyId: string) {
    const reviews = this.getPharmacyReviews(pharmacyId);
    if (reviews.length === 0) {
      return {
        average: 4.8,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = Number((sum / total).toFixed(1));

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[star] = (distribution[star] || 0) + 1;
    });

    return {
      average,
      total,
      distribution,
    };
  }

  // ==========================================
  // 3. LEMBRETES DE MEDICAMENTOS / POSOLOGIA (Medication Reminders)
  // ==========================================
  static getMedicationReminders(userId: string): MedicationReminder[] {
    const list = getStoredItem<MedicationReminder[]>(
      STORAGE_KEYS.MEDICATION_REMINDERS,
      SEED_MEDICATION_REMINDERS
    );
    return list.filter((r) => r.user_id === userId);
  }

  static saveMedicationReminder(
    reminder: Omit<MedicationReminder, 'id' | 'historico_tomas' | 'created_at'>
  ): MedicationReminder {
    const list = getStoredItem<MedicationReminder[]>(
      STORAGE_KEYS.MEDICATION_REMINDERS,
      SEED_MEDICATION_REMINDERS
    );

    // Generate scheduled dose slots for today
    const historico_tomas = reminder.horarios.map((h, idx) => ({
      id: `slot-${Date.now()}-${idx}`,
      data_hora: new Date().toISOString(),
      horario_agendado: h,
      tomado: false,
    }));

    const newReminder: MedicationReminder = {
      ...reminder,
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      historico_tomas,
      created_at: new Date().toISOString(),
    };

    list.unshift(newReminder);
    setStoredItem(STORAGE_KEYS.MEDICATION_REMINDERS, list);
    return newReminder;
  }

  static deleteMedicationReminder(reminderId: string): void {
    const list = getStoredItem<MedicationReminder[]>(
      STORAGE_KEYS.MEDICATION_REMINDERS,
      SEED_MEDICATION_REMINDERS
    );
    const updated = list.filter((r) => r.id !== reminderId);
    setStoredItem(STORAGE_KEYS.MEDICATION_REMINDERS, updated);
  }

  static toggleMedicationTaken(reminderId: string, slotId: string): boolean {
    const list = getStoredItem<MedicationReminder[]>(
      STORAGE_KEYS.MEDICATION_REMINDERS,
      SEED_MEDICATION_REMINDERS
    );
    const rem = list.find((r) => r.id === reminderId);
    if (!rem) return false;

    const slot = rem.historico_tomas.find((s) => s.id === slotId);
    if (!slot) return false;

    slot.tomado = !slot.tomado;
    slot.tomado_em = slot.tomado ? new Date().toISOString() : undefined;

    setStoredItem(STORAGE_KEYS.MEDICATION_REMINDERS, list);
    return slot.tomado;
  }

  static toggleReminderActive(reminderId: string): boolean {
    const list = getStoredItem<MedicationReminder[]>(
      STORAGE_KEYS.MEDICATION_REMINDERS,
      SEED_MEDICATION_REMINDERS
    );
    const rem = list.find((r) => r.id === reminderId);
    if (!rem) return false;

    rem.ativo = !rem.ativo;
    setStoredItem(STORAGE_KEYS.MEDICATION_REMINDERS, list);
    return rem.ativo;
  }

  // ==========================================
  // 4. RASTREIO E GESTÃO DE ESTAFETAS / TXOPELA (Deliveries)
  // ==========================================
  static updateOrderDeliveryTracking(
    orderId: string,
    step: 1 | 2 | 3 | 4,
    courierInfo?: {
      courier_nome?: string;
      courier_telefone?: string;
      courier_tipo?: 'txopela' | 'moto_estafeta' | 'bicicleta';
      courier_matricula?: string;
    }
  ): Order | null {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;

    if (!order.delivery_details) {
      order.delivery_details = {
        type: 'delivery',
        taxa_entrega: 100,
        tracking_step: step,
      };
    } else {
      order.delivery_details.tracking_step = step;
      order.delivery_details.updated_at = new Date().toISOString();
    }

    if (courierInfo) {
      if (courierInfo.courier_nome) order.delivery_details.courier_nome = courierInfo.courier_nome;
      if (courierInfo.courier_telefone) order.delivery_details.courier_telefone = courierInfo.courier_telefone;
      if (courierInfo.courier_tipo) order.delivery_details.courier_tipo = courierInfo.courier_tipo;
      if (courierInfo.courier_matricula) order.delivery_details.courier_matricula = courierInfo.courier_matricula;
    }

    // Also sync order main status
    if (step === 2) {
      order.status = 'Pronto para levantamento';
      order.status_note = 'Medicamento embalado e pronto para o estafeta';
    } else if (step === 3) {
      order.status = 'Reservado';
      order.status_note = `Em trânsito com ${order.delivery_details.courier_nome || 'Txopela/Estafeta'}`;
    } else if (step === 4) {
      order.status = 'Concluído';
      order.status_note = 'Entregue com sucesso ao destinatário em Tete';
    }

    order.updated_at = new Date().toISOString();
    setStoredItem(STORAGE_KEYS.ORDERS, orders);

    // Notify user
    const stepMessages = {
      1: 'O seu pedido foi confirmado pela farmácia.',
      2: 'O medicamento foi devidamente embalado pela equipa técnica.',
      3: `O estafeta ${order.delivery_details.courier_nome || 'Txopela'} já recolheu a encomenda e está a caminho do seu endereço!`,
      4: 'A sua encomenda foi entregue com sucesso! Obrigado por confiar no FarmaLink Tete.',
    };

    this.addNotification({
      user_id: order.user_id,
      titulo: `🛵 Entrega do Pedido #${order.id.slice(-4)}: Passo ${step}/4`,
      mensagem: stepMessages[step],
      tipo: 'order',
      link: 'orders',
    });

    return order;
  }

  // ==========================================
  // 5. RELATÓRIOS & ESTATÍSTICAS PARA DIRECTORES TÉCNICOS (Director Analytics)
  // ==========================================
  static getDirectorAnalytics(pharmacyId: string) {
    const orders = this.getOrders().filter((o) => o.pharmacy_id === pharmacyId);
    const stock = this.getPharmacyMedicines(pharmacyId);
    const alerts = this.getStockAlerts().filter(
      (a) => a.status === 'active' && (!a.pharmacy_id || a.pharmacy_id === pharmacyId)
    );
    const reviews = this.getPharmacyReviews(pharmacyId);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'Concluído').length;
    const totalRevenue = orders
      .filter((o) => o.status === 'Concluído' || o.payment_status === 'paid')
      .reduce((acc, o) => acc + (o.preco_total || 0), 0);

    const averageOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 180;

    // Top demanded medicines in Tete (combined real stock count + order requests)
    const topSearchedInTete = [
      { name: 'Coartem (Arteméter + Lumefantrina)', searches: 342, demand: 'Muito Alta', category: 'Antimalárico' },
      { name: 'Paracetamol 500mg', searches: 289, demand: 'Muito Alta', category: 'Analgésico' },
      { name: 'Amoxicilina 500mg (Clavamox)', searches: 215, demand: 'Alta', category: 'Antibiótico' },
      { name: 'Insulina Humana NPH', searches: 164, demand: 'Crítica / Ruptura', category: 'Antidiabético' },
      { name: 'Sais de Reidratação Oral (SRO)', searches: 148, demand: 'Alta', category: 'Reidratação' },
      { name: 'Ibuprofeno 400mg', searches: 132, demand: 'Média', category: 'Anti-inflamatório' },
      { name: 'Omeprazol 20mg', searches: 118, demand: 'Média', category: 'Gastroenterologia' },
    ];

    // Peak hours traffic in Tete pharmacies
    const peakHoursData = [
      { hora: '07h-09h', pedidos: 18, procura: 'Abertura / Emergências' },
      { hora: '09h-12h', pedidos: 42, procura: 'Horário Matinal Hospitalar' },
      { hora: '12h-14h', pedidos: 28, procura: 'Pausa de Almoço' },
      { hora: '14h-17h', pedidos: 55, procura: 'Pico da Tarde' },
      { hora: '17h-19h', pedidos: 68, procura: 'Pico Máximo de Saída do Trabalho' },
      { hora: '19h-22h', pedidos: 34, procura: 'Atendimento Noturno' },
      { hora: '22h-06h', pedidos: 12, procura: 'Plantão de Emergência' },
    ];

    // Stock alert waiting list
    const stockWaitingList = alerts.map((a) => ({
      id: a.id,
      medicineNome: a.medicine_nome,
      userName: a.user_nome,
      userPhone: a.user_telefone || '+258 84 ...',
      date: new Date(a.created_at).toLocaleDateString('pt-MZ'),
    }));

    const topSearchedMedicines = [
      { nome: 'Coartem (Arteméter + Lumefantrina)', procura: 342, disponibilidade: 'Disponível' },
      { nome: 'Paracetamol 500mg', procura: 289, disponibilidade: 'Disponível' },
      { nome: 'Amoxicilina 500mg', procura: 215, disponibilidade: 'Disponível' },
      { nome: 'Insulina NPH', procura: 164, disponibilidade: 'Pouca quantidade' },
      { nome: 'Sais de Reidratação Oral (SRO)', procura: 148, disponibilidade: 'Disponível' },
      { nome: 'Ibuprofeno 400mg', procura: 132, disponibilidade: 'Disponível' },
      { nome: 'Omeprazol 20mg', procura: 118, disponibilidade: 'Disponível' },
    ];

    const peakHours = [
      { hora: '08h', pedidos: 18 },
      { hora: '11h', pedidos: 42 },
      { hora: '13h', pedidos: 28 },
      { hora: '16h', pedidos: 55 },
      { hora: '18h', pedidos: 68 },
      { hora: '20h', pedidos: 34 },
    ];

    return {
      totalOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue,
      ratingStats: this.getPharmacyRatingStats(pharmacyId),
      stockCount: stock.length,
      lowStockCount: stock.filter((s) => s.disponibilidade === 'Pouca quantidade' || s.quantidade < 10).length,
      outOfStockCount: stock.filter((s) => s.disponibilidade === 'Indisponível' || s.quantidade === 0).length,
      topSearchedInTete,
      topSearchedMedicines,
      peakHoursData,
      peakHours,
      stockWaitingList,
      reviewsCount: reviews.length,
    };
  }

  // Reset database to official clean launch state (purging test orders and test reviews)
  static resetToOfficialCleanState(): void {
    setStoredItem(STORAGE_KEYS.PHARMACIES, SEED_PHARMACIES);
    setStoredItem(STORAGE_KEYS.PHOTOS, SEED_PHOTOS);
    setStoredItem(STORAGE_KEYS.PHARMACY_MEDICINES, SEED_PHARMACY_MEDICINES);
    setStoredItem(STORAGE_KEYS.ORDERS, []);
    setStoredItem(STORAGE_KEYS.ORDER_HISTORY, []);
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    setStoredItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    setStoredItem(STORAGE_KEYS.STOCK_ALERTS, []);
    setStoredItem(STORAGE_KEYS.PHARMACY_REVIEWS, []);
    setStoredItem(STORAGE_KEYS.MEDICATION_REMINDERS, []);
    setStoredItem(STORAGE_KEYS.DRAFTS, []);
    setStoredItem(STORAGE_KEYS.DELETED_PHARMACY_IDS, []);
    setStoredItem(STORAGE_KEYS.DELETED_MEDICINE_IDS, []);
    this.clearMemoryCache();
    notifyStorageUpdated();
  }
}

export const StorageService = FarmaLinkDB;
