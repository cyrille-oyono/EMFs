import React, { useState, useEffect } from 'react';
import {
  Globe,
  X,
  Save,
  CheckCircle,
  Eye,
  Sliders,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  BookOpen,
  Film,
  Layers,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { HomepageSection } from '../../types';

interface DashboardHomepageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreviewPublic: () => void;
  onSuccess?: () => void;
}

export const DashboardHomepageEditorModal: React.FC<DashboardHomepageEditorModalProps> = ({
  isOpen,
  onClose,
  onPreviewPublic,
  onSuccess,
}) => {
  const { currentUser, settings } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [form, setForm] = useState({
    heroTitle: 'Bienvenue à l’Église Missionnaire de la Foi de Sangmelima',
    heroSubtitle: 'Une église vivante au cœur du Sud Cameroun, enracinée dans la Parole et tournée vers les nations.',
    presentationTitle: 'Qui Sommes-Nous ?',
    presentationContent:
      'Implantée au quartier Akon à Sangmelima, l’Église Missionnaire de la Foi rassemble des fidèles passionnés de Christ, dédiés à la prière, à l’enseignement biblique et à l’amour fraternel.',
    churchPhone: settings.phone || '+237 699 00 11 22',
    churchAddress: settings.address || 'Quartier Akon, Route Principale, Sangmelima',
    visibilities: {
      hero: true,
      presentation: true,
      services: true,
      events: true,
      verse: true,
      testimonials: true,
      media: true,
      cta: true,
      footer: true,
    } as Record<string, boolean>,
  });

  useEffect(() => {
    if (isOpen) {
      loadSections();
    }
  }, [isOpen]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const cms = await apiClient.getCMSState();
      const sections = cms.publishedSections || [];
      const hero = sections.find((s) => s.key === 'hero');
      const pres = sections.find((s) => s.key === 'presentation');

      const vis: Record<string, boolean> = {};
      sections.forEach((s) => {
        vis[s.key] = s.isVisible;
      });

      setForm((prev) => ({
        ...prev,
        heroTitle: hero?.title || prev.heroTitle,
        heroSubtitle: hero?.subtitle || prev.heroSubtitle,
        presentationTitle: pres?.title || prev.presentationTitle,
        presentationContent: pres?.content || prev.presentationContent,
        churchPhone: settings.phone,
        churchAddress: settings.address,
        visibilities: { ...prev.visibilities, ...vis },
      }));
    } catch (err) {
      console.error('Failed to load homepage elements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.quickUpdateHomepage(
        {
          heroTitle: form.heroTitle,
          heroSubtitle: form.heroSubtitle,
          presentationTitle: form.presentationTitle,
          presentationContent: form.presentationContent,
          churchPhone: form.churchPhone,
          churchAddress: form.churchAddress,
          visibleSections: form.visibilities,
        },
        currentUser || undefined
      );

      setNotification('✓ Page d’accueil mise à jour et publiée en direct !');
      setTimeout(() => {
        setNotification(null);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save homepage modifications:', err);
      alert('Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key: string) => {
    setForm((prev) => ({
      ...prev,
      visibilities: {
        ...prev.visibilities,
        [key]: !prev.visibilities[key],
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#4A0E17] text-white px-6 py-5 flex items-center justify-between border-b border-[#C99B2E]/40 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C99B2E]/20 border border-[#C99B2E]/40 flex items-center justify-center text-[#C99B2E]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black uppercase tracking-wide text-white">
                  Éléments de la Page d’Accueil
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-400/40">
                  En Direct
                </span>
              </div>
              <p className="text-xs text-amber-200/90 truncate">
                Modifiez les textes, coordonnées et sections de la vitrine paroissiale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {notification && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Hero Section Texts */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#C99B2E]" />
                  <span>1. En-Tête & Message Principal (Bannière Hero)</span>
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre d'Accueil Principal :
                </label>
                <input
                  type="text"
                  required
                  value={form.heroTitle}
                  onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sous-titre / Slogan de l’église :
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.heroSubtitle}
                  onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                />
              </div>
            </div>

            {/* 2. Presentation Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-[#C99B2E]" />
                <span>2. Présentation de la Communauté</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre de la section présentation :
                </label>
                <input
                  type="text"
                  required
                  value={form.presentationTitle}
                  onChange={(e) => setForm({ ...form, presentationTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Texte de présentation générale :
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.presentationContent}
                  onChange={(e) => setForm({ ...form, presentationContent: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                />
              </div>
            </div>

            {/* 3. Church Contact & Location */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-[#C99B2E]" />
                <span>3. Coordonnées & Localisation à Sangmelima</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Téléphone Officiel :</span>
                  </label>
                  <input
                    type="text"
                    value={form.churchPhone}
                    onChange={(e) => setForm({ ...form, churchPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Adresse à Sangmelima :</span>
                  </label>
                  <input
                    type="text"
                    value={form.churchAddress}
                    onChange={(e) => setForm({ ...form, churchAddress: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Section Visibility Toggles */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-[#C99B2E]" />
                <span>4. Visibilité des Modules sur la Page d'Accueil</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Activez ou désactivez les blocs que vous souhaitez afficher aux visiteurs de la page publique :
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { key: 'hero', label: 'Bannière & Carrousel' },
                  { key: 'presentation', label: 'Présentation Église' },
                  { key: 'services', label: 'Horaires des Cultes' },
                  { key: 'media', label: 'Cultes & Vidéos YouTube' },
                  { key: 'events', label: 'Événements Paroissiaux' },
                  { key: 'verse', label: 'Verset du Jour' },
                  { key: 'testimonials', label: 'Témoignages Fidèles' },
                  { key: 'cta', label: 'Bouton Adhésion' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => toggleSection(item.key)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      form.visibilities[item.key] !== false
                        ? 'bg-white border-[#6E1325] text-[#4A0E17] shadow-xs'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        form.visibilities[item.key] !== false ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPreviewPublic();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Prévisualiser le Site Public</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#6E1325] hover:bg-[#8C182F] text-white text-xs font-bold transition shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <span>Enregistrement...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#C99B2E]" />
                      <span>Enregistrer les modifications (Supabase)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
