import React from 'react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { ScreenHeader } from '../components/ScreenHeader';
import { ShieldCheck, FileText, PhoneCall, AlertTriangle, Building, HeartPulse, X } from 'lucide-react';

interface TermsAndPrivacyViewProps {
  onBack?: () => void;
}

export const TermsAndPrivacyView: React.FC<TermsAndPrivacyViewProps> = ({ onBack }) => {
  return (
    <div id="terms-and-privacy-view" className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title="Termos & Privacidade"
          subtitle="Regulamentação e Transparência FarmaLink Tete"
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Regulamentação e Transparência</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Termos de Uso & Política de Privacidade
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          FarmaLink Tete • Província de Tete, República de Moçambique
        </p>
      </div>

      <DisclaimerBanner />

      {/* Emergency Contacts Box (Requirement #35 & #36) */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-red-900">
          <PhoneCall className="w-5 h-5 text-red-600" />
          <h2 className="text-base sm:text-lg font-bold">Contactos de Emergência Médica em Tete</h2>
        </div>
        <p className="text-xs text-red-800 leading-relaxed">
          Em situações de emergência grave ou risco de vida, não utilize esta aplicação para buscar medicamentos. Dirija-se imediatamente ao serviço de urgência mais próximo:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-2xl border border-red-200 shadow-xs">
            <span className="font-bold text-slate-900 block">Hospital Provincial de Tete (HPT)</span>
            <p className="text-slate-600 mt-1">Urgência Geral e Maternidade</p>
            <a href="tel:+25825222222" className="text-red-700 font-extrabold text-sm hover:underline block mt-1">
              +258 25 222 222
            </a>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-red-200 shadow-xs">
            <span className="font-bold text-slate-900 block">Linha Verde de Saúde MZ</span>
            <p className="text-slate-600 mt-1">Informações do Ministério da Saúde</p>
            <a href="tel:110" className="text-red-700 font-extrabold text-sm hover:underline block mt-1">
              110 (Gratuito)
            </a>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-red-200 shadow-xs">
            <span className="font-bold text-slate-900 block">Polícia da República (PRM) Tete</span>
            <p className="text-slate-600 mt-1">Socorro e Apoio de Emergência</p>
            <a href="tel:112" className="text-red-700 font-extrabold text-sm hover:underline block mt-1">
              112
            </a>
          </div>
        </div>
      </div>

      {/* Full Legal Text */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Natureza do Serviço FarmaLink Tete</h2>
          <p>
            O <strong>FarmaLink Tete</strong> é uma plataforma digital informativa cujo objetivo exclusivo é facilitar a localização de farmácias devidamente autorizadas e a consulta de disponibilidade e preços de produtos farmacêuticos na Província de Tete.
          </p>
          <p>
            O FarmaLink Tete <strong>NÃO É UMA FARMÁCIA</strong>, não armazena medicamentos, não realiza entregas de substâncias sujeitas a controlo especial sem verificação prévia e não comercializa medicamentos diretamente.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Isenção de Aconselhamento Médico</h2>
          <p>
            As informações apresentadas nesta aplicação não substituem, em circunstância alguma, a consulta, diagnóstico ou prescrição de um médico, farmacêutico ou profissional de saúde qualificado. A automedicação representa sérios riscos para a saúde pública.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Solicitação de Medicamentos e Levantamento</h2>
          <p>
            O envio de um pedido através do sistema representa unicamente uma <strong>solicitação de reserva ou confirmação de disponibilidade</strong>. Não constitui venda fechada ou garantia irrevogável de estoque. Cabe à farmácia receptora validar a prescrição médica e a identidade do utente no balcão de atendimento.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Privacidade e Proteção de Dados</h2>
          <p>
            Os dados fornecidos pelos cidadãos (como nome e número de telefone moçambicano) são utilizados estritamente para o processamento das solicitações de medicamentos junto das farmácias autorizadas de Tete. Não comercializamos nem transferimos dados para terceiros.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Responsabilidade dos Directores Técnicos</h2>
          <p>
            Os Directores Técnicos de cada farmácia parceira são os únicos responsáveis pela veracidade, acurácia e atualização tempestiva dos estoques e preços em Meticais (MZN) praticados em seus estabelecimentos físicos em Tete.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2>6. Sistema de Cibersegurança, Proteção Anti-Hacker e Defesa Ativa</h2>
          </div>
          <p>
            A plataforma <strong>FarmaLink Tete</strong> implementa uma infraestrutura de segurança cibernética de alta fidelidade baseada no modelo <em>Zero-Trust</em>, protegendo os dados dos cidadãos e das instituições farmacêuticas contra ameaças digitais, ataques de negação de serviço (DoS/DDoS), vírus e tentativas de intrusão:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Desinfeção e Filtragem de Entradas (Anti-XSS & Anti-Injection):</strong> Todos os dados submetidos passam por sanitização rigorosa que remove tags scripts, injeções SQL, comandos de sistema e sequências maliciosas.</li>
            <li><strong>Assinatura Digital Criptográfica Anti-Adulteração:</strong> Cada reserva gerada recebe um selo criptográfico HMAC único que impede a falsificação de preços, medicamentos ou quantidades.</li>
            <li><strong>Proteção Contra Força Bruta e Robôs (Rate-Limiting):</strong> Limitadores de cadência bloqueiam requisições excessivas automáticas, prevenindo spam e invasões por varredura.</li>
            <li><strong>Regras de Acesso Baseadas em Atributos (ABAC) no Firestore:</strong> Políticas estritas de banco de dados garantem que utentes acedam apenas aos seus pedidos, directores técnicos administrem apenas sua farmácia e administradores supervisionem a conformidade sanitária provincial.</li>
            <li><strong>Registo de Auditoria Imutável:</strong> Todas as ações administrativas e alterações de credenciamento sanitário são registradas em logs protegidos contra exclusão ou alteração.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
