import React, { useState } from 'react';
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  ShieldCheck,
  Building2,
  User,
  HeartPulse,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Smartphone,
  X,
} from 'lucide-react';
import { FarmaLinkLogo } from '../lib/logo';
import { ScreenHeader } from '../components/ScreenHeader';

interface HelpSupportViewProps {
  onNavigate?: (tab: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

export const HelpSupportView: React.FC<HelpSupportViewProps> = ({ onNavigate, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'utente' | 'farmacia' | 'pagamentos' | 'dps'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [contactSubject, setContactSubject] = useState('Dúvida sobre Reserva de Medicamento');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const faqs = [
    {
      id: 'faq-1',
      category: 'utente',
      question: 'Como faço para pesquisar e reservar um medicamento no FarmaLink Tete?',
      answer:
        'Na barra de pesquisa da página inicial ou na aba "Medicamentos", digite o nome do fármaco (ou princípio ativo como Paracetamol ou Amoxicilina). Escolha a farmácia autorizada mais próxima com stock disponível e clique em "Solicitar Reserva". Poderá optar por pagar via M-Pesa, e-Mola ou pagar presencialmente no balcão.',
    },
    {
      id: 'faq-2',
      category: 'utente',
      question: 'É obrigatório apresentar receita médica para levantar o medicamento?',
      answer:
        'Para medicamentos sujeitos a Receita Médica Obrigatória (R.M.), sim. Pode carregar a foto da sua prescrição no momento da reserva ou apresentá-la fisicamente ao Director Técnico no balcão da farmácia em Tete.',
    },
    {
      id: 'faq-3',
      category: 'pagamentos',
      question: 'Quais são os métodos de pagamento suportados na plataforma?',
      answer:
        'O FarmaLink Tete aceita pagamentos móveis em Meticais (MZN) através de M-Pesa (Vodacom 84/85), e-Mola (Movitel 86/87) e Pagamento Presencial (Dinheiro/POS ao balcão). Todos os pagamentos geram um Recibo Digital e Ticket de Levantamento com código QR.',
    },
    {
      id: 'faq-4',
      category: 'farmacia',
      question: 'Como um Director Técnico cadastra uma nova farmácia em Tete?',
      answer:
        'Crie uma conta com o perfil "Director Técnico", aceda ao "Painel Farmácia" e preencha o formulário de cadastro com os dados oficiais (Alvará Sanitário, NUIT, localização exacta no mapa, fotos da fachada e logotipo). O pedido entrará em análise pela DPS Tete.',
    },
    {
      id: 'faq-5',
      category: 'farmacia',
      question: 'Como funciona a aprovação de farmácias pela DPS Tete?',
      answer:
        'A Inspecção Provincial de Saúde (DPS Tete) analisa a documentação e carteira profissional do Director Técnico. O estado passa de "Pendente" para "Aprovada" ou "Necessita Correção", garantindo que apenas farmácias legais e seguras apareçam no mapa público.',
    },
    {
      id: 'faq-6',
      category: 'farmacia',
      question: 'Como gerir o inventário e receber alertas de stock baixo?',
      answer:
        'No Painel do Director Técnico, na aba "Inventário", clique em "+ Adicionar Medicamento" para registrar novos lotes, preços e quantidades. Quando o stock atinge menos de 5 unidades, a plataforma ativa automaticamente o alerta visual de Stock Baixo.',
    },
    {
      id: 'faq-7',
      category: 'dps',
      question: 'O FarmaLink Tete comercializa medicamentos diretamente?',
      answer:
        'Não. O FarmaLink Tete é um portal informativo e de conexão sanitária homologado. Não armazenamos medicamentos nem efetuamos entregas por conta própria; a dispensação é feita estritamente pelas farmácias autorizadas.',
    },
  ];

  const filteredFaqs = faqs.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setContactSent(true);
    setTimeout(() => {
      setContactMessage('');
      setContactSent(false);
    }, 4000);
  };

  return (
    <div id="help-support-view" className="max-w-5xl mx-auto space-y-4 pb-16">
      {/* Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title="Ajuda & Suporte"
          subtitle="Centro de Ajuda & Autonomia do Cidadão em Tete"
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
        />
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Centro de Ajuda & Autonomia do Cidadão</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Como podemos ajudar em Tete?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Consulte respostas rápidas sobre reservas, farmácias de plantão, pagamentos via M-Pesa / e-Mola e credenciamento de directores técnicos.
          </p>

          {/* Quick Search */}
          <div className="relative pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-4.5 top-5.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por dúvidas (ex: receita, reserva, M-Pesa, plantão)..."
              className="w-full pl-11 pr-4 py-3 bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-xs sm:text-sm backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* Support Direct Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* WhatsApp Farmacêutico */}
        <a
          href="https://wa.me/258841234567?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20no%20FarmaLink%20Tete"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex items-start gap-4 group"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              WhatsApp de Suporte
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Atendimento rápido ao utente</p>
            <span className="text-xs font-extrabold text-emerald-600 mt-2 block">+258 84 123 4567</span>
          </div>
        </a>

        {/* Linha Telefónica DPS */}
        <a
          href="tel:+25825222222"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex items-start gap-4 group"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              Contacto Telefónico
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Assistência técnica de Tete</p>
            <span className="text-xs font-extrabold text-blue-600 mt-2 block">+258 252 22 222</span>
          </div>
        </a>

        {/* Email Oficial */}
        <a
          href="mailto:suporte@farmalink.mz"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-300 transition-all flex items-start gap-4 group"
        >
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
              Email Institucional
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Dúvidas e credenciamento</p>
            <span className="text-xs font-extrabold text-teal-600 mt-2 block">suporte@farmalink.mz</span>
          </div>
        </a>
      </div>

      {/* Structured FAQ Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-emerald-600" />
              <span>Perguntas Frequentes (FAQ)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Respostas claras para as questões mais comuns em Tete</p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('utente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'utente'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Utentes
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('farmacia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'farmacia'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Directores Técnicos
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('pagamentos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'pagamentos'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Pagamentos M-Pesa
            </button>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500">Nenhuma pergunta encontrada com o termo pesquisado.</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all ${
                    isOpen ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-emerald-100/60 pt-3">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Direct Contact Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Send className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base sm:text-lg font-bold">Enviar Mensagem ao Suporte Local</h2>
        </div>
        <p className="text-xs text-slate-500">
          Não encontrou o que procurava? Envie uma solicitação direta à equipe técnica e responderemos com brevidade.
        </p>

        {contactSent ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Mensagem enviada com sucesso!</p>
              <p className="text-emerald-700 mt-0.5">
                A equipe de suporte técnico do FarmaLink Tete entrará em contacto pelo seu telefone ou email.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendSupportMessage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assunto da Mensagem</label>
                <select
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                >
                  <option value="Dúvida sobre Reserva de Medicamento">Dúvida sobre Reserva de Medicamento</option>
                  <option value="Suporte a Pagamento M-Pesa / e-Mola">Suporte a Pagamento M-Pesa / e-Mola</option>
                  <option value="Cadastro de Farmácia / Director Técnico">Cadastro de Farmácia / Director Técnico</option>
                  <option value="Reportar Informação Incorreta de Stock">Reportar Informação Incorreta de Stock</option>
                  <option value="Outro Assunto">Outro Assunto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contacto de Retorno (Telefone/Email)</label>
                <input
                  type="text"
                  placeholder="+258 84 000 0000 ou seu@email.com"
                  defaultValue="+258 84 123 4567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descrição Detalhada</label>
              <textarea
                rows={3}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Explique detalhadamente o que ocorreu ou qual a sua dúvida..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Solicitação</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
