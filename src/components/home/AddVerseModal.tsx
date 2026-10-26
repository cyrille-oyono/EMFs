import React, { useState } from 'react';
import { X, BookOpen, Check, RefreshCw, Sparkles, Plus, Cloud } from 'lucide-react';
import { addVerseToSupabase, seedDefaultVersesToSupabase, SupabaseVerse } from '../../services/supabase';

interface AddVerseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerseAdded: (verse: SupabaseVerse) => void;
}

export const AddVerseModal: React.FC<AddVerseModalProps> = ({ isOpen, onClose, onVerseAdded }) => {
  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('Louis Segond 1910');
  const [theme, setTheme] = useState('Foi & Espérance');
  const [meditation, setMeditation] = useState('');
  const [prayer, setPrayer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !text.trim()) {
      showToast('Veuillez renseigner la référence et le texte du verset.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addVerseToSupabase({
        reference: reference.trim(),
        text: text.trim(),
        translation: translation.trim(),
        theme: theme.trim(),
        meditation: meditation.trim(),
        prayer: prayer.trim(),
      });

      if (res.success && res.data) {
        showToast('✓ Verset ajouté avec succès dans la table Supabase !');
        onVerseAdded(res.data);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        showToast(`Erreur Supabase: ${res.error || 'Impossible d’insérer le verset'}`);
      }
    } catch (err: any) {
      showToast('Exception lors de l’ajout du verset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Voulez-vous insérer la collection complète de 10 versets bibliques fondamentaux dans la table Supabase verses ?')) {
      return;
    }

    setIsSeeding(true);
    try {
      const res = await seedDefaultVersesToSupabase();
      if (res.success) {
        showToast(`✓ ${res.count} versets insérés dans la table Supabase 'verses' !`);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        showToast(`Erreur: ${res.error || 'Échec du remplissage'}`);
      }
    } catch (err) {
      showToast('Erreur lors du remplissage.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#4A0E17] to-[#6E1325] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-[#C99B2E]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Ajouter un Verset Biblique</h3>
              <p className="text-xs text-slate-300">Table Supabase : <code className="text-[#C99B2E]">verses</code></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {feedback && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-between animate-in fade-in">
              <span>{feedback}</span>
              <Sparkles className="w-4 h-4 text-[#C99B2E]" />
            </div>
          )}

          {/* Seeding helper button */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="text-xs text-blue-900">
              <span className="font-bold block">Alimentation rapide de la table</span>
              <span className="text-[11px] text-blue-700">Insérer 10 versets bibliques classiques en 1 clic</span>
            </div>
            <button
              type="button"
              onClick={handleSeedDefaults}
              disabled={isSeeding || isSubmitting}
              className="px-3 py-1.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-xl transition shrink-0 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSeeding ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-[#C99B2E]" />
              )}
              <span>Peupler Table</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Référence Biblique *
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Jean 3:16, Josué 1:9"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Version / Traduction
              </label>
              <input
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Ex: Louis Segond 1910"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Texte du Verset *
            </label>
            <textarea
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="« Car Dieu a tant aimé le monde qu’il a donné son Fils unique... »"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Thème Spirituel
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Foi & Victoire, Espérance, Amour"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Méditation Pastorale (Optionnel)
            </label>
            <textarea
              rows={2}
              value={meditation}
              onChange={(e) => setMeditation(e.target.value)}
              placeholder="Courte exhortation ou application spirituelle pratique..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Prière Inspirée (Optionnel)
            </label>
            <textarea
              rows={2}
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              placeholder="Prière courte guidant le fidèle..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] text-xs font-black rounded-xl transition shadow flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Enregistrer dans Supabase</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
