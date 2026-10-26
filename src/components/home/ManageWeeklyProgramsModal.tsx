import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Clock,
  MapPin,
  Calendar,
  User as UserIcon,
  Users,
  Sun,
  BookOpen,
  Flame,
  Heart,
  Music,
  Shield,
  Layers,
  Copy,
  Info,
} from 'lucide-react';
import { WeeklyProgram, WeeklyProgramDay, WeeklyProgramCategory } from '../../types';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

interface ManageWeeklyProgramsModalProps {
  isOpen: boolean;
  onClose: () => void;
  programs: WeeklyProgram[];
  onProgramsUpdated: () => void;
  initialCreateMode?: boolean;
}

// Icon helper
export const renderProgramIcon = (iconName?: string, className = 'w-6 h-6') => {
  switch (iconName) {
    case 'Sun':
      return <Sun className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Music':
      return <Music className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Sparkles':
    default:
      return <Sparkles className={className} />;
  }
};

// Color theme helper
export const getProgramColorClasses = (colorTheme?: string) => {
  switch (colorTheme) {
    case 'amber':
    case 'gold':
      return {
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        iconBg: 'bg-[#C99B2E] text-[#4A0E17]',
        timeText: 'text-[#C99B2E]',
        borderHover: 'hover:border-[#C99B2E]',
        accent: '#C99B2E',
      };
    case 'emerald':
    case 'green':
      return {
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        iconBg: 'bg-emerald-700 text-white',
        timeText: 'text-emerald-700',
        borderHover: 'hover:border-emerald-600',
        accent: '#059669',
      };
    case 'indigo':
    case 'purple':
      return {
        badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        iconBg: 'bg-indigo-700 text-white',
        timeText: 'text-indigo-700',
        borderHover: 'hover:border-indigo-600',
        accent: '#4f46e5',
      };
    case 'rose':
    case 'pink':
      return {
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
        iconBg: 'bg-rose-700 text-white',
        timeText: 'text-rose-700',
        borderHover: 'hover:border-rose-600',
        accent: '#e11d48',
      };
    case 'blue':
    default:
      return {
        badgeBg: 'bg-rose-100 text-[#4A0E17] border-rose-200',
        iconBg: 'bg-[#4A0E17] text-[#C99B2E]',
        timeText: 'text-[#C99B2E]',
        borderHover: 'hover:border-[#6E1325]',
        accent: '#4A0E17',
      };
  }
};

const DAYS_OF_WEEK: WeeklyProgramDay[] = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Tous les jours',
];

const CATEGORIES: { label: string; value: WeeklyProgramCategory; icon: string }[] = [
  { label: 'Culte Dominical / Célébration', value: 'CULTE', icon: 'Sun' },
  { label: 'Étude Biblique & Enseignement', value: 'ETUDE_BIBLIQUE', icon: 'BookOpen' },
  { label: 'Prière, Intercession & Veillée', value: 'PRIERE_INTERCESSION', icon: 'Flame' },
  { label: 'Jeunesse (JEMF)', value: 'JEUNESSE', icon: 'Users' },
  { label: 'Ministère des Femmes', value: 'FEMMES', icon: 'Heart' },
  { label: 'Ministère des Hommes', value: 'HOMMES', icon: 'Shield' },
  { label: 'Enfants (École du Dimanche)', value: 'ENFANTS', icon: 'Sparkles' },
  { label: 'Évangélisation & Mission', value: 'EVANGELISATION', icon: 'Sparkles' },
  { label: 'Formation & Discipulat', value: 'FORMATION', icon: 'BookOpen' },
  { label: 'Programme Spécial', value: 'SPECIAL', icon: 'Sparkles' },
];

