import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Upload,
  Cloud,
  Globe,
  Link as LinkIcon,
  Check,
  Smartphone,
  ExternalLink,
  GraduationCap,
  Users,
  BookOpen,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { HomepageCarouselSlide } from '../../types';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

interface ManageCarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: HomepageCarouselSlide[];
  onSlidesUpdated: () => void;
  initialCreateMode?: boolean;
}

// Google Drive helper
const extractDriveId = (url: string): string | null => {
  if (!url) return null;
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

// Ready-made curated church presets for fast slide creation
const CHURCH_SLIDE_PRESETS = [
  {
    badge: 'Culte & Louange',
    title: 'Vivez la Présence et la Gloire de Dieu',
    subtitle: 'Chaque dimanche dès 09h00, rejoignez une assemblée fervente à Akon, Sangmelima.',
    description: 'Une communauté chrétienne dynamique au cœur du Sud-Cameroun marchant par la foi.',
    imageUrl: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=1920&q=80',
    primaryButtonText: 'Découvrir nos Cultes',
    primaryButtonLink: '#services',
    secondaryButtonText: 'Médias du Culte',
    secondaryButtonLink: '#dernier-culte',
  },
  {
    badge: 'Grande Veillée',
    title: 'Nuit de Prière, Signes & Prodiges',
    subtitle: 'Combat spirituel, brisement des chaînes et effusion du Saint-Esprit.',
    description: 'Veillées d’onction et de miracles chaque premier vendredi du mois au temple.',
    imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1920&q=80',
    primaryButtonText: 'Programme des Cultes',
    primaryButtonLink: '#services',
    secondaryButtonText: 'Déposer une Prière',
    secondaryButtonLink: '#priere',
  },
  {
    badge: 'Formation Parakletos',
    title: 'Institut Biblique Parakletos d’Akon',
    subtitle: 'Grandissez dans la connaissance biblique et préparez-vous au service chrétien.',
    description: 'Cursus pastoral, théologique et discipulat avec enseignants qualifiés.',
    imageUrl: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=1920&q=80',
    primaryButtonText: 'S’inscrire à l’Institut',
    primaryButtonLink: '/parakletos#adhesion',
    secondaryButtonText: 'Ressources & Cours',
    secondaryButtonLink: '/resources',
  },
  {
    badge: 'Jeûne & Famille',
    title: 'Bénédiction & Restauration des Foyers',
    subtitle: 'Sanctification et consécration pour des couples et des enfants affermis.',
    description: 'Cellules de maison réparties dans tous les quartiers de Sangmelima.',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1920&q=80',
    primaryButtonText: 'Cellules de Prière',
    primaryButtonLink: '/home-cells',
    secondaryButtonText: 'Guides de Prière',
    secondaryButtonLink: '/resources?cat=PRIERE',
  },
  {
    badge: 'Étude Biblique',
    title: 'Enracinés dans la Parole de Vérité',
    subtitle: 'Enseignements doctrinaux profonds chaque mercredi à 17h30 au temple.',
    description: 'Méditation suivie des Écritures pour nourrir votre foi au quotidien.',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1920&q=80',
    primaryButtonText: 'Explorer les Études',
    primaryButtonLink: '/resources',
    secondaryButtonText: 'Verset du Jour',
    secondaryButtonLink: '#verse',
  },
  {
    badge: 'Action de Grâce',
    title: 'Célébrons la Fidélité Inébranlable de Dieu',
    subtitle: 'Témoignages de délivrance, offrandes joyeuses et louanges de victoire.',
    description: 'Dieu fait de grandes choses à l’Église Missionnaire de la Foi d’Akon !',
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1920&q=80',
    primaryButtonText: 'Lire les Témoignages',
    primaryButtonLink: '#testimonials',
    secondaryButtonText: 'Donner en Ligne',
    secondaryButtonLink: '#cta',
  },
];

export interface LinkSuggestion {
  label: string;
  value: string;
  category: 'CULTES' | 'INSTITUT' | 'CELLULES' | 'RESSOURCES' | 'MEDIAS';
  suggestedButtonText: string;
  description?: string;
  isExternal?: boolean;
}

export const LINK_PRESETS: LinkSuggestion[] = [
  // --- Institut Biblique Parakletos ---
  {
    label: "Inscription Institut Biblique",
    value: "/parakletos#adhesion",
    category: 'INSTITUT',
    suggestedButtonText: "S'inscrire à l'Institut",
    description: "Formulaire d'admission officiel à l'Institut Parakletos",
  },
  {
    label: "Présentation Institut Parakletos",
    value: "/parakletos",
    category: 'INSTITUT',
    suggestedButtonText: "Découvrir l'Institut",
    description: "Cursus, enseignants et filières théologiques",
  },
  {
    label: "Espace Étudiant & Notes",
    value: "/parakletos#code-access",
    category: 'INSTITUT',
    suggestedButtonText: "Espace Étudiants",
    description: "Consultation des bulletins avec code d'accès personnel",
  },

  // --- Cellules de Prière & Intercession ---
  {
    label: "Cellules de Prière de Maison",
    value: "/home-cells",
    category: 'CELLULES',
    suggestedButtonText: "Rejoindre une Cellule",
    description: "Annuaire des cellules de prière dans les quartiers de Sangmelima",
  },
  {
    label: "Déposer une Requête de Prière",
    value: "/prayer-requests",
    category: 'CELLULES',
    suggestedButtonText: "Déposer une Prière",
    description: "Intercession communautaire et soutien pastoral direct",
  },
  {
    label: "Forum & Échanges Chrétiens",
    value: "/forum",
    category: 'CELLULES',
    suggestedButtonText: "Forum de Prière & Foi",
    description: "Partage biblique et communion entre chrétiens",
  },

  // --- Ressources Bibliques & Documents ---
  {
    label: "Bibliothèque de Ressources & Fichiers",
    value: "/resources",
    category: 'RESSOURCES',
    suggestedButtonText: "Consulter les Ressources",
    description: "Livres, brochures, fiches d'étude biblique et cantiques téléchargeables",
  },
  {
    label: "Guides de Prière & Jeûne",
    value: "/resources?cat=PRIERE",
    category: 'RESSOURCES',
    suggestedButtonText: "Guides de Prière & Méditations",
    description: "Plans de lecture, programmes de jeûne et manuels d'édification",
  },
  {
    label: "Enseignements & Études Bibliques",
    value: "/resources?cat=ETUDE_BIBLIQUE",
    category: 'RESSOURCES',
    suggestedButtonText: "Études Bibliques Complètes",
    description: "Supports doctrinaux et thématiques pour affranchir la foi",
  },
  {
    label: "Verset du Jour & Méditation",
    value: "#verse",
    category: 'RESSOURCES',
    suggestedButtonText: "Méditer le Verset du Jour",
    description: "Passage quotidien commenté avec pensée du pasteur",
  },

  // --- Cultes, Événements & Médias ---
  {
    label: "Horaires & Cultes au Temple",
    value: "#services",
    category: 'CULTES',
    suggestedButtonText: "Découvrir nos Cultes",
    description: "Rendez-vous dominicaux et réunions en semaine au temple d'Akon",
  },
  {
    label: "Agenda & Calendrier Spirituel",
    value: "#events",
    category: 'CULTES',
    suggestedButtonText: "Voir l'Agenda Complet",
    description: "Veillées, séminaires, retraites et conventions de l'Église",
  },
  {
    label: "Photos & Vidéos du Dernier Culte",
    value: "#dernier-culte",
    category: 'MEDIAS',
    suggestedButtonText: "Médias du Dernier Culte",
    description: "Reportage visuel et prédication dominicale",
  },
  {
    label: "Médiathèque Complète (Photos & Vidéos)",
    value: "/media-gallery",
    category: 'MEDIAS',
    suggestedButtonText: "Galerie Multimédia",
    description: "Albums souvenirs, cultes spéciaux et archives vidéo",
  },
  {
    label: "Témoignages des Fidèles",
    value: "#testimonials",
    category: 'CULTES',
    suggestedButtonText: "Lire les Témoignages",
    description: "Récits de délivrance, miracles et reconnaissance envers Dieu",
  },
  {
    label: "Présentation de l'Église (Akon)",
    value: "#about",
    category: 'CULTES',
    suggestedButtonText: "Qui Sommes-Nous ?",
    description: "Vision, collège pastoral et implantation à Sangmelima",
  },
  {
    label: "Rejoindre la Communauté EMF",
    value: "#cta",
    category: 'CULTES',
    suggestedButtonText: "Rejoindre notre Communauté",
    description: "Accueil des nouveaux convertis et accompagnement fraternel",
  },
];

export const ManageCarouselModal: React.FC<ManageCarouselModalProps> = ({
  isOpen,
  onClose,
  slides,
  onSlidesUpdated,
  initialCreateMode = false,
}) => {
  const { currentUser } = useAuth();
  const [editingSlide, setEditingSlide] = useState<HomepageCarouselSlide | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [imageSourceTab, setImageSourceTab] = useState<'UPLOAD' | 'DRIVE' | 'WEB' | 'PRESETS'>('PRESETS');
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [previewTab, setPreviewTab] = useState<'form' | 'preview'>('form');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<HomepageCarouselSlide, 'id'>>({
    badge: 'Culte & Louange',
    title: '',
    subtitle: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=1920&q=80',
    primaryButtonText: 'Découvrir nos Cultes',
    primaryButtonLink: '#services',
    secondaryButtonText: 'Médias du Culte',
    secondaryButtonLink: '#dernier-culte',
    isActive: true,
    order: slides.length + 1,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialCreateMode) {
        handleStartCreate();
      } else {
        setIsCreating(false);
        setEditingSlide(null);
      }
    }
  }, [isOpen, initialCreateMode]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleStartCreate = () => {
    setEditingSlide(null);
    setFormData({
      badge: 'Culte & Louange',
      title: '',
      subtitle: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=1920&q=80',
      primaryButtonText: 'Découvrir nos Cultes',
      primaryButtonLink: '#services',
      secondaryButtonText: 'Médias du Culte',
      secondaryButtonLink: '#dernier-culte',
      isActive: true,
      order: slides.length + 1,
    });
    setImageSourceTab('PRESETS');
    setDriveUrlInput('');
    setPreviewTab('form');
    setIsCreating(true);
  };

  const handleStartEdit = (slide: HomepageCarouselSlide) => {
    setIsCreating(false);
    setEditingSlide(slide);
    setFormData({
      badge: slide.badge,
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description || '',
      imageUrl: slide.imageUrl,
      primaryButtonText: slide.primaryButtonText || '',
      primaryButtonLink: slide.primaryButtonLink || '',
      secondaryButtonText: slide.secondaryButtonText || '',
      secondaryButtonLink: slide.secondaryButtonLink || '',
      isActive: slide.isActive,
      order: slide.order,
    });
    setImageSourceTab(slide.imageUrl.startsWith('data:') ? 'UPLOAD' : 'WEB');
    setPreviewTab('form');
  };

  // Local File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
      showToast('Image chargée avec succès depuis votre appareil.');
    };
    reader.readAsDataURL(file);
  };

  // Google Drive link conversion
  const handleApplyDriveLink = () => {
    const fileId = extractDriveId(driveUrlInput);
    if (!fileId) {
      alert('Lien Google Drive non reconnu. Veuillez coller un lien de partage valide contenant l’identifiant du fichier.');
      return;
    }
    // High-resolution Google Drive image thumbnail URL
    const convertedUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
    setFormData((prev) => ({ ...prev, imageUrl: convertedUrl }));
    showToast('Lien Google Drive converti en image de carrousel !');
  };

  // Apply Church Preset
  const handleApplyPreset = (preset: typeof CHURCH_SLIDE_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      badge: preset.badge,
      title: preset.title,
      subtitle: preset.subtitle,
      description: preset.description,
      imageUrl: preset.imageUrl,
      primaryButtonText: preset.primaryButtonText,
      primaryButtonLink: preset.primaryButtonLink,
      secondaryButtonText: preset.secondaryButtonText,
      secondaryButtonLink: preset.secondaryButtonLink,
    }));
    showToast(`Préréglage « ${preset.badge} » appliqué.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Veuillez renseigner un grand titre pour la diapositive.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      alert('Veuillez choisir ou importer une image de fond pour le carrousel.');
      return;
    }

    try {
      if (isCreating) {
        await apiClient.createCarouselSlide(formData, currentUser || undefined);
        showToast('Nouvelle diapositive ajoutée au carrousel d’accueil !');
      } else if (editingSlide) {
        await apiClient.updateCarouselSlide(editingSlide.id, formData, currentUser || undefined);
        showToast('Diapositive mise à jour.');
      }

      setIsCreating(false);
      setEditingSlide(null);
      onSlidesUpdated();
    } catch (err) {
      console.error('Error saving slide:', err);
      alert('Une erreur est survenue lors de l’enregistrement de la diapositive.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Confirmer la suppression de la diapositive "${title}" du carrousel ?`)) {
      await apiClient.deleteCarouselSlide(id, currentUser || undefined);
      showToast('Diapositive supprimée.');
      onSlidesUpdated();
    }
  };

  const handleToggleActive = async (slide: HomepageCarouselSlide) => {
    await apiClient.updateCarouselSlide(slide.id, { isActive: !slide.isActive }, currentUser || undefined);
    showToast(slide.isActive ? 'Diapositive masquée du portail.' : 'Diapositive activée et visible.');
    onSlidesUpdated();
  };

  // Move slide up/down
  const handleMoveOrder = async (slide: HomepageCarouselSlide, direction: 'UP' | 'DOWN') => {
    const sorted = [...slides].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === slide.id);
    if (index === -1) return;

    if (direction === 'UP' && index > 0) {
      const prev = sorted[index - 1];
      await apiClient.updateCarouselSlide(slide.id, { order: prev.order }, currentUser || undefined);
      await apiClient.updateCarouselSlide(prev.id, { order: slide.order }, currentUser || undefined);
      onSlidesUpdated();
    } else if (direction === 'DOWN' && index < sorted.length - 1) {
      const next = sorted[index + 1];
      await apiClient.updateCarouselSlide(slide.id, { order: next.order }, currentUser || undefined);
      await apiClient.updateCarouselSlide(next.id, { order: slide.order }, currentUser || undefined);
      onSlidesUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4A0E17] to-[#6E1325] px-6 py-4 text-white flex items-center justify-between border-b border-[#C99B2E]/30 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C99B2E]/20 text-[#C99B2E] flex items-center justify-center border border-[#C99B2E]/40 shadow-xs">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                Gestion & Ajout au Carrousel d'Accueil
              </h3>
              <p className="text-[11px] text-slate-300">
                Personnalisez les bannières immersives présentées aux visiteurs et fidèles.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isCreating && !editingSlide && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3.5 py-1.5 rounded-xl bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter une diapositive</span>
                <span className="sm:hidden">Ajouter</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-6 py-2.5 text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-top-1">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Main Top Header when not editing */}
          {!isCreating && !editingSlide && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-black text-[#4A0E17] flex items-center space-x-2">
                  <span>Diapositives Actives sur la Page d'Accueil</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#6E1325] text-white">
                    {slides.length} au total
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ajoutez, réorganisez, modifiez ou masquez les éléments qui défilent en grand écran.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-4 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-2 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4 text-[#C99B2E]" />
                <span>+ Ajouter une Diapositive</span>
              </button>
            </div>
          )}

          {/* Form Create / Edit Slide */}
          {(isCreating || editingSlide) && (
            <form onSubmit={handleSubmit} className="bg-slate-50 p-4 sm:p-6 rounded-3xl border border-slate-200 space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C99B2E] animate-pulse" />
                  <span className="font-black text-sm text-[#4A0E17]">
                    {isCreating ? 'Ajouter une Nouvelle Diapositive au Carrousel' : `Modifier la Diapositive : "${editingSlide?.title}"`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Switch between form and live preview */}
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('form')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        previewTab === 'form' ? 'bg-[#6E1325] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Édition
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('preview')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        previewTab === 'preview' ? 'bg-[#6E1325] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Aperçu
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingSlide(null);
                    }}
                    className="text-slate-400 hover:text-rose-600 font-bold p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                    title="Fermer sans enregistrer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {previewTab === 'preview' ? (
                /* LIVE PREVIEW OF THE CAROUSEL SLIDE */
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                    <span>Aperçu en conditions réelles de la diapositive :</span>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('form')}
                      className="text-[#6E1325] font-bold underline hover:text-[#4A0E17] cursor-pointer"
                    >
                      Revenir au formulaire d'édition
                    </button>
                  </div>

                  <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 text-white min-h-[360px] flex items-center p-6 sm:p-10 shadow-xl border border-slate-700">
                    {/* Background image */}
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Aperçu du carrousel"
                        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.62] contrast-[1.08]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#4A0E17] to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071d37] via-[#4A0E17]/60 to-black/35" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4A0E17]/90 via-[#4A0E17]/50 to-transparent" />

                    {/* Slide Content */}
                    <div className="relative z-10 max-w-xl space-y-3 text-left">
                      {formData.badge && (
                        <div className="inline-flex items-center space-x-1.5 bg-[#C99B2E] text-[#4A0E17] px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow">
                          <Sparkles className="w-3 h-3 fill-current" />
                          <span>{formData.badge}</span>
                        </div>
                      )}
                      <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight text-white drop-shadow">
                        {formData.title || 'Titre de la Diapositive'}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                        {formData.subtitle || 'Sous-titre et message d’accueil...'}
                      </p>
                      {formData.description && (
                        <p className="text-[11px] text-slate-300 italic border-l-2 border-[#C99B2E] pl-2.5 py-0.5">
                          « {formData.description} »
                        </p>
                      )}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {formData.primaryButtonText && (
                          <div className="px-4 py-2 rounded-xl bg-[#C99B2E] text-[#4A0E17] font-black text-xs shadow flex items-center space-x-1.5">
                            <span>{formData.primaryButtonText}</span>
                          </div>
                        )}
                        {formData.secondaryButtonText && (
                          <div className="px-4 py-2 rounded-xl bg-white/20 text-white font-bold text-xs border border-white/30 backdrop-blur-md">
                            <span>{formData.secondaryButtonText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORM FIELDS */
                <>
                  {/* Badge & Order */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Badge Thématique *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        placeholder="Ex: Culte & Louange, Grande Veillée, Étude Biblique..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
                      />
                      {/* Quick Badge Suggestions */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Culte & Louange', 'Grande Veillée', 'Étude Biblique', 'Jeûne & Prière', 'Action de Grâce', 'Parakletos'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setFormData({ ...formData, badge: b })}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                              formData.badge === b
                                ? 'bg-[#4A0E17] text-white border-[#4A0E17]'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Ordre d'affichage
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Position dans le carrousel (1 = en premier)
                      </span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Grand Titre Principal *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Vivez la Présence et la Gloire de Dieu à Akon"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-black text-sm text-[#4A0E17]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Sous-titre explicatif *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        placeholder="Ex: Chaque dimanche dès 09h00, rejoignez une assemblée fervente et fraternelle..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Citation / Mot d'encouragement (optionnel)
                      </label>
                      <input
                        type="text"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ex: « Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux »"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white italic text-slate-700"
                      />
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* SOURCE D'IMAGE DU CARROUSEL (Préréglages, Téléphone, Google Drive, Web) */}
                  {/* ======================================================== */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block font-black text-xs text-[#4A0E17]">
                        Image de Fond du Carrousel *
                      </label>
                      {/* Image Source Mode Tabs */}
                      <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setImageSourceTab('PRESETS')}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                            imageSourceTab === 'PRESETS'
                              ? 'bg-[#C99B2E] text-[#4A0E17] shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Préréglages Église</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageSourceTab('UPLOAD')}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                            imageSourceTab === 'UPLOAD'
                              ? 'bg-[#6E1325] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>Téléphone / Fichier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageSourceTab('DRIVE')}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                            imageSourceTab === 'DRIVE'
                              ? 'bg-blue-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Cloud className="w-3 h-3" />
                          <span>Google Drive</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageSourceTab('WEB')}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                            imageSourceTab === 'WEB'
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Globe className="w-3 h-3" />
                          <span>Lien Web</span>
                        </button>
                      </div>
                    </div>

                    {/* TAB: PRESETS */}
                    {imageSourceTab === 'PRESETS' && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-500">
                          Cliquez sur un modèle d’image préconfiguré pour remplir automatiquement l’arrière-plan et le style :
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {CHURCH_SLIDE_PRESETS.map((preset, idx) => {
                            const isSelected = formData.imageUrl === preset.imageUrl;
                            return (
                              <div
                                key={idx}
                                onClick={() => handleApplyPreset(preset)}
                                className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition p-1.5 flex flex-col justify-between group ${
                                  isSelected
                                    ? 'border-[#C99B2E] ring-2 ring-[#C99B2E]/30 bg-amber-50/40'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <div className="h-18 rounded-lg overflow-hidden relative">
                                  <img
                                    src={preset.imageUrl}
                                    alt={preset.badge}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40" />
                                  <span className="absolute bottom-1 left-1.5 text-[9px] font-black uppercase text-amber-300 px-1 rounded bg-black/60">
                                    {preset.badge}
                                  </span>
                                  {isSelected && (
                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C99B2E] text-[#4A0E17] flex items-center justify-center font-bold text-[10px]">
                                      ✓
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 truncate mt-1">
                                  {preset.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TAB: UPLOAD FILE FROM PHONE/PC */}
                    {imageSourceTab === 'UPLOAD' && (
                      <div className="space-y-2">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 hover:border-[#6E1325] rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition space-y-2"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#6E1325] flex items-center justify-center mx-auto">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#4A0E17] block">
                              Cliquez pour choisir une photo depuis votre téléphone ou ordinateur
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Formats supportés : JPG, PNG, WebP (Haute résolution recommandée)
                            </span>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB: GOOGLE DRIVE */}
                    {imageSourceTab === 'DRIVE' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Collez le lien de partage Google Drive de votre photo :
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={driveUrlInput}
                            onChange={(e) => setDriveUrlInput(e.target.value)}
                            placeholder="https://drive.google.com/file/d/1a2b3c4d5e.../view?usp=sharing"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={handleApplyDriveLink}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition text-xs shrink-0 cursor-pointer"
                          >
                            Convertir le lien
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Assurez-vous que l'accès au fichier Drive est configuré sur « Tous les utilisateurs disposant du lien ».
                        </p>
                      </div>
                    )}

                    {/* TAB: DIRECT WEB URL */}
                    {imageSourceTab === 'WEB' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700">
                          URL directe de l'image (HTTPS) :
                        </label>
                        <input
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/... ou https://votresite.com/photo.jpg"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono text-[11px]"
                        />
                      </div>
                    )}

                    {/* Image Preview Thumbnail */}
                    {formData.imageUrl && (
                      <div className="pt-2 border-t border-slate-100 flex items-center space-x-3">
                        <div className="w-24 h-14 rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shrink-0 relative">
                          <img
                            src={formData.imageUrl}
                            alt="Aperçu sélectionné"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Image active pour cette diapositive</span>
                          </span>
                          <p className="text-[10px] text-slate-400 truncate font-mono">
                            {formData.imageUrl.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buttons Configuration (CTAs) */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="font-black text-xs text-[#4A0E17] flex items-center space-x-1.5">
                          <LinkIcon className="w-3.5 h-3.5 text-[#C99B2E]" />
                          <span>Configuration des Boutons & Propositions de Liens</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Sélectionnez une proposition rapide ci-dessous pour remplir le texte et le lien de destination.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        ⚡ Raccourcis : Institut Biblique, Cellules & Ressources
                      </span>
                    </div>

                    {/* Quick Category Link Proposals Bar */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#4A0E17]">
                          Propositions Recommandées pour ce carrousel :
                        </span>
                        <span className="text-[10px] text-slate-400">Cliquez pour appliquer au bouton voulu</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Option 1: Inscription Institut Biblique */}
                        <div className="p-2.5 bg-purple-50/80 rounded-xl border border-purple-200 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center space-x-1 text-purple-900 font-bold text-[11px]">
                              <GraduationCap className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span className="truncate">Institut Biblique Parakletos</span>
                            </div>
                            <p className="text-[10px] text-purple-700/90 mt-0.5 line-clamp-2">
                              Lien direct vers l'inscription et la candidature en ligne.
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  primaryButtonText: "S'inscrire à l'Institut",
                                  primaryButtonLink: "/parakletos#adhesion",
                                });
                                showToast("Bouton principal configuré : Inscription Institut");
                              }}
                              className="flex-1 text-[9px] font-bold py-1 px-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white transition text-center cursor-pointer"
                            >
                              Bouton 1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  secondaryButtonText: "S'inscrire à l'Institut",
                                  secondaryButtonLink: "/parakletos#adhesion",
                                });
                                showToast("Bouton secondaire configuré : Inscription Institut");
                              }}
                              className="flex-1 text-[9px] font-bold py-1 px-1.5 rounded-lg bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 transition text-center cursor-pointer"
                            >
                              Bouton 2
                            </button>
                          </div>
                        </div>

                        {/* Option 2: Cellules de Prière */}
                        <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center space-x-1 text-emerald-900 font-bold text-[11px]">
                              <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="truncate">Cellules de Prière de Maison</span>
                            </div>
                            <p className="text-[10px] text-emerald-700/90 mt-0.5 line-clamp-2">
                              Cellules dans les quartiers de Sangmelima (Akon, Bitom...).
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  primaryButtonText: "Cellules de Prière",
                                  primaryButtonLink: "/home-cells",
                                });
                                showToast("Bouton principal configuré : Cellules de Prière");
                              }}
                              className="flex-1 text-[9px] font-bold py-1 px-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition text-center cursor-pointer"
                            >
                              Bouton 1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  secondaryButtonText: "Cellules de Prière",
                                  secondaryButtonLink: "/home-cells",
                                });
                                showToast("Bouton secondaire configuré : Cellules de Prière");
                              }}
                              className="flex-1 text-[9px] font-bold py-1 px-1.5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition text-center cursor-pointer"
                            >
                              Bouton 2
                            </button>
                          </div>
                        </div>

                        {/* Option 3: Ressources & Documents */}
                        <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center space-x-1 text-blue-900 font-bold text-[11px]">
                              <BookOpen className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span className="truncate">Ressources & Guides de Prière</span>
                            </div>
                            <p className="text-[10px] text-blue-700/90 mt-0.5 line-clamp-2">
                              Téléchargements, fiches d'étude biblique et manuels de foi.
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  primaryButtonText: "Guides & Ressources",
                                  primaryButtonLink: "/resources",
                                });
                                showToast("Bouton principal configuré : Ressources");
                              }}
                              className="flex-1 text-[9px] font-bold py-1 px-1.5 rounded-lg bg-[#6E1325] hover:bg-blue-900 text-white transition text-center cursor-pointer"
                            >
                              Bouton 1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  secondaryButtonText: "Guides & Ressources",
                                  secondaryButtonLink: "/resources",
                                });
                                showToast("Bouton secondaire configuré : Ressources");
                              }}
                              className="flex-1 text-[9px] font-bold py-1 px-1.5 rounded-lg bg-white hover:bg-blue-100 text-[#6E1325] border border-blue-300 transition text-center cursor-pointer"
                            >
                              Bouton 2
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Primary Button */}
                      <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <label className="block font-black text-xs text-[#4A0E17]">
                          Bouton Principal (Action Principale)
                        </label>
                        <input
                          type="text"
                          value={formData.primaryButtonText || ''}
                          onChange={(e) => setFormData({ ...formData, primaryButtonText: e.target.value })}
                          placeholder="Texte du bouton : S'inscrire à l'Institut, Cellules..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={formData.primaryButtonLink || ''}
                          onChange={(e) => setFormData({ ...formData, primaryButtonLink: e.target.value })}
                          placeholder="Lien : /parakletos#adhesion, /home-cells, /resources..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                        {/* Destination suggestions */}
                        <div className="pt-1.5 space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block">Toutes les propositions :</span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                            {LINK_PRESETS.map((p) => (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    primaryButtonText: formData.primaryButtonText || p.suggestedButtonText,
                                    primaryButtonLink: p.value,
                                  });
                                }}
                                className={`text-[9px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                                  formData.primaryButtonLink === p.value
                                    ? 'bg-[#4A0E17] text-white border-[#4A0E17]'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                                title={`${p.label} (${p.value})`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Secondary Button */}
                      <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <label className="block font-black text-xs text-[#4A0E17]">
                          Bouton Secondaire (Action Alternative)
                        </label>
                        <input
                          type="text"
                          value={formData.secondaryButtonText || ''}
                          onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
                          placeholder="Texte du bouton : Ressources, Cellules de Prière..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={formData.secondaryButtonLink || ''}
                          onChange={(e) => setFormData({ ...formData, secondaryButtonLink: e.target.value })}
                          placeholder="Lien : /resources, /home-cells, #services..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                        {/* Destination suggestions */}
                        <div className="pt-1.5 space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block">Toutes les propositions :</span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                            {LINK_PRESETS.map((p) => (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    secondaryButtonText: formData.secondaryButtonText || p.suggestedButtonText,
                                    secondaryButtonLink: p.value,
                                  });
                                }}
                                className={`text-[9px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                                  formData.secondaryButtonLink === p.value
                                    ? 'bg-[#6E1325] text-white border-[#6E1325]'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                                title={`${p.label} (${p.value})`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Toggle & Submit Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <label className="flex items-center space-x-2 font-bold cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-[#6E1325] rounded"
                      />
                      <span>Diapositive active et immédiatement visible aux visiteurs</span>
                    </label>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreating(false);
                          setEditingSlide(null);
                        }}
                        className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-black rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 text-[#C99B2E]" />
                        <span>
                          {isCreating ? 'Enregistrer et Ajouter au Carrousel' : 'Enregistrer les Modifications'}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          )}

          {/* List of Existing Slides */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>Diapositives configurées ({slides.length}) :</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Cliquez sur les flèches pour changer l’ordre de défilement
              </span>
            </div>

            {slides.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-bold">Aucune diapositive dans le carrousel.</p>
                <button
                  onClick={handleStartCreate}
                  className="px-4 py-2 bg-[#4A0E17] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  + Ajouter la première diapositive
                </button>
              </div>
            ) : (
              slides
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                      slide.isActive
                        ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                        : 'bg-slate-100 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Thumbnail */}
                      <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200 relative group">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-white font-mono text-[9px] font-bold">
                          #{slide.order}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-[#4A0E17]">
                            {slide.badge}
                          </span>
                          {!slide.isActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                              Masquée
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs sm:text-sm text-[#4A0E17] truncate">
                          {slide.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 truncate">
                          {slide.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Move Up / Down, Visibility, Edit, Delete */}
                    <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                      {/* Reorder Buttons */}
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(slide, 'UP')}
                          disabled={index === 0}
                          className="p-1 text-slate-500 hover:text-[#4A0E17] hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                          title="Déplacer vers le haut"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(slide, 'DOWN')}
                          disabled={index === slides.length - 1}
                          className="p-1 text-slate-500 hover:text-[#4A0E17] hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                          title="Déplacer vers le bas"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(slide)}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                        title={slide.isActive ? 'Masquer du portail' : 'Rendre visible sur le portail'}
                      >
                        {slide.isActive ? (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(slide)}
                        className="p-2 text-slate-500 hover:text-[#6E1325] rounded-xl hover:bg-slate-100 transition cursor-pointer"
                        title="Modifier cette diapositive"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(slide.id, slide.title)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                        title="Supprimer cette diapositive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">
            Les modifications sont immédiatement répercutées sur la page d'accueil de la paroisse.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#4A0E17] text-white text-xs font-bold rounded-xl hover:bg-[#6E1325] transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
