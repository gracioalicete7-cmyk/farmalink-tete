import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileSelect: (base64Url: string, file: File) => void;
  currentValue?: string;
  onRemove?: () => void;
  isPrescription?: boolean;
}

export const RealFileUpload: React.FC<FileUploadProps> = ({
  label,
  description = 'Suporta fotos nítidas (JPEG, PNG) ou ficheiro PDF',
  accept = 'image/*,application/pdf',
  maxSizeMb = 5,
  onFileSelect,
  currentValue,
  onRemove,
  isPrescription = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentValue || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`O ficheiro excede o tamanho máximo de ${maxSizeMb} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      setFileName(file.name);
      onFileSelect(result, file);
    };
    reader.onerror = () => {
      setError('Erro ao processar ficheiro. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-xs font-bold text-slate-800">{label}</label>

      {preview ? (
        <div className="relative rounded-2xl border border-emerald-300 bg-emerald-50/50 p-3 flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            {preview.startsWith('data:image') || preview.startsWith('http') ? (
              <img
                src={preview}
                alt="Upload preview"
                className="w-12 h-12 object-cover rounded-xl border border-emerald-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-emerald-700" />
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">
                {fileName || (isPrescription ? 'Receita Médica Anexada' : 'Ficheiro Carregado')}
              </p>
              <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pronto para submissão</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setFileName(null);
              if (onRemove) onRemove();
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
            title="Remover ficheiro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
            dragActive
              ? 'border-emerald-600 bg-emerald-50'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Toque para selecionar ou arraste o ficheiro
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
