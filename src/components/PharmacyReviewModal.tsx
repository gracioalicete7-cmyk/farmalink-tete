import React, { useState } from 'react';
import { X, Star, CheckCircle2, MessageSquare, Building2, User, Sparkles } from 'lucide-react';
import { Pharmacy, UserProfile } from '../types';
import { StorageService } from '../lib/storage';

interface PharmacyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacy: Pharmacy | null;
  currentUser: UserProfile;
  onReviewSubmitted?: () => void;
}

export const PharmacyReviewModal: React.FC<PharmacyReviewModalProps> = ({
  isOpen,
  onClose,
  pharmacy,
  currentUser,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !pharmacy) return null;

  const ratingLabels = {
    1: 'Muito Fraco 😞',
    2: 'Razoável 😐',
    3: 'Bom 🙂',
    4: 'Muito Bom 😊',
    5: 'Excelente! ⭐⭐⭐⭐⭐',
  };

  const quickTags = [
    'Atendimento Rápido ⚡',
    'Farmacêutico Atencioso 👨‍⚕️',
    'Preços Justos 💰',
    'Stock Sempre Atualizado 📦',
    'Facilidade com M-Pesa 📲',
    'Localização Acessível 📍',
  ];

  const handleAddTag = (tag: string) => {
    if (!comment.includes(tag)) {
      setComment((prev) => (prev ? `${prev}. ${tag}` : tag));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      StorageService.addPharmacyReview({
        pharmacy_id: pharmacy.id,
        user_id: currentUser.user_id,
        user_nome: currentUser.nome,
        user_bairro: currentUser.bairro || 'Cidade de Tete',
        rating,
        comment: comment.trim(),
        is_verified_buyer: true,
      });

      setSubmitted(true);
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => {
        setSubmitted(false);
        setComment('');
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-500 to-amber-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                Avaliação Verificada
              </span>
              <h3 className="text-xl font-black mt-1">Avaliar Farmácia</h3>
            </div>
          </div>
          <p className="text-amber-100 text-xs mt-1">
            A sua opinião ajuda a comunidade de Tete a escolher os melhores serviços de saúde.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Avaliação Publicada!</h4>
            <p className="text-sm text-slate-600">
              Obrigado pelo seu contributo para a transparência e qualidade na Província de Tete.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Farmácia Header Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-amber-700 shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">{pharmacy.nome}</h4>
                <p className="text-xs text-slate-500">{pharmacy.endereco}, {pharmacy.bairro}</p>
              </div>
            </div>

            {/* Selector de Estrelas */}
            <div className="text-center space-y-2 py-2">
              <label className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                Como classifica a sua experiência?
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 transition-all hover:scale-125 focus:outline-hidden cursor-pointer"
                    aria-label={`${star} Estrelas`}
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400 filter drop-shadow-xs'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-bold text-amber-800">
                {ratingLabels[(hoverRating || rating) as keyof typeof ratingLabels]}
              </p>
            </div>

            {/* Sugestões Rápidas */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Sugestões de elogio ou destaque:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comentário */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                O seu Comentário / Observação
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte o que achou do atendimento, disponibilidade de stock e tempo de espera..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Publicar Avaliação</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
