import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Plus,
  CheckCircle,
  XCircle,
  EyeOff,
  AlertTriangle,
  X,
  Filter,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Testimonial } from '../types';
import { formatDateDouala } from '../utils/formatters';

export const TestimonialsPage: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'EN_ATTENTE' | 'VALIDÉ' | 'REJETÉ'>('ALL');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<Testimonial | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Guérison',
    content: '',
    isIdentityVisible: true,
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    const list = await apiClient.getTestimonials(false);
    setTestimonials(list);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    await apiClient.submitTestimonial(
      {
        ...formData,
        authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Fidèle EMF',
        authorEmail: currentUser?.email,
        authorPhone: currentUser?.phone,
        memberId: currentUser?.memberId,
      },
      currentUser || undefined
    );

    setShowSubmitModal(false);
    showToast('Votre témoignage a été soumis avec succès. Il apparaîtra après modération pastorale.');
    loadTestimonials();
  };

  const handleModerate = async (id: string, status: 'VALIDÉ' | 'REJETÉ' | 'MASQUÉ', reason?: string) => {
    await apiClient.moderateTestimonial(id, status, reason, currentUser || undefined);
    showToast(`Témoignage passé au statut : ${status}`);
    setRejectingItem(null);
    setRejectionReason('');
    loadTestimonials();
  };

  const filteredTestimonials = testimonials.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const canModerate = hasPermission('TESTIMONIAL_MODERATE');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#C99B2E] uppercase tracking-wider mb-1">
            <HeartHandshake className="w-4 h-4 text-[#6E1325]" />
            <span>Actions de Grâce & Gloire à Dieu • Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Témoignages & Miracles</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Circuit d'approbation : Soumission fidèle → Modération pastorale → Publication publique
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4 text-[#C99B2E]" />
          <span>Déposer un Témoignage</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filter === 'ALL' ? 'bg-[#6E1325] text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Tous ({testimonials.length})
        </button>
        <button
          onClick={() => setFilter('EN_ATTENTE')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filter === 'EN_ATTENTE' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          En attente ({testimonials.filter((t) => t.status === 'EN_ATTENTE').length})
        </button>
        <button
          onClick={() => setFilter('VALIDÉ')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filter === 'VALIDÉ' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Validés & Publiés ({testimonials.filter((t) => t.status === 'VALIDÉ').length})
        </button>
        <button
          onClick={() => setFilter('REJETÉ')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filter === 'REJETÉ' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Rejetés ({testimonials.filter((t) => t.status === 'REJETÉ').length})
        </button>
      </div>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTestimonials.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#6E1325]">
                  {t.category}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    t.status === 'VALIDÉ'
                      ? 'bg-emerald-100 text-emerald-800'
                      : t.status === 'EN_ATTENTE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#4A0E17]">{t.title}</h3>
              <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                « {t.content} »
              </p>

              {t.rejectionReason && (
                <div className="text-[11px] text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  <strong>Motif du rejet pastoral : </strong>
                  {t.rejectionReason}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Auteur :{' '}
                  <strong className="text-slate-800">
                    {t.isIdentityVisible ? t.authorName : 'Fidèle Anonyme'}
                  </strong>
                </span>
                <span>{formatDateDouala(t.createdAt)}</span>
              </div>

              {/* Moderation Controls (Only for authorized roles) */}
              {canModerate && (
                <div className="pt-2 flex items-center justify-end space-x-1.5 border-t border-slate-100">
                  {t.status !== 'VALIDÉ' && (
                    <button
                      onClick={() => handleModerate(t.id, 'VALIDÉ')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition flex items-center space-x-1"
                      title="Valider et publier publiquement"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Valider</span>
                    </button>
                  )}
                  {t.status !== 'REJETÉ' && (
                    <button
                      onClick={() => setRejectingItem(t)}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold rounded-lg transition flex items-center space-x-1"
                      title="Rejeter le témoignage"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rejeter</span>
                    </button>
                  )}
                  {t.status === 'VALIDÉ' && (
                    <button
                      onClick={() => handleModerate(t.id, 'MASQUÉ')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition flex items-center space-x-1"
                      title="Masquer de l'accueil public"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Masquer</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Testimonial Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Déposer mon Témoignage d’Action de Grâce</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMemberSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre du témoignage *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Guérison divine après accident..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                >
                  <option value="Guérison">Guérison divine</option>
                  <option value="Provision financière">Provision financière</option>
                  <option value="Famille & Paix">Restauration familiale</option>
                  <option value="Délivrance">Délivrance spirituelle</option>
                  <option value="Succès académique">Succès académique / Concours</option>
                  <option value="Autre grâce">Autre action de grâce</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Récit de ce que Dieu a fait *</label>
                <textarea
                  rows={5}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Racontez en toute simplicité et sincérité comment le Seigneur est intervenu..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="identityCheck"
                  checked={formData.isIdentityVisible}
                  onChange={(e) => setFormData({ ...formData, isIdentityVisible: e.target.checked })}
                  className="rounded text-[#6E1325] focus:ring-[#6E1325]"
                />
                <label htmlFor="identityCheck" className="text-slate-700 cursor-pointer font-medium">
                  Afficher publiquement mon prénom et nom (sinon publication anonyme)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl hover:bg-[#4A0E17] transition shadow"
                >
                  Soumettre pour modération
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-red-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Motif de Rejet du Témoignage</h3>
              <button onClick={() => setRejectingItem(null)} className="p-1 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Veuillez indiquer le motif pastoral ou doctrinal du rejet pour « {rejectingItem.title} » :
              </p>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Informations non vérifiables ou contenu non conforme..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleModerate(rejectingItem.id, 'REJETÉ', rejectionReason)}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
