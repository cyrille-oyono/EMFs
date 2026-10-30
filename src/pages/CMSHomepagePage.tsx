import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  Eye,
  Send,
  History,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  EyeOff,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Edit3,
  RotateCcw,
  Share2,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Camera,
  Smartphone,
  Trash2,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { isSupabaseConfigured } from '../services/supabase';
import { compressImageFile } from '../utils/mediaUpload';
import {
  HomepageSection,
  HomepageCMSState,
  HomepageRevision,
  HomepageCarouselSlide,
  WeeklyProgram,
} from '../types';
import { formatDateDouala } from '../utils/formatters';
import { ManageCarouselModal } from '../components/home/ManageCarouselModal';
import { ManageWeeklyProgramsModal } from '../components/home/ManageWeeklyProgramsModal';

interface CMSHomepagePageProps {
  onPreviewPublic: () => void;
  onOpenPublish?: () => void;
}

export const CMSHomepagePage: React.FC<CMSHomepagePageProps> = ({ onPreviewPublic, onOpenPublish }) => {
  const { currentUser, settings } = useAuth();
  const isPastorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  if (!isPastorOrAdmin) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#C99B2E] border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
          <Globe className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-[#4A0E17]">Accès Réservé au CMS Admin & Pastoral</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          La modification du contenu et de la structure du portail public est réservée exclusivement à l'administrateur et au pasteur.
        </p>
        <button
          onClick={onPreviewPublic}
          className="px-4 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
        >
          Retourner au Portail Public
        </button>
      </div>
    );
  }
  const [cmsState, setCmsState] = useState<HomepageCMSState | null>(null);
  const [activeSections, setActiveSections] = useState<HomepageSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<HomepageSection | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [notification, setNotification] = useState<string | null>(null);
  const [carouselSlides, setCarouselSlides] = useState<HomepageCarouselSlide[]>([]);
  const [weeklyPrograms, setWeeklyPrograms] = useState<WeeklyProgram[]>([]);
  const [isCarouselModalOpen, setIsCarouselModalOpen] = useState(false);
  const [carouselModalCreateMode, setCarouselModalCreateMode] = useState(false);
  const [isWeeklyProgramsModalOpen, setIsWeeklyProgramsModalOpen] = useState(false);
  const [weeklyProgramsModalCreateMode, setWeeklyProgramsModalCreateMode] = useState(false);
  const cmsCameraInputRef = React.useRef<HTMLInputElement>(null);
  const cmsGalleryInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleCMSImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner un fichier image valide.');
      return;
    }
    try {
      setIsUploadingImage(true);
      // Dimensions augmentées à 2560x1920 (Haute Définition / 2K) pour un affichage éclatant en grand format
      const compressed = await compressImageFile(file, 2560, 1920, 0.88);
      handleFieldChange('imageUrl', compressed.dataUrl);
      showToast('✓ Photo haute résolution chargée depuis le téléphone et optimisée !');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du traitement de la photo.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    loadCMS();
  }, []);

  const loadCMS = async () => {
    const [state, slides, progs] = await Promise.all([
      apiClient.getCMSState(),
      apiClient.getCarouselSlides(),
      apiClient.getWeeklyPrograms(),
    ]);
    setCmsState(state);
    setCarouselSlides(slides);
    setWeeklyPrograms(progs);
    setActiveSections(JSON.parse(JSON.stringify(state.draftSections)));
    if (state.draftSections.length > 0 && !selectedSection) {
      setSelectedSection(state.draftSections[0]);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Reordering sections: Move Up
  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...activeSections];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    // update positions
    updated.forEach((s, idx) => (s.position = idx + 1));
    setActiveSections(updated);
  };

  // Reordering sections: Move Down
  const moveDown = (index: number) => {
    if (index === activeSections.length - 1) return;
    const updated = [...activeSections];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    updated.forEach((s, idx) => (s.position = idx + 1));
    setActiveSections(updated);
  };

  // Toggle Visibility
  const toggleVisibility = (index: number) => {
    const updated = [...activeSections];
    updated[index].isVisible = !updated[index].isVisible;
    setActiveSections(updated);
  };

  // Update selected section fields
  const handleFieldChange = (field: keyof HomepageSection, val: any) => {
    if (!selectedSection) return;
    const updatedSec = { ...selectedSection, [field]: val };
    setSelectedSection(updatedSec);

    const updatedList = activeSections.map((s) => (s.id === updatedSec.id ? updatedSec : s));
    setActiveSections(updatedList);
  };

  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  // Synchronisation forcée directe avec Supabase
  const handleSyncToSupabase = async () => {
    if (!currentUser) return;
    try {
      setIsSyncingSupabase(true);
      await apiClient.saveDraftSections(activeSections, currentUser);
      const res = await apiClient.syncFullCMSToSupabase(currentUser);
      if (res.success) {
        showToast('✓ Contenu des pages synchronisé dans Supabase avec succès !');
      } else {
        showToast(res.error || 'Erreur lors de la synchronisation Supabase');
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la synchronisation Supabase');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!currentUser) return;
    const updated = await apiClient.saveDraftSections(activeSections, currentUser);
    setCmsState(updated);
    showToast('✓ Brouillon enregistré et synchronisé avec Supabase.');
  };

  // Publish to Live
  const handlePublish = async () => {
    if (!currentUser) return;
    await apiClient.saveDraftSections(activeSections, currentUser);
    const published = await apiClient.publishCMS(currentUser);
    setCmsState(published);
    showToast('🚀 Version publiée en direct et synchronisée dans Supabase pour tous les visiteurs !');
  };

  // Restore Revision
  const handleRestore = async (revId: string) => {
    if (!currentUser) return;
    const restored = await apiClient.restoreCMSRevision(revId, currentUser);
    if (restored) {
      setCmsState(restored);
      setActiveSections(JSON.parse(JSON.stringify(restored.draftSections)));
      setSelectedSection(restored.draftSections[0]);
      showToast('✓ Version antérieure restaurée et synchronisée avec succès.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header and Workflow Banner */}
      <div className="bg-[#4A0E17] rounded-2xl p-6 text-white shadow-xl border border-[#C99B2E]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#C99B2E]/20 text-[#C99B2E] px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-[#C99B2E]/30">
            <Globe className="w-3.5 h-3.5" />
            <span>Administration • CMS de la Page d’Accueil</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Gestionnaire de Contenu de l’Accueil</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Modifiez les sections, textes, boutons, images et l’ordre d’affichage de la page d’accueil publique sans modifier le code source.
          </p>
          <div className="mt-2.5 flex items-center space-x-2 text-[11px] text-amber-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isSupabaseConfigured()
                ? 'Connecté à Supabase : les publications sont visibles en direct par tous les fidèles et visiteurs.'
                : 'Mode local : configurez Supabase pour la synchronisation en ligne.'}
            </span>
          </div>
        </div>

        {/* 3-Step Workflow Buttons: Brouillon -> Prévisualisation -> Publication */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveDraft}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 flex items-center space-x-1.5"
            title="Enregistrer le brouillon"
          >
            <Save className="w-4 h-4 text-[#C99B2E]" />
            <span>Enregistrer brouillon</span>
          </button>

          <button
            onClick={onPreviewPublic}
            className="px-3 py-2 rounded-xl bg-blue-600/60 hover:bg-blue-600 text-white text-xs font-bold transition border border-blue-400 flex items-center space-x-1.5 cursor-pointer"
            title="Prévisualiser sur le site public"
          >
            <Eye className="w-4 h-4" />
            <span>Prévisualiser</span>
          </button>

          {isSupabaseConfigured() && (
            <button
              onClick={handleSyncToSupabase}
              disabled={isSyncingSupabase}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-[#C99B2E]/30 hover:bg-[#C99B2E]/40 text-amber-300 text-xs font-bold transition border border-[#C99B2E]/50 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Synchroniser immédiatement tout le contenu avec Supabase"
            >
              {isSyncingSupabase ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C99B2E]" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-[#C99B2E]" />
              )}
              <span>{isSyncingSupabase ? 'Synchronisation...' : 'Synchroniser Supabase'}</span>
            </button>
          )}

          {onOpenPublish && (
            <button
              onClick={onOpenPublish}
              className="px-3 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold transition border border-emerald-400 flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Publication Web Gratuite, QR Code et Partage"
            >
              <Share2 className="w-4 h-4 text-emerald-200" />
              <span>Publication Web</span>
            </button>
          )}

          <button
            onClick={handlePublish}
            className="px-4 py-2 rounded-xl bg-[#C99B2E] text-[#4A0E17] hover:bg-amber-400 text-xs font-black transition shadow-lg flex items-center space-x-1.5 cursor-pointer"
            title="Publier en direct pour les visiteurs et synchroniser dans Supabase"
          >
            <Send className="w-4 h-4" />
            <span>Publier en direct</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('editor')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'editor'
              ? 'border-[#6E1325] text-[#6E1325]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Éditeur des Sections (10 sections)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'history'
              ? 'border-[#6E1325] text-[#6E1325]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historique des Versions & Restauration</span>
        </button>
      </div>

      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Sections List with Up/Down and Visibility Toggles */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider">
                Ordre & Visibilité des Sections
              </span>
              <span className="text-[11px] text-slate-400">
                Utilisez les flèches pour réorganiser
              </span>
            </div>

            <div className="space-y-2">
              {activeSections.map((sec, index) => {
                const isSelected = selectedSection?.id === sec.id;
                return (
                  <div
                    key={sec.id}
                    onClick={() => setSelectedSection(sec)}
                    className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#6E1325] bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{sec.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">#{sec.key}</span>
                      </div>
                    </div>

                    {/* Reorder and Visibility Actions */}
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleVisibility(index)}
                        className={`p-1 rounded hover:bg-slate-100 transition ${
                          sec.isVisible ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                        title={sec.isVisible ? 'Section visible' : 'Section masquée'}
                      >
                        {sec.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === activeSections.length - 1}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Section Field Editor */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            {selectedSection ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-[#4A0E17]">
                      Modifier : {selectedSection.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">Clé système : {selectedSection.key}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedSection.isVisible
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedSection.isVisible ? 'Affichée publiquement' : 'Masquée'}
                  </span>
                </div>

                {/* Direct Carousel Slide Management Panel */}
                {selectedSection.key === 'carousel' && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-blue-50/60 rounded-2xl border border-[#C99B2E]/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-[#C99B2E] shrink-0" />
                        <h4 className="text-xs font-black text-[#4A0E17]">
                          Diapositives du Carrousel d'Accueil ({carouselSlides.length})
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {carouselSlides.filter((s) => s.isActive).length} active(s) sur le portail
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Ce carrousel défile en haut de la page d'accueil avec vos photos, badges, titres et boutons personnalisés. Vous pouvez ajouter une nouvelle diapositive avec photo ou gérer les diapositives existantes.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCarouselModalCreateMode(true);
                          setIsCarouselModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-[#C99B2E]" />
                        <span>+ Ajouter une Diapositive au Carrousel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCarouselModalCreateMode(false);
                          setIsCarouselModalOpen(true);
                        }}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-[#4A0E17] text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-slate-500" />
                        <span>Gérer toutes les Diapositives ({carouselSlides.length})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Direct Weekly Programs Management Panel */}
                {selectedSection.key === 'services' && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-blue-50/60 rounded-2xl border border-[#C99B2E]/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-[#C99B2E] shrink-0" />
                        <h4 className="text-xs font-black text-[#4A0E17]">
                          Programmes & Cultes Hebdomadaires ({weeklyPrograms.length})
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {weeklyPrograms.filter((p) => p.isActive).length} actif(s) sur le portail public
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Ces rendez-vous sont mis en valeur sur la page d'accueil avec les jours, horaires, lieux (Grand Temple Akon, etc.), officiants et public cible. Vous pouvez ajouter un nouveau culte ou modifier ceux existants.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setWeeklyProgramsModalCreateMode(true);
                          setIsWeeklyProgramsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-[#C99B2E]" />
                        <span>+ Ajouter un Programme Hebdomadaire</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWeeklyProgramsModalCreateMode(false);
                          setIsWeeklyProgramsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-[#4A0E17] text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-[#C99B2E]" />
                        <span>Gérer tous les Rendez-vous ({weeklyPrograms.length})</span>
                      </button>
                    </div>

                    {/* Quick mini-summary chips */}
                    {weeklyPrograms.length > 0 && (
                      <div className="pt-2 border-t border-[#C99B2E]/20 flex flex-wrap gap-1.5">
                        {weeklyPrograms.slice(0, 6).map((prog) => (
                          <span
                            key={prog.id}
                            className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 flex items-center space-x-1"
                          >
                            <span className="font-black text-[#4A0E17]">{prog.dayOfWeek} :</span>
                            <span className="truncate max-w-[140px]">{prog.title}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Direct Events & Interactive Calendar Info Panel */}
                {selectedSection.key === 'events' && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-[#6E1325] shrink-0" />
                        <h4 className="text-xs font-black text-[#4A0E17]">
                          Calendrier Interactif & Événements Spéciaux
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        Vues Mois & Semaine Actives
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Cette section intègre sur la page d'accueil le composant de <strong>Calendrier Interactif</strong> : les fidèles et visiteurs peuvent explorer les rassemblements par <strong>Mois</strong>, par <strong>Semaine</strong> ou sous forme d'<strong>Agenda chronologique</strong>. Elle combine automatiquement les événements datés et les cultes réguliers, avec bouton d'export direct vers Google Agenda et fichiers <code>.ics</code> universels.
                    </p>
                  </div>
                )}

                {/* Direct Footer Synchronization & Church Info Panel */}
                {selectedSection.key === 'footer' && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
                        <h4 className="text-xs font-black text-[#4A0E17]">
                          Pied de Page Intelligent & Synchronisé en Direct
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Synchronisation Temps Réel Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Le pied de page d’accueil est synchronisé dynamiquement avec les paramètres généraux de l'église (nom, slogan, adresse, téléphone, email, réseaux sociaux) et avec l'agenda (cultes réguliers hebdomadaires et événements à venir). Toute modification apportée dans les paramètres ou les programmes est répercutée instantanément.
                    </p>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Titre Principal de la Section
                  </label>
                  <input
                    type="text"
                    value={selectedSection.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="Titre accrocheur..."
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sous-titre / Slogan de Section
                  </label>
                  <input
                    type="text"
                    value={selectedSection.subtitle || ''}
                    onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="Sous-titre explicatif..."
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Texte Descriptif / Message
                  </label>
                  <textarea
                    rows={4}
                    value={selectedSection.content || ''}
                    onChange={(e) => handleFieldChange('content', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="Contenu textuel..."
                  />
                </div>

                {/* Buttons Config */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Bouton Principal (Texte)
                    </label>
                    <input
                      type="text"
                      value={selectedSection.primaryButtonText || ''}
                      onChange={(e) => handleFieldChange('primaryButtonText', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                      placeholder="Ex: Rejoindre nos cultes"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Lien Bouton Principal
                    </label>
                    <input
                      type="text"
                      value={selectedSection.primaryButtonLink || ''}
                      onChange={(e) => handleFieldChange('primaryButtonLink', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                      placeholder="Ex: #services ou /events"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Bouton Secondaire (Texte)
                    </label>
                    <input
                      type="text"
                      value={selectedSection.secondaryButtonText || ''}
                      onChange={(e) => handleFieldChange('secondaryButtonText', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                      placeholder="Ex: Contacter le pasteur"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Lien Bouton Secondaire
                    </label>
                    <input
                      type="text"
                      value={selectedSection.secondaryButtonLink || ''}
                      onChange={(e) => handleFieldChange('secondaryButtonLink', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                      placeholder="Ex: tel:+237699112233"
                    />
                  </div>
                </div>

                {/* Image URL & Preview */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Photo / Illustration de la Section
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => cmsCameraInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] border border-[#C99B2E]/40 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition disabled:opacity-50"
                        title="Prendre une photo avec le smartphone"
                      >
                        <Camera className="w-3 h-3 text-[#C99B2E]" />
                        <span>Photo Mobile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cmsGalleryInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#4A0E17] border border-blue-200 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition disabled:opacity-50"
                        title="Choisir dans la galerie du téléphone"
                      >
                        <Smartphone className="w-3 h-3 text-[#6E1325]" />
                        <span>Galerie</span>
                      </button>
                    </div>
                  </div>

                  <input
                    ref={cmsCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCMSImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={cmsGalleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCMSImageUpload(file);
                      e.target.value = '';
                    }}
                  />

                  <input
                    type="text"
                    value={selectedSection.imageUrl && !selectedSection.imageUrl.includes('511795409834') ? selectedSection.imageUrl : ''}
                    onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="https://... ou chargez depuis le téléphone"
                  />

                  {selectedSection.imageUrl && !selectedSection.imageUrl.includes('511795409834') && (
                    <div className="relative mt-2 h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-md">
                      <img
                        src={selectedSection.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-[#C99B2E] text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#C99B2E]/30">
                        Aperçu Grand Format
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('imageUrl', '')}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow transition cursor-pointer"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-[#6E1325] text-white text-xs font-bold rounded-xl hover:bg-[#4A0E17] transition shadow flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Sauvegarder les modifications</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Sélectionnez une section à gauche pour en modifier les éléments.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History & Revisions Tab */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#4A0E17] uppercase tracking-wider">
              Historique des Versions Publiées
            </h3>
            <p className="text-xs text-slate-500">
              Chaque publication crée un point d'instantané dans le journal. Vous pouvez revenir à tout moment à une version précédente.
            </p>
          </div>

          <div className="space-y-3">
            {cmsState?.revisions.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-[#4A0E17]">
                      Version {rev.version}
                    </span>
                    <span className="text-[10px] bg-blue-100 text-[#6E1325] px-2 py-0.5 rounded font-bold uppercase">
                      {rev.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Par <span className="font-semibold text-slate-800">{rev.authorName}</span> • {formatDateDouala(rev.createdAt, true)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {rev.sectionsSnapshot.length} sections enregistrées
                  </p>
                </div>

                <button
                  onClick={() => handleRestore(rev.id)}
                  className="px-3 py-1.5 bg-[#4A0E17] text-white text-xs font-bold rounded-lg hover:bg-[#6E1325] transition flex items-center space-x-1 shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>Restaurer cette version</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Manage Carousel Modal */}
      <ManageCarouselModal
        isOpen={isCarouselModalOpen}
        onClose={() => setIsCarouselModalOpen(false)}
        slides={carouselSlides}
        onSlidesUpdated={loadCMS}
        initialCreateMode={carouselModalCreateMode}
      />

      {/* Admin Manage Weekly Programs Modal */}
      <ManageWeeklyProgramsModal
        isOpen={isWeeklyProgramsModalOpen}
        onClose={() => setIsWeeklyProgramsModalOpen(false)}
        programs={weeklyPrograms}
        onProgramsUpdated={loadCMS}
        initialCreateMode={weeklyProgramsModalCreateMode}
      />
    </div>
  );
};
