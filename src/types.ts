/**
 * FarmaLink Tete - Type Definitions
 * Província de Tete, Moçambique
 */

export type UserRole = 'user' | 'director' | 'admin' | 'superadmin';

export type UserStatus = 'active' | 'suspended';

export type PharmacyStatus =
  | 'Pendente'
  | 'Aprovação Provisória'
  | 'Em análise'
  | 'Aprovada'
  | 'Rejeitada'
  | 'Necessita correção'
  | 'Suspensa'
  | 'Inativa';

export type PharmacyApprovalStatus = PharmacyStatus;

export type MedicineAvailability =
  | 'Disponível'
  | 'Pouca quantidade'
  | 'Indisponível'
  | 'Temporariamente indisponível';

export type OrderStatus =
  | 'Enviado'
  | 'Recebido'
  | 'Em análise'
  | 'Disponível'
  | 'Não disponível'
  | 'Reservado'
  | 'Pronto para levantamento'
  | 'Concluído'
  | 'Cancelado'
  | 'Rejeitado';

export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  telefone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  pharmacy_id?: string;
  bairro?: string;
  numero_profissional?: string; // para directores técnicos
  avatar_url?: string;
  theme_preference?: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface PharmacyPhoto {
  id: string;
  pharmacy_id: string;
  image_url: string;
  type: 'fachada' | 'interior' | 'licenca' | 'outra';
  caption?: string;
  created_at: string;
}

export interface Pharmacy {
  id: string;
  nome: string;
  nuit: string;
  license_number: string;
  director_id: string;
  director_name: string;
  telefone: string;
  email: string;
  endereco: string;
  bairro: string;
  cidade: string;
  provincia: string; // Tete
  latitude: number;
  longitude: number;
  horario: string; // Ex: "08:00 - 20:00" ou "24 Horas"
  dias_funcionamento?: string; // Ex: "Segunda a Sábado"
  descricao: string;
  motivacao_cadastro?: string;
  logo_url: string;
  status: PharmacyStatus;
  rejection_reason?: string;
  is_verified?: boolean;
  provisional_approval_date?: string; // Data da concessão da aprovação provisória automática
  provisional_expiry_date?: string; // Data limite para homologação definitiva (14-30 dias)
  auto_approved?: boolean; // Flag de aprovação provisória automática concedida por conformidade
  compliance_score?: number; // Pontuação de conformidade documental (0-100%)
  access_code?: string; // Código de Acesso Exclusivo da Farmácia para o Director Técnico (ex: "FLT-7840" ou PIN)
  pin?: string; // PIN de 4-6 dígitos
  aceita_seguro?: boolean; // Se a farmácia/clínica atende utentes com seguro de saúde
  seguradoras?: string[]; // Lista de asseguradoras parceiras/conveniadas (ex: ["Medis", "Sanlam", "Hollard"])
  instrucoes_seguro?: string; // Requisitos de pré-autorização ou termo de responsabilidade
  tipo_estabelecimento?: 'farmacia_comunitaria' | 'farmacia_clinica' | 'posto_medicamentos';
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  nome: string;
  principio_ativo: string;
  concentracao: string; // Ex: "500 mg", "250 mg/5ml"
  forma_farmaceutica: string; // Ex: "Comprimidos", "Xarope", "Cápsulas", "Pomada", "Injetável"
  apresentacao: string; // Ex: "Caixa com 20 comprimidos", "Frasco de 100ml"
  fabricante?: string;
  categoria?: string; // Ex: "Analgésicos", "Antibióticos", "Antimaláricos", "Anti-inflamatórios"
  precisa_receita?: boolean;
  descricao?: string;
  sintomas?: string[]; // IDs de sintomas e necessidades clínicas (ex: "hipertensao", "malaria", "infantil")
  created_at: string;
  updated_at: string;
}