const AVAILABLE_ICONS = [
  { name: 'Sun', label: 'Soleil / Culte' },
  { name: 'BookOpen', label: 'Bible / Étude' },
  { name: 'Flame', label: 'Flamme / Prière' },
  { name: 'Users', label: 'Groupe / Jeunesse' },
  { name: 'Heart', label: 'Cœur / Femmes' },
  { name: 'Shield', label: 'Bouclier / Hommes' },
  { name: 'Sparkles', label: 'Étoiles / Éveil' },
  { name: 'Music', label: 'Musique / Chorale' },
];

const COLOR_THEMES = [
  { value: 'blue', label: 'Bordeaux Majesté EMF', bg: 'bg-[#4A0E17]' },
  { value: 'amber', label: 'Or & Ambre Divin', bg: 'bg-[#C99B2E]' },
  { value: 'emerald', label: 'Émeraude Espérance', bg: 'bg-emerald-700' },
  { value: 'indigo', label: 'Indigo Profond', bg: 'bg-indigo-700' },
  { value: 'rose', label: 'Rose Fraternité', bg: 'bg-rose-700' },
];

const QUICK_LOCATIONS = [
  'Grand Temple Akon',
  'Temple Akon',
  'Salle des Jeunes',
  'Salle Polyvalente Akon',
  'Temple Annexe Bitom',
  'En ligne (WhatsApp Audio)',
];

const QUICK_TIMES = [
  '09h00 – 12h00',
  '17h30 – 19h00',
  '18h00 – 20h30',
  '16h00 – 18h00',
  '06h00 – 07h00',
  '12h00 – 13h00',
  '21h00 – 04h00',
];

// Presets for instant population
const PROGRAM_PRESETS = [
  {
    title: 'Culte Dominical d’Adoration & Sainte Cène',
    dayOfWeek: 'Dimanche' as WeeklyProgramDay,
    time: '09h00 – 12h00',
    location: 'Grand Temple Akon',
    category: 'CULTE' as WeeklyProgramCategory,
    leaderOrMinister: 'Pasteur Samuel Ondoa',
    targetAudience: 'Toute la communauté & Familles',
    iconName: 'Sun',
    colorTheme: 'blue',
    description: 'Adoration vibrante, louange avec la chorale Voix de Sion, sainte cène fraternelle, prédication biblique inspirée et prière de guérison pour les malades.',
    notes: 'Retransmission audio disponible pour les malades alités.',
  },
  {
    title: 'Étude Biblique & Enseignement Doctrinal',
    dayOfWeek: 'Mercredi' as WeeklyProgramDay,
    time: '17h30 – 19h00',
    location: 'Temple Akon',
    category: 'ETUDE_BIBLIQUE' as WeeklyProgramCategory,
    leaderOrMinister: 'Collège Pastoral & Anciens',
    targetAudience: 'Tous les fidèles & Nouveaux convertis',
    iconName: 'BookOpen',
    colorTheme: 'indigo',
    description: 'Approfondissement systématique des Saintes Écritures verset par verset, partage doctrinal, questions-réponses pour bâtir des disciples affermis dans la foi.',
    notes: 'Apportez votre Bible et votre carnet de notes.',
  },
  {
    title: 'Veillée d’Intercession & Combat Spirituel',
    dayOfWeek: 'Vendredi' as WeeklyProgramDay,
    time: '18h00 – 20h30',
    location: 'Temple Akon',
    category: 'PRIERE_INTERCESSION' as WeeklyProgramCategory,
    leaderOrMinister: 'Département Intercession & Combat Spirituel',
    targetAudience: 'Tous les intercesseurs & Familles',
    iconName: 'Flame',
    colorTheme: 'amber',
    description: 'Temps d’intercession intense pour les familles, les malades, la paix au Cameroun, la protection divine et la délivrance des âmes captives.',
    notes: 'Journée de jeûne partiel recommandée avant la veillée.',
  },
  {
    title: 'Culte & Rencontre de la Jeunesse (JEMF)',
    dayOfWeek: 'Samedi' as WeeklyProgramDay,
    time: '16h00 – 18h00',
    location: 'Salle des Jeunes & Temple Akon',
    category: 'JEUNESSE' as WeeklyProgramCategory,
    leaderOrMinister: 'Bureau de la Jeunesse EMF',
    targetAudience: 'Jeunes, Étudiants & Jeunes Professionnels',
    iconName: 'Users',
    colorTheme: 'emerald',
    description: 'Louange contemporaine, exhortation de la jeunesse, ateliers de réflexion chrétienne, débats bibliques et formation pratique au leadership serviteur.',
    notes: 'Activités sportives et d’évangélisation un samedi sur deux.',
  },
  {
    title: 'Prière Matinale des Bâtisseurs',
    dayOfWeek: 'Mardi' as WeeklyProgramDay,
    time: '06h00 – 07h00',
    location: 'Temple Akon & En ligne (Groupe Audio)',
    category: 'PRIERE_INTERCESSION' as WeeklyProgramCategory,
    leaderOrMinister: 'Anciens & Diacres',
    targetAudience: 'Travailleurs, Commerçants & Tous fidèles',
    iconName: 'Sparkles',
    colorTheme: 'purple',
    description: 'Commencer la semaine dans la présence du Seigneur : intercession matinale, consécration des commerces, des études, des chantiers et des récoltes.',
    notes: 'Prière d’aube de 60 minutes chrono.',
  },
  {
    title: 'Réunion des Dames de Foi (Mouvement des Femmes)',
    dayOfWeek: 'Jeudi' as WeeklyProgramDay,
    time: '16h00 – 18h00',
    location: 'Salle Polyvalente Akon',
    category: 'FEMMES' as WeeklyProgramCategory,
    leaderOrMinister: 'Bureau des Femmes Chrétiennes EMF',
    targetAudience: 'Mamans, Épouses, Veuves & Jeunes Filles',
    iconName: 'Heart',
    colorTheme: 'rose',
    description: 'Communion fraternelle, prière pour l’harmonie des foyers et l’avenir des enfants, entraide sociale et partage de la Parole de Dieu entre femmes de foi.',
    notes: 'Visites aux personnes vulnérables après la séance.',
  },
];

