/**
 * FarmaLink Tete - Health Insurance & Clinical Authorization Constants
 * Província de Tete, Moçambique
 */

export interface MozInsuranceCompany {
  id: string;
  name: string;
  shortName: string;
  color: string;
  description: string;
}

export const MOZAMBIQUE_INSURANCE_COMPANIES: MozInsuranceCompany[] = [
  {
    id: 'medis',
    name: 'Medis Moçambique',
    shortName: 'Medis',
    color: 'emerald',
    description: 'Rede de cuidados de saúde corporativa e particular muito utilizada em Tete',
  },
  {
    id: 'sanlam',
    name: 'Sanlam / Global Alliance Seguros',
    shortName: 'Sanlam / GA',
    color: 'blue',
    description: 'Ampla cobertura nacional com convénios hospitalares e farmacêuticos',
  },
  {
    id: 'hollard',
    name: 'Hollard Seguros Moçambique',
    shortName: 'Hollard',
    color: 'purple',
    description: 'Seguro de saúde com forte presença no setor empresarial e corporativo',
  },
  {
    id: 'fidelidade',
    name: 'Fidelidade Ímpar',
    shortName: 'Fidelidade',
    color: 'rose',
    description: 'Planos de saúde e assistência médica com cobertura farmacêutica em Moçambique',
  },
  {
    id: 'emose',
    name: 'Emose (Empresa Moçambicana de Seguros)',
    shortName: 'Emose',
    color: 'amber',
    description: 'Seguradora estatal histórica com apólices de saúde e acidentes de trabalho',
  },
  {
    id: 'cigna',
    name: 'Cigna Healthcare',
    shortName: 'Cigna',
    color: 'indigo',
    description: 'Convénio internacional muito comum em empresas de mineração em Moatize e Tete',
  },
  {
    id: 'bupa',
    name: 'Bupa Global',
    shortName: 'Bupa',
    color: 'sky',
    description: 'Assistência e seguro internacional para expatriados e quadros corporativos',
  },
  {
    id: 'sos_intl',
    name: 'SOS International',
    shortName: 'SOS Intl',
    color: 'red',
    description: 'Assistência médica de emergência e cobertura em zonas industriais e remotas',
  },
  {
    id: 'momentum',
    name: 'Momentum Moçambique',
    shortName: 'Momentum',
    color: 'teal',
    description: 'Planos de saúde corporativos com autorização direta farmacêutica',
  },
  {
    id: 'phoenix',
    name: 'Phoenix Seguros',
    shortName: 'Phoenix',
    color: 'cyan',
    description: 'Cobertura de saúde e planos individuais/familiares',
  },
];

export const INSURANCE_DISPENSATION_NOTICE =
  'Aviso Sanitário e Regulamentar: A dispensa de medicamentos comparticipados por asseguradoras exige a apresentação do cartão do seguro (físico ou virtual), documento de identificação oficial (BI, Passaporte ou DIRE) e receita médica carimbada. A dispensa está estritamente sujeita à pré-autorização ou emissão do Termo de Responsabilidade pelo sistema da seguradora parceira.';
