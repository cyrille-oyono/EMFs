import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Calendar, Clock, CheckCircle, X, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { DailyBibleVerse } from '../types';
import { formatDateDouala } from '../utils/formatters';
import { addVerseToSupabase, isSupabaseConfigured } from '../services/supabase';

export const VersesPage: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [verses, setVerses] = useState<DailyBibleVerse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    reference: 'Psaumes 23:1',
    text: 'L’Éternel est mon berger : je ne manquerai de rien.',
    translation: 'Louis Segond 1910',
    meditation: '',
    prayer: '',
    type: 'MÉDITATION_ET_PRIÈRE' as any,
    status: 'PUBLIÉ' as any,
    scheduledFor: new Date().toISOString().substring(0, 10),
  });

  useEffect(() => {
    loadVerses();
  }, []);

  const loadVerses = async () => {
    const list = await apiClient.getDailyVerses();
    setVerses(list);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reference || !formData.text) return;

    await apiClient.createDailyVerse(formData, currentUser || undefined);

    if (isSupabaseConfigured()) {
      try {
        await addVerseToSupabase({
          reference: formData.reference,
          text: formData.text,
          translation: formData.translation,
          theme: formData.type || 'Méditation & Prière',
          meditation: formData.meditation,
          prayer: formData.prayer,
        });
      } catch (err) {
        console.warn('Erreur synchro verset Supabase:', err);
      }
    }

    setShowModal(false);
    showToast('Verset programmé et synchronisé avec la table Supabase.');
    loadVerses();
  };

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
            <BookOpen className="w-4 h-4 text-[#6E1325]" />
            <span>Nourriture Spirituelle Quotidienne • Africa/Douala</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Versets du Jour</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculés et affichés selon le fuseau horaire officiel du Cameroun (Africa/Douala)
          </p>
        </div>

        {hasPermission('BIBLE_VERSE_MANAGE') && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-[#C99B2E]" />
            <span>Programmer un Verset</span>
          </button>
        )}
      </div>

      {/* Verses List */}
      <div className="space-y-4">
        {verses.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#C99B2E] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Prévu pour le : {formatDateDouala(v.date)}</span>
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {v.status}
                </span>
              </div>
              <span className="text-xs font-bold text-[#6E1325]">
                {v.reference} ({v.translation})
              </span>
            </div>

            <div className="font-serif italic text-base sm:text-lg text-[#4A0E17] font-semibold pl-4 border-l-4 border-[#C99B2E] py-1">
              « {v.text} »
            </div>

            {v.meditation && (
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                <strong className="text-[#4A0E17]">Méditation pastorale : </strong>
                {v.meditation}
              </div>
            )}

            {v.prayer && (
              <div className="text-xs italic text-amber-900 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                <strong className="text-[#C99B2E]">Prière inspirée : </strong>
                « {v.prayer} »
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Program Verse Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Programmer le Verset du Jour</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d’affichage *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Référence Biblique *</label>
                  <input
                    type="text"
                    required
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Ex: Jérémie 29:11"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Texte de l’Écriture *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Texte du verset..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Méditation / Pensée pastorale</label>
                <textarea
                  rows={3}
                  value={formData.meditation}
                  onChange={(e) => setFormData({ ...formData, meditation: e.target.value })}
                  placeholder="Comment appliquer ce verset dans notre vie à Sangmelima..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prière du jour</label>
                <textarea
                  rows={2}
                  value={formData.prayer}
                  onChange={(e) => setFormData({ ...formData, prayer: e.target.value })}
                  placeholder="Seigneur Jésus, en ce jour..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl hover:bg-[#4A0E17] shadow"
                >
                  Programmer le verset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
