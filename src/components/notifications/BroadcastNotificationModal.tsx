import React, { useState } from 'react';
import {
  Bell,
  X,
  Send,
  BookOpen,
  Shield,
  Calendar,
  Heart,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCategory } from '../../types';

interface BroadcastNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BroadcastNotificationModal: React.FC<BroadcastNotificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, settings } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: 'ENSEIGNEMENT' as NotificationCategory,
    title: '',
    message: '',
    actionPage: 'media-gallery',
    actionLabel: 'Consulter',
    priority: 'NORMALE' as 'NORMALE' | 'HAUTE' | 'URGENTE',
    targetAudience: 'TOUS' as 'TOUS' | 'MEMBRES' | 'LEADERSHIP',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Veuillez renseigner le titre et le message de la notification.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.createNotification(
        {
          category: formData.category,
          title: formData.title.trim(),
          message: formData.message.trim(),
          actionPage: formData.actionPage || undefined,
          actionLabel: formData.actionLabel.trim() || 'Ouvrir',
          priority: formData.priority,
          targetAudience: formData.targetAudience,
          authorName: currentUser
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : 'Direction Paroissiale',
          authorRole: currentUser?.role || 'ADMIN',
        },
        currentUser || undefined
      );

      // Trigger Web Push Notification if browser permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(formData.title, {
            body: formData.message,
            icon: '/favicon.ico',
          });
        } catch (e) {
          // Ignore push notification error in sandbox
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to broadcast notification:', err);
      alert('Erreur lors de la diffusion de l’alerte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#4A0E17] text-white px-6 py-4 flex items-center justify-between border-b border-[#C99B2E]/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#C99B2E]/20 border border-[#C99B2E]/40 flex items-center justify-center text-[#C99B2E]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Diffuser une Notification
              </h3>
              <p className="text-[11px] text-amber-200/90 truncate">
                Alerter instantanément tous les membres et visiteurs de Sangmelima
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Category Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Type d'Alerte / Notification *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  cat: 'ENSEIGNEMENT' as NotificationCategory,
                  label: 'Enseignement',
                  icon: BookOpen,
                  color: 'text-blue-600',
                  defaultPage: 'media-gallery',
                  defaultAction: 'Écouter la prédication',
                },
                {
                  cat: 'MESSAGE_ADMIN' as NotificationCategory,
                  label: 'Message Admin',
                  icon: Shield,
                  color: 'text-amber-600',
                  defaultPage: 'prayer-requests',
                  defaultAction: 'Lire le communiqué',
                },
                {
                  cat: 'EVENEMENT' as NotificationCategory,
                  label: 'Date Événement',
                  icon: Calendar,
                  color: 'text-emerald-600',
                  defaultPage: 'events',
                  defaultAction: 'Voir le programme',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = formData.category === item.cat;
                return (
                  <button
                    key={item.cat}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        category: item.cat,
                        actionPage: item.defaultPage,
                        actionLabel: item.defaultAction,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                      isSelected
                        ? 'border-[#4A0E17] bg-[#4A0E17]/5 font-black text-[#4A0E17]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Titre de l'alerte *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Nouveau Message : La Puissance de la Prière..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none font-bold"
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Message / Contenu détaillé *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Saisissez le texte de l'annonce ou de l'enseignement que recevront les fidèles..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none leading-relaxed"
            />
          </div>

          {/* Action Link & Page Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lien de redirection (Page) :
              </label>
              <select
                value={formData.actionPage}
                onChange={(e) => setFormData({ ...formData, actionPage: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
              >
                <option value="media-gallery">Médiathèque & Vidéos Cultes</option>
                <option value="events">Agenda des Événements & Cultes</option>
                <option value="parakletos">Institut Biblique Parakletos</option>
                <option value="prayer-requests">Requêtes de Prière & Pastorale</option>
                <option value="finances">Offrandes & Dîmes Mobile Money</option>
                <option value="public-home">Portail d'Accueil Public</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Libellé du bouton d'action :
              </label>
              <input
                type="text"
                placeholder="Ex: Écouter, Consulter, S'inscrire..."
                value={formData.actionLabel}
                onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
              />
            </div>
          </div>

          {/* Priority & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Degré de priorité :
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
              >
                <option value="NORMALE">Priorité Normale</option>
                <option value="HAUTE">Priorité Haute (Important)</option>
                <option value="URGENTE">Priorité Urgente (Alerte)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Destinataires :
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
              >
                <option value="TOUS">Tous les Fidèles & Visiteurs</option>
                <option value="MEMBRES">Membres Officiels Actifs</option>
                <option value="LEADERSHIP">Équipe Pastorale & Direction</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Envoi...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>Diffuser l'Alerte</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