export const ManageWeeklyProgramsModal: React.FC<ManageWeeklyProgramsModalProps> = ({
  isOpen,
  onClose,
  programs,
  onProgramsUpdated,
  initialCreateMode = false,
}) => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'LIST' | 'FORM'>(initialCreateMode ? 'FORM' : 'LIST');
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<WeeklyProgramDay>('Dimanche');
  const [time, setTime] = useState('09h00 – 12h00');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Grand Temple Akon');
  const [category, setCategory] = useState<WeeklyProgramCategory>('CULTE');
  const [leaderOrMinister, setLeaderOrMinister] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [iconName, setIconName] = useState('Sun');
  const [colorTheme, setColorTheme] = useState('blue');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialCreateMode) {
      resetForm();
      setActiveTab('FORM');
    } else {
      setActiveTab('LIST');
    }
  }, [initialCreateMode, isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const resetForm = () => {
    setEditingProgramId(null);
    setTitle('');
    setDayOfWeek('Dimanche');
    setTime('09h00 – 12h00');
    setDescription('');
    setLocation('Grand Temple Akon');
    setCategory('CULTE');
    setLeaderOrMinister('');
    setTargetAudience('Toute la communauté');
    setIconName('Sun');
    setColorTheme('blue');
    setIsActive(true);
    setNotes('');
  };

  const startEdit = (p: WeeklyProgram) => {
    setEditingProgramId(p.id);
    setTitle(p.title);
    setDayOfWeek(p.dayOfWeek);
    setTime(p.time);
    setDescription(p.description);
    setLocation(p.location);
    setCategory(p.category);
    setLeaderOrMinister(p.leaderOrMinister || '');
    setTargetAudience(p.targetAudience || '');
    setIconName(p.iconName || 'Sun');
    setColorTheme(p.colorTheme || 'blue');
    setIsActive(p.isActive);
    setNotes(p.notes || '');
    setActiveTab('FORM');
  };

  const applyPreset = (preset: typeof PROGRAM_PRESETS[0]) => {
    setTitle(preset.title);
    setDayOfWeek(preset.dayOfWeek);
    setTime(preset.time);
    setLocation(preset.location);
    setCategory(preset.category);
    setLeaderOrMinister(preset.leaderOrMinister);
    setTargetAudience(preset.targetAudience);
    setIconName(preset.iconName);
    setColorTheme(preset.colorTheme);
    setDescription(preset.description);
    setNotes(preset.notes);
    showToast(`✓ Modèle appliqué : "${preset.title}"`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time.trim()) {
      alert('Veuillez renseigner au moins le titre et les horaires du programme.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingProgramId) {
        await apiClient.updateWeeklyProgram(
          editingProgramId,
          {
            title: title.trim(),
            dayOfWeek,
            time: time.trim(),
            description: description.trim(),
            location: location.trim(),
            category,
            leaderOrMinister: leaderOrMinister.trim() || undefined,
            targetAudience: targetAudience.trim() || undefined,
            iconName,
            colorTheme,
            isActive,
            notes: notes.trim() || undefined,
          },
          currentUser || undefined
        );
        showToast('✓ Programme hebdomadaire mis à jour avec succès !');
      } else {
        await apiClient.createWeeklyProgram(
          {
            title: title.trim(),
            dayOfWeek,
            time: time.trim(),
            description: description.trim(),
            location: location.trim(),
            category,
            leaderOrMinister: leaderOrMinister.trim() || undefined,
            targetAudience: targetAudience.trim() || undefined,
            iconName,
            colorTheme,
            isActive,
            order: programs.length + 1,
            notes: notes.trim() || undefined,
          },
          currentUser || undefined
        );
        showToast('✓ Nouveau programme hebdomadaire ajouté avec succès !');
      }
      onProgramsUpdated();
      setActiveTab('LIST');
      resetForm();
    } catch (err) {
      console.error('Error saving weekly program:', err);
      alert('Erreur lors de l’enregistrement du programme.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteWeeklyProgram(id, currentUser || undefined);
      showToast('✓ Programme supprimé');
      setDeleteConfirmId(null);
      onProgramsUpdated();
      if (editingProgramId === id) {
        resetForm();
        setActiveTab('LIST');
      }
    } catch (err) {
      console.error('Error deleting weekly program:', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleToggleActive = async (p: WeeklyProgram) => {
    try {
      await apiClient.updateWeeklyProgram(
        p.id,
        { isActive: !p.isActive },
        currentUser || undefined
      );
      showToast(p.isActive ? '👁 Programme masqué de la page d’accueil' : '✓ Programme activé sur la page d’accueil');
      onProgramsUpdated();
    } catch (err) {
      console.error('Error toggling active state:', err);
    }
  };

  const handleMove = async (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === programs.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const newItems = [...programs];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const orderedIds = newItems.map((p) => p.id);
    await apiClient.reorderWeeklyPrograms(orderedIds, currentUser || undefined);
    onProgramsUpdated();
  };

  // Preview colors for form live preview
  const previewColors = getProgramColorClasses(colorTheme);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-60 bg-[#4A0E17] text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-top">
          <CheckCircle className="w-5 h-5 text-[#C99B2E] shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#4A0E17] text-white px-6 py-5 flex items-center justify-between border-b border-[#C99B2E]/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C99B2E]/20 text-[#C99B2E] flex items-center justify-center border border-[#C99B2E]/40">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C99B2E] bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                  Administration Accueil
                </span>
                <span className="text-xs text-slate-300">
                  • {programs.length} programme(s) enregistré(s)
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Gestion des Rendez-vous Hebdomadaires (Cultes & Réunions)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'LIST'
                  ? 'bg-[#4A0E17] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Liste des Programmes ({programs.length})</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setActiveTab('FORM');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'FORM' && !editingProgramId
                  ? 'bg-[#C99B2E] text-[#4A0E17] shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Nouveau Programme</span>
            </button>

            {activeTab === 'FORM' && editingProgramId && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center space-x-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modification en cours</span>
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Affichés publiquement dans la section <span className="font-bold text-[#4A0E17]">« Cultes & Réunions de Foi »</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {activeTab === 'LIST' ? (
            /* LIST VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#4A0E17]">
                    Programmes et cultes hebdomadaires configurés
                  </h3>
                  <p className="text-xs text-slate-500">
                    Organisez l’ordre d’apparition, activez/désactivez la visibilité ou modifiez les détails de chaque rendez-vous.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('FORM');
                  }}
                  className="px-3.5 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#C99B2E]" />
                  <span>Ajouter un programme</span>
                </button>
              </div>

              {programs.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Aucun programme hebdomadaire configuré</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Créez votre premier culte ou réunion pour guider les fidèles et les visiteurs dès la page d’accueil.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setActiveTab('FORM');
                    }}
                    className="mt-4 px-4 py-2 bg-[#C99B2E] text-[#4A0E17] font-bold text-xs rounded-xl shadow hover:bg-amber-400 transition"
                  >
                    + Créer le premier programme
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {programs.map((prog, index) => {
                    const colors = getProgramColorClasses(prog.colorTheme);
                    return (
                      <div
                        key={prog.id}
                        className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          prog.isActive
                            ? 'bg-white border-slate-200 hover:border-[#6E1325] shadow-xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {/* Order & Reorder Controls */}
                          <div className="flex flex-col items-center space-y-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleMove(index, 'UP')}
                              disabled={index === 0}
                              className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-20 text-slate-500 cursor-pointer"
                              title="Monter"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-black text-slate-400">
                              #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleMove(index, 'DOWN')}
                              disabled={index === programs.length - 1}
                              className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-20 text-slate-500 cursor-pointer"
                              title="Descendre"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Icon preview */}
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold ${colors.iconBg}`}
                          >
                            {renderProgramIcon(prog.iconName, 'w-5 h-5')}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors.badgeBg}`}
                              >
                                {prog.dayOfWeek}
                              </span>
                              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-[#C99B2E]" />
                                <span>{prog.time}</span>
                              </span>
                              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{prog.location}</span>
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-[#4A0E17] truncate">
                              {prog.title}
                            </h4>

                            <p className="text-xs text-slate-600 line-clamp-2">
                              {prog.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                              {prog.leaderOrMinister && (
                                <span className="flex items-center space-x-1">
                                  <UserIcon className="w-3 h-3 text-slate-400" />
                                  <span>{prog.leaderOrMinister}</span>
                                </span>
                              )}
                              {prog.targetAudience && (
                                <span className="flex items-center space-x-1">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  <span>{prog.targetAudience}</span>
                                </span>
                              )}
                              {!prog.isActive && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                  Masqué sur l’accueil
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1.5 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                          {/* Toggle active */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(prog)}
                            className={`p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                              prog.isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                            }`}
                            title={prog.isActive ? 'Masquer du portail' : 'Afficher sur le portail'}
                          >
                            {prog.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => startEdit(prog)}
                            className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                            title="Modifier ce programme"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Modifier</span>
                          </button>

                          {/* Delete */}
                          {deleteConfirmId === prog.id ? (
                            <div className="flex items-center space-x-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                              <button
                                type="button"
                                onClick={() => handleDelete(prog.id)}
                                className="px-2 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                              >
                                Confirmer
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(prog.id)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
                              title="Supprimer ce programme"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* FORM VIEW */
            <form onSubmit={handleSave} className="space-y-6">
              {/* Ready Presets Bar */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-blue-50 rounded-2xl border border-[#C99B2E]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#C99B2E]" />
                    <span className="text-xs font-black text-[#4A0E17]">
                      Modèles de Cultes Pré-remplis (1 Clic)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Gagnez du temps en appliquant une base authentique
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PROGRAM_PRESETS.map((pst, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyPreset(pst)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100/60 border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                    >
                      <Copy className="w-3 h-3 text-[#C99B2E]" />
                      <span>{pst.title.split(' ')[0]} {pst.dayOfWeek}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Prévisualisation en direct sur la page d’accueil
                </label>
                <div className="p-6 rounded-2xl bg-[#FAF0F2]/60 border border-slate-200 shadow-sm max-w-md mx-auto">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold mb-4 ${previewColors.iconBg}`}
                  >
                    {renderProgramIcon(iconName, 'w-6 h-6')}
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-[#4A0E17]">
                      {title || 'Titre du Programme'}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${previewColors.badgeBg}`}
                    >
                      {dayOfWeek}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-bold mb-2 flex items-center space-x-1 ${previewColors.timeText}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dayOfWeek} : {time || '09h00 – 12h00'}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                    {description || 'Description courte du culte, de l’exhortation ou du temps de prière...'}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{location || 'Grand Temple Akon'}</span>
                    </span>
                    {leaderOrMinister && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {leaderOrMinister}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Titre du Programme / Culte <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Culte Dominical d'Adoration & Sainte Cène"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>

                {/* Day of Week */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jour de la Semaine <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as WeeklyProgramDay)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325] font-bold text-slate-700"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Horaires (Début & Fin) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="ex: 09h00 – 12h00"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                  {/* Quick chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {QUICK_TIMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-semibold cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lieu / Salle
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ex: Grand Temple Akon"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                  {/* Quick chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {QUICK_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocation(loc)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-semibold cursor-pointer"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Catégorie du Programme
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as WeeklyProgramCategory)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325] font-medium text-slate-700"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Leader / Officiant */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Responsable / Prédicateur / Officiant
                  </label>
                  <input
                    type="text"
                    value={leaderOrMinister}
                    onChange={(e) => setLeaderOrMinister(e.target.value)}
                    placeholder="ex: Pasteur Samuel Ondoa ou Collège des Anciens"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Public Cible
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="ex: Toute la communauté, Jeunes, Mamans, Intercesseurs..."
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Icône Visuelle de la Carte
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_ICONS.map((ic) => {
                      const isSelected = iconName === ic.name;
                      return (
                        <button
                          key={ic.name}
                          type="button"
                          onClick={() => setIconName(ic.name)}
                          className={`p-2 rounded-xl border flex flex-col items-center space-y-1 transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#4A0E17] text-[#C99B2E] border-[#4A0E17] shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          {renderProgramIcon(ic.name, 'w-5 h-5')}
                          <span className="text-[10px] font-bold truncate max-w-full">
                            {ic.label.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Theme Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Couleur & Style de la Carte
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_THEMES.map((theme) => {
                      const isSelected = colorTheme === theme.value;
                      return (
                        <button
                          key={theme.value}
                          type="button"
                          onClick={() => setColorTheme(theme.value)}
                          className={`p-2 rounded-xl border flex items-center space-x-2 transition cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${theme.bg} shrink-0 border border-white`} />
                          <span className="text-[11px] font-bold truncate">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description & Déroulement Spirituel
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Expliquez ce qui se vit durant cette rencontre (chants, sainte cène, prédication, intercession...)"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>

                {/* Pastoral Notes / Remarques */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Consignes / Notes Pratiques (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ex: Apporter sa Bible, jeûne partiel recommandé, retransmission audio..."
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>

                {/* Is Active Toggle */}
                <div className="md:col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-[#C99B2E]" />
                    <span className="text-xs font-bold text-slate-700">
                      Afficher ce programme publiquement sur la page d’accueil
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A0E17]"></div>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('LIST');
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Annuler & Retourner à la liste
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 text-[#C99B2E]" />
                    <span>{editingProgramId ? 'Enregistrer les modifications' : 'Créer et publier le programme'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>
              Les modifications sont sauvegardées en temps réel et s’affichent instantanément sur le portail public.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition text-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
