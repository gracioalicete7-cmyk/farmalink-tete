import React, { useState } from 'react';
import { FarmaLinkDB } from '../lib/storage';
import { CloudSync } from '../lib/firestoreSync';
import { Medicine, Pharmacy, MedicineAvailability, PharmacyMedicine } from '../types';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  X,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface BatchStockImportModalProps {
  pharmacy: Pharmacy;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

interface ParsedItem {
  medicine_name: string;
  principio_ativo?: string;
  concentracao?: string;
  categoria?: string;
  forma?: string;
  quantidade: number;
  unidade: string;
  preco: number;
  precisa_receita: boolean;
  status: 'valid' | 'warning' | 'error';
  matchedMedicineId?: string;
  notes?: string;
}

export const BatchStockImportModal: React.FC<BatchStockImportModalProps> = ({
  pharmacy,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const allMedicines = FarmaLinkDB.getMedicines();

  // Template CSV download for pharmacies in Tete
  const downloadTemplate = () => {
    const csvContent =
      'Nome do Medicamento,Principio Ativo,Concentracao,Forma,Categoria,Quantidade,Unidade,Preco MZN,Exige Receita (Sim/Nao)\n' +
      'Paracetamol 500mg,Paracetamol,500mg,Comprimidos,Analgésicos e Antipiréticos,120,caixas,75.00,Nao\n' +
      'Amoxicilina 500mg,Amoxicilina,500mg,Cápsulas,Antibióticos e Anti-infecciosos,45,caixas,280.00,Sim\n' +
      'Coartem (Arteméter + Lumefantrina),Arteméter + Lumefantrina,20/120mg,Comprimidos,Antimaláricos,80,caixas,320.00,Sim\n' +
      'Ibuprofeno 400mg,Ibuprofeno,400mg,Comprimidos,Anti-inflamatórios,60,caixas,150.00,Nao\n' +
      'Soro Oral (Sais de Reidratação),SRO,20.5g/sachê,Pó para Solução Oral,Gastrointestinais e Reidratação,200,sachês,35.00,Nao\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Modelo_Importacao_Estoque_${pharmacy.nome.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setErrorMsg('O ficheiro está vazio.');
          setIsProcessing(false);
          return;
        }

        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          setErrorMsg('O ficheiro não contém linhas de dados além do cabeçalho.');
          setIsProcessing(false);
          return;
        }

        const results: ParsedItem[] = [];

        // Start from index 1 (skipping header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Handle comma or semicolon separated
          const delimiter = line.includes(';') ? ';' : ',';
          const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));

          if (cols.length >= 1 && cols[0]) {
            const medName = cols[0];
            const principio = cols[1] || '';
            const conc = cols[2] || '';
            const forma = cols[3] || 'Comprimidos';
            const cat = cols[4] || 'Medicamentos Gerais';
            const rawQty = parseInt(cols[5]) || 0;
            const unidade = cols[6] || 'caixas';
            const rawPreco = parseFloat(cols[7]?.replace(',', '.')) || 0;
            const rawReceita = cols[8]?.toLowerCase() === 'sim' || cols[8]?.toLowerCase() === 'true' || cols[8]?.toLowerCase() === 's';

            // Match against existing global catalogue
            const matched = allMedicines.find(
              (m) =>
                m.nome.toLowerCase() === medName.toLowerCase() ||
                m.nome.toLowerCase().includes(medName.toLowerCase()) ||
                medName.toLowerCase().includes(m.nome.toLowerCase())
            );

            results.push({
              medicine_name: medName,
              principio_ativo: principio || matched?.principio_ativo,
              concentracao: conc || matched?.concentracao,
              forma: forma || matched?.forma_farmaceutica,
              categoria: cat || matched?.categoria,
              quantidade: rawQty,
              unidade: unidade || 'caixas',
              preco: rawPreco,
              precisa_receita: rawReceita || !!matched?.precisa_receita,
              matchedMedicineId: matched?.id,
              status: rawQty <= 0 || rawPreco <= 0 ? 'warning' : 'valid',
              notes: matched ? 'Vinculado ao Catálogo Oficial DPS' : 'Novo medicamento (será cadastrado)',
            });
          }
        }

        setParsedItems(results);
        setIsProcessing(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao processar o ficheiro. Certifique-se de que é um formato CSV/Texto válido.');
        setIsProcessing(false);
      }
    };

    reader.readAsText(uploadedFile);
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return;

    setImporting(true);
    setErrorMsg(null);

    try {
      let importedCount = 0;

      for (const item of parsedItems) {
        let medicineId = item.matchedMedicineId;

        // If it doesn't exist in global catalogue, register it automatically
        if (!medicineId) {
          const newMed: Medicine = {
            id: `med-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5)}`,
            nome: item.medicine_name,
            principio_ativo: item.principio_ativo || item.medicine_name,
            concentracao: item.concentracao || 'Conforme embalagem',
            forma_farmaceutica: item.forma || 'Comprimidos',
            apresentacao: item.forma ? `${item.forma} (embalagem padrão)` : 'Caixa / Frasco',
            categoria: item.categoria || 'Medicamentos Gerais',
            precisa_receita: item.precisa_receita,
            descricao: `Medicamento importado via lote pela farmácia ${pharmacy.nome}.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          FarmaLinkDB.saveMedicine(newMed);
          medicineId = newMed.id;
        }

        // Calculate availability tag
        const disponibilidade: MedicineAvailability =
          item.quantidade <= 0
            ? 'Indisponível'
            : item.quantidade < 10
            ? 'Pouca quantidade'
            : 'Disponível';

        const stockId = `pm-${pharmacy.id}-${medicineId}`;
        const stockRecord: PharmacyMedicine = {
          id: stockId,
          pharmacy_id: pharmacy.id,
          medicine_id: medicineId,
          disponibilidade,
          quantidade: Math.max(0, item.quantidade),
          unidade: item.unidade,
          preco: item.preco > 0 ? item.preco : null,
          ultima_atualizacao: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        FarmaLinkDB.savePharmacyMedicine(stockRecord);
        await CloudSync.syncStock(stockRecord);
        importedCount++;
      }

      setSuccessCount(importedCount);
      setImporting(false);
      setTimeout(() => {
        onSuccess(importedCount);
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao gravar os itens no banco de dados. Tente novamente.');
      setImporting(false);
    }
  };

  return (
    <div
      id="batch-stock-import-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800/80 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Importação em Lote de Estoque (Excel / CSV)
              </h3>
              <p className="text-emerald-200 text-xs mt-0.5">
                {pharmacy.nome} • Atualização rápida do inventário
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Info Card */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-900">Como funciona a importação?</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Pode carregar a sua lista de stock a partir de um ficheiro Excel (.csv ou exportado do seu software de farmácia). O sistema associa automaticamente com a base da DPS de Tete.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="shrink-0 px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Modelo CSV</span>
            </button>
          </div>

          {/* File Upload Box */}
          {!file ? (
            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800">
                  Clique ou arraste o seu ficheiro CSV / Excel aqui
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos suportados: .csv, .txt (tabela separada por vírgula ou ponto-e-vírgula)
                </p>
              </div>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              {/* File details */}
              <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-xs text-slate-900">{file.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {parsedItems.length} medicamentos detetados
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedItems([]);
                  }}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Trocar ficheiro
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Pré-visualização dos Itens ({parsedItems.length})</span>
                  <span className="text-emerald-700 font-bold text-[11px]">Pronto para importar</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {parsedItems.map((item, idx) => (
                    <div key={idx} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.medicine_name}</span>
                          {item.concentracao && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                              {item.concentracao}
                            </span>
                          )}
                          {item.precisa_receita && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold">
                              Receita
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{item.notes}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900 text-sm text-emerald-700">
                          {item.preco > 0 ? `${item.preco.toFixed(2)} MZN` : 'A definir'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Qtd: <strong className="text-slate-800">{item.quantidade}</strong> {item.unidade}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold">
                {successCount} medicamentos importados e atualizados no estoque da farmácia com sucesso!
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={parsedItems.length === 0 || importing || successCount !== null}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            {importing ? (
              <span>A importar estoque...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Importação de {parsedItems.length} Itens</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
