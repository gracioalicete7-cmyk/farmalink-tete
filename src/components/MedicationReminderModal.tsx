import React, { useState } from 'react';
import {
  X,
  Clock,
  Plus,
  CheckCircle2,
  Bell,
  Pill,
  Trash2,
  Calendar,
  Sparkles,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { MedicationReminder, UserProfile } from '../types';
import { StorageService } from '../lib/storage';

interface MedicationReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const MedicationReminderModal: React.FC<MedicationReminderModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [reminders, setReminders] = useState<MedicationReminder[]>(() =>
    StorageService.getMedicationReminders(currentUser.user_id)
  );
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [medicineNome, setMedicineNome] = useState('');
  const [dosagem, setDosagem] = useState('1 Comprimido');
  const [frequencia, setFrequencia] = useState<number>(8);
  const [diasDuracao, setDiasDuracao] = useState<number>(7);
  const [primeiroHorario, setPrimeiroHorario] = useState('08:00');
  const [instrucoes, setInstrucoes] = useState('');

  if (!isOpen) return null;

  const refreshReminders = () => {
    setReminders(StorageService.getMedicationReminders(currentUser.user_id));
  };

  const calculateHorarios = (startHour: string, intervalHours: number): string[] => {
    const [h, m] = startHour.split(':').map(Number);
    const count = Math.floor(24 / intervalHours);
    const result: string[] = [];

    for (let i = 0; i < count; i++) {
      const nextHour = (h + i * intervalHours) % 24;
      const formatted = `${String(nextHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      result.push(formatted);
    }
    return result;
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineNome.trim()) return;

    const horarios = calculateHorarios(primeiroHorario, frequencia);

    StorageService.saveMedicationReminder({
      user_id: currentUser.user_id,
      medicine_nome: medicineNome.trim(),
      dosagem,
      frequencia_horas: frequencia,
      horarios,
      dias_duracao: diasDuracao,
      data_inicio: new Date().toISOString().split('T')[0],
      instrucoes: instrucoes.trim() || 'Tomar conforme prescrição médica',
      ativo: true,
    });

    setMedicineNome('');
    setShowAddForm(false);
    refreshReminders();
  };

  const handleToggleTaken = (remId: string, slotId: string) => {
    StorageService.toggleMedicationTaken(remId, slotId);
    refreshReminders();
  };

  const handleDelete = (remId: string) => {
    if (confirm('Tem a certeza que deseja remover este lembrete de medicamento?')) {
      StorageService.deleteMedicationReminder(remId);
      refreshReminders();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                Assistente de Saúde Pessoal
              </span>
              <h3 className="text-xl font-black mt-1">Lembrete de Medicamentos & Posologia</h3>
            </div>
          </div>
          <p className="text-emerald-100 text-xs sm:text-sm">
            Organize os horários das suas tomas diárias e nunca se esqueça de tomar o seu tratamento em Tete.
          </p>
        </div>

        {/* Action Top Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {reminders.length} {reminders.length === 1 ? 'Medicamento Ativo' : 'Medicamentos Ativos'}
            </span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancelar' : 'Adicionar Medicamento'}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddReminder} className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Novo Lembrete de Tratamento
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Medicamento
                  </label>
                  <input
                    type="text"
                    required
                    value={medicineNome}
                    onChange={(e) => setMedicineNome(e.target.value)}
                    placeholder="Ex: Amoxicilina, Coartem, Paracetamol, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dosagem por Toma
                  </label>
                  <input
                    type="text"
                    required
                    value={dosagem}
                    onChange={(e) => setDosagem(e.target.value)}
                    placeholder="Ex: 1 Comprimido de 500mg, 10ml"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Frequência
                  </label>
                  <select
                    value={frequencia}
                    onChange={(e) => setFrequencia(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value={4}>De 4 em 4 horas (6x ao dia)</option>
                    <option value={6}>De 6 em 6 horas (4x ao dia)</option>
                    <option value={8}>De 8 em 8 horas (3x ao dia)</option>
                    <option value={12}>De 12 em 12 horas (2x ao dia)</option>
                    <option value={24}>1 vez ao dia (24h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primeira Toma do Dia (Hora)
                  </label>
                  <input
                    type="time"
                    required
                    value={primeiroHorario}
                    onChange={(e) => setPrimeiroHorario(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duração do Tratamento
                  </label>
                  <select
                    value={diasDuracao}
                    onChange={(e) => setDiasDuracao(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value={3}>3 Dias (Tratamento Curto)</option>
                    <option value={5}>5 Dias</option>
                    <option value={7}>7 Dias (Padrão Antibiótico)</option>
                    <option value={10}>10 Dias</option>
                    <option value={14}>14 Dias (2 Semanas)</option>
                    <option value={30}>30 Dias (Contínuo / Mensal)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instruções Especiais / Recomendação Médica
                  </label>
                  <input
                    type="text"
                    value={instrucoes}
                    onChange={(e) => setInstrucoes(e.target.value)}
                    placeholder="Ex: Tomar após o almoço, não beber álcool, beber muita água..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Guardar Lembrete
                </button>
              </div>
            </form>
          )}

          {/* List of Reminders */}
          {reminders.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <Pill className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Sem lembretes configurados</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Adicione os seus medicamentos prescritos para acompanhar os horários de toma diários com facilidade.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
              >
                + Criar Meu Primeiro Lembrete
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  {/* Top Line */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{rem.medicine_nome}</h4>
                        <p className="text-xs text-slate-500">
                          {rem.dosagem} • De {rem.frequencia_horas} em {rem.frequencia_horas}h ({rem.horarios.length}x ao dia)
                        </p>
                        {rem.instrucoes && (
                          <p className="text-[11px] text-emerald-800 font-medium mt-1 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                            💡 {rem.instrucoes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(rem.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Apagar lembrete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Daily Scheduled Slots */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-2">
                      Horários de Hoje:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {rem.historico_tomas.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleToggleTaken(rem.id, slot.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            slot.tomado
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold font-mono">{slot.horario_agendado}</span>
                            <span className="block text-[10px] text-slate-500">
                              {slot.tomado ? 'Tomado ✅' : 'Pendente ⏳'}
                            </span>
                          </div>
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              slot.tomado ? 'text-emerald-600 fill-emerald-100' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            FarmaLink Tete • Saúde & Posologia Segura
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