export interface PharmacyMedicine {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  quantidade: number;
  unidade: string; // "unidades", "caixas", "frascos"
  preco: number | null; // Preço em MZN ou null se não informado
  disponibilidade: MedicineAvailability;
  data_validade?: string; // Prazo de Validade (YYYY-MM-DD)
  lote?: string; // Número de Lote Sanitário (ex: "LOT-2024-X9")
  em_quarentena?: boolean; // Se o medicamento foi colocado em quarentena sanitária pelo director
  motivo_quarentena?: string; // Motivo da quarentena (ex: "Lote sob averiguação sanitária", "Suspeita de avaria")
  data_quarentena?: string; // Data em que foi colocado em quarentena
  observacoes?: string;
  ultima_atualizacao: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryDetails {
  type: 'pickup' | 'delivery';
  bairro_entrega?: string;
  endereco_detalhado?: string;
  ponto_referencia?: string;
  contacto_destinatario?: string;
  taxa_entrega: number; // em MZN (ex: 80 - 150 MT)
  tempo_estimado_minutos?: number; // ex: 35
  courier_nome?: string; // ex: "Carlos Mutemba (Txopela)"
  courier_telefone?: string; // ex: "+258 84 333 9988"
  courier_tipo?: 'txopela' | 'moto_estafeta' | 'bicicleta';
  courier_matricula?: string;
  tracking_step?: 1 | 2 | 3 | 4; // 1: Confirmado, 2: Em preparação, 3: A caminho, 4: Entregue
  updated_at?: string;
}

export interface StockAlert {
  id: string;
  user_id: string;
  user_nome: string;
  user_telefone?: string;
  user_email?: string;
  medicine_id: string;
  medicine_nome: string;
  pharmacy_id?: string; // específico ou qualquer farmácia em Tete
  pharmacy_nome?: string;
  status: 'active' | 'triggered' | 'cancelled';
  created_at: string;
  triggered_at?: string;
}

export interface PharmacyReview {
  id: string;
  pharmacy_id: string;
  user_id: string;
  user_nome: string;
  user_bairro?: string;
  rating: number; // 1 a 5
  comment: string;
  order_id?: string;
  is_verified_buyer: boolean;
  helpful_count: number;
  helpful_users?: string[];
  director_response?: string;
  reply?: {
    director_name: string;
    text: string;
    created_at: string;
  };
  created_at: string;
}

export interface MedicationReminder {
  id: string;
  user_id: string;
  medicine_nome: string;
  dosagem: string; // ex: "1 Comprimido de 500mg", "10 ml"
  frequencia_horas: number; // ex: 8, 12, 24
  horarios: string[]; // ex: ["08:00", "16:00", "00:00"]
  dias_duracao: number; // ex: 7 dias
  data_inicio: string; // YYYY-MM-DD
  instrucoes?: string; // ex: "Tomar após a refeição com água"
  ativo: boolean;
  historico_tomas: Array<{
    id: string;
    data_hora: string;
    horario_agendado: string;
    tomado: boolean;
    tomado_em?: string;
  }>;
  created_at: string;
}

export interface Order {
  id: string;
  reservation_code?: string; // ex: FLT-TETE-4921
  user_id: string;
  user_nome: string;
  user_telefone: string;
  user_email?: string;
  pharmacy_id: string;
  pharmacy_nome: string;
  pharmacy_telefone?: string;
  medicine_id: string;
  medicine_nome: string;
  medicine_concentracao?: string;
  quantidade: number;
  preco_unitario: number | null; // em MZN
  preco_total: number | null;
  observacao?: string;
  prescription_url?: string; // Upload real da receita médica (imagem ou PDF em base64/cloud)
  payment_method?: 'mpesa' | 'emola' | 'cash_on_pickup' | 'pos_card' | 'insurance';
  payment_status?: 'pending' | 'paid' | 'pay_on_delivery' | 'refunded';
  payment_phone?: string; // Telemóvel M-Pesa / e-Mola
  payment_tx_id?: string; // ID da transação MPesa / eMola
  usa_seguro?: boolean; // Se o pedido foi submetido sob cobertura de seguro de saúde
  seguradora_nome?: string; // Nome da asseguradora do utente (ex: "Medis Moçambique")
  numero_cartao_seguro?: string; // Número da apólice ou cartão de beneficiário
  autorizacao_seguro_status?: 'pendente_autorizacao' | 'autorizado' | 'nao_autorizado' | 'nao_aplicavel';
  delivery_type?: 'pickup' | 'delivery';
  delivery_details?: DeliveryDetails;
  status: OrderStatus;
  status_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  order_id?: string;
  pharmacy_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  recipient_id: string;
  text: string;
  attachment_url?: string;
  created_at: string;
  read: boolean;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note?: string;
  changed_by: string;
  changed_by_name: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'order' | 'pharmacy_approval' | 'system' | 'stock';
  lida: boolean;
  link?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  entity: 'pharmacy' | 'medicine' | 'stock' | 'order' | 'user' | 'system';
  entity_id?: string;
  metadata?: string;
  created_at: string;
}

export interface PharmacyDraft {
  id: string;
  user_id: string;
  nome: string;
  nuit: string;
  license_number: string;
  director_name: string;
  numero_profissional: string;
  telefone: string;
  email: string;
  endereco: string;
  bairro: string;
  cidade: string;
  provincia: string;
  latitude: number;
  longitude: number;
  horario: string;
  dias_funcionamento: string;
  descricao: string;
  motivacao_cadastro?: string;
  logo_url: string;
  access_code?: string;
  pin?: string;
  aceita_seguro?: boolean;
  seguradoras?: string[];
  instrucoes_seguro?: string;
  tipo_estabelecimento?: 'farmacia_comunitaria' | 'farmacia_clinica' | 'posto_medicamentos';
  fotos: Array<{ url: string; type: 'fachada' | 'interior' | 'licenca' | 'outra' }>;
  saved_at: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  bairro?: string;
  cidade?: string;
  precisao?: number;
  timestamp?: number;
}
