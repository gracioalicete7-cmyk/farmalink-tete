import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserProfile, UserRole } from '../types';
import { CloudSync } from '../lib/firestoreSync';
import { Send, MessageSquare, Bot, User, Clock, CheckCheck, Paperclip } from 'lucide-react';

interface RealChatModalProps {
  pharmacyId: string;
  pharmacyNome: string;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export const RealChatModal: React.FC<RealChatModalProps> = ({
  pharmacyId,
  pharmacyNome,
  currentUser,
  isOpen,
  onClose,
  orderId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !pharmacyId) return;

    // Real-time Firestore message stream
    const unsubscribe = CloudSync.listenToPharmacyMessages(pharmacyId, (cloudMsgs) => {
      setMessages(cloudMsgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, pharmacyId]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      await CloudSync.sendMessage({
        pharmacy_id: pharmacyId,
        order_id: orderId,
        sender_id: currentUser.user_id,
        sender_name: currentUser.nome,
        sender_role: currentUser.role,
        recipient_id: pharmacyId,
        text,
      });
    } catch (err) {
      console.error('Error sending real message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col h-[560px] max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">{pharmacyNome}</h3>
              <p className="text-emerald-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Canal Oficial de Atendimento Farmacêutico</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">Inicie uma conversa direta</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Tire dúvidas sobre dosagens, disponibilidade de lotes ou confirme levantamentos com o director técnico.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUser.user_id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-semibold text-slate-500 mb-0.5 px-1">
                    {msg.sender_name} {msg.sender_role === 'director' ? '(Farmacêutico)' : ''}
                  </span>
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] text-xs font-medium shadow-2xs ${
                      isMine
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div
                      className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                        isMine ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMine && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escreva uma mensagem para a farmácia..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl shadow-md transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
