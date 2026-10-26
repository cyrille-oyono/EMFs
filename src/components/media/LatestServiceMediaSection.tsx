import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Image as ImageIcon,
  Video,
  Calendar,
  User,
  BookOpen,
  Users,
  Clock,
  Play,
  Pause,
  Download,
  Plus,
  Trash2,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  CheckCircle,
  Share2,
  Sparkles,
  LayoutGrid,
  Sliders,
  ExternalLink,
  ArrowRight,
  Smartphone,
  Camera,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { LatestServiceMedia, ServiceMediaPhoto, ServiceMediaVideo } from '../../types';
import { formatDateDouala } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/apiClient';
import { compressImageFile, extractVideoMetadataAndThumbnail } from '../../utils/mediaUpload';
import {
  isSupabaseConfigured,
  saveLatestServiceMediaToSupabase,
} from '../../services/supabase';
import { INITIAL_LATEST_SERVICE_MEDIA } from '../../server/initialData';

interface LatestServiceMediaSectionProps {
  data?: LatestServiceMedia | null;
  onRefresh: () => void;
  title?: string;
  subtitle?: string;
  isStandalonePage?: boolean;
}

export const LatestServiceMediaSection: React.FC<LatestServiceMediaSectionProps> = ({
  data,
  onRefresh,
  title = 'Médiathèque du Dernier Culte',
  subtitle = 'Revivez la présence de Dieu : découvrez les clichés marquants et les vidéos du culte dominical célébré à Sangmelima',
  isStandalonePage = false,
}) => {
  const { currentUser, hasRole, hasPermission } = useAuth();
  const isAdminOrLeadership =
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'PASTEUR' ||
    hasPermission('MEDIA_MANAGE');

  const safeData = data && typeof data === 'object' ? data : INITIAL_LATEST_SERVICE_MEDIA;
  const photos = Array.isArray(safeData.photos) ? safeData.photos : INITIAL_LATEST_SERVICE_MEDIA.photos;
  const videos = Array.isArray(safeData.videos) ? safeData.videos : INITIAL_LATEST_SERVICE_MEDIA.videos;

  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

  // Photo View Mode: 'carousel' (second carousel défilant) or 'grid' (grille d'albums)
  const [photoViewMode, setPhotoViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const carouselTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide effect for the second photo carousel
  useEffect(() => {
    if (
      activeTab === 'photos' &&
      photoViewMode === 'carousel' &&
      isCarouselPlaying &&
      !isCarouselHovered &&
      photos &&
      photos.length > 1
    ) {
      carouselTimerRef.current = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % photos.length);
      }, 4500);
    }
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [activeTab, photoViewMode, isCarouselPlaying, isCarouselHovered, photos?.length]);

  const handlePrevCarousel = () => {
    if (!photos || photos.length === 0) return;
    setCarouselIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextCarousel = () => {
    if (!photos || photos.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % photos.length);
  };

  // Lightbox Photo State
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(null);

  // Video Player Modal State
  const [activeVideo, setActiveVideo] = useState<ServiceMediaVideo | null>(null);

  // Admin Management Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageSubTab, setManageSubTab] = useState<'info' | 'add-photo' | 'add-video'>('info');
  const [notification, setNotification] = useState<string | null>(null);

  // Form states for Admin
  const [infoForm, setInfoForm] = useState({
    serviceDate: safeData.serviceDate || INITIAL_LATEST_SERVICE_MEDIA.serviceDate,
    serviceTitle: safeData.serviceTitle || INITIAL_LATEST_SERVICE_MEDIA.serviceTitle,
    preacherName: safeData.preacherName || INITIAL_LATEST_SERVICE_MEDIA.preacherName,
    themePassage: safeData.themePassage || INITIAL_LATEST_SERVICE_MEDIA.themePassage,
    summary: safeData.summary || INITIAL_LATEST_SERVICE_MEDIA.summary,
    attendanceCount: safeData.attendanceCount || 240,
  });

  const [newPhotoForm, setNewPhotoForm] = useState({
    title: '',
    url: '',
    caption: '',
    photographer: 'Cellule Média EMF',
    date: safeData.serviceDate || INITIAL_LATEST_SERVICE_MEDIA.serviceDate,
  });

  const [newVideoForm, setNewVideoForm] = useState({
    title: '',
    url: '',
    thumbnailUrl: '',
    duration: '45m 00s',
    preacher: safeData.preacherName || INITIAL_LATEST_SERVICE_MEDIA.preacherName,
    description: '',
    isFullService: false,
    date: safeData.serviceDate || INITIAL_LATEST_SERVICE_MEDIA.serviceDate,
  });

  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [photoStats, setPhotoStats] = useState<string | null>(null);

  const handlePhonePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    try {
      const res = await compressImageFile(file);
      setNewPhotoForm((prev) => ({
        ...prev,
        url: res.dataUrl,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
      setPhotoStats(`✓ Photo optimisée : ${res.originalSizeMb} Mo ➔ ${res.sizeMb} Mo`);
      showToast(`✓ Photo chargée depuis le téléphone (${res.sizeMb} Mo)`);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du traitement de l'image");
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handlePhoneVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingVideo(true);
    try {
      const meta = await extractVideoMetadataAndThumbnail(file);
      setNewVideoForm((prev) => ({
        ...prev,
        url: meta.videoUrl,
        thumbnailUrl: meta.thumbnailUrl || prev.thumbnailUrl,
        duration: meta.durationText,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
      showToast(`✓ Vidéo mobile prête (${meta.sizeMb} Mo, ${meta.durationText})`);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la lecture de la vidéo");
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Lightbox Navigation
  const openLightbox = (index: number) => setLightboxPhotoIndex(index);
  const closeLightbox = () => setLightboxPhotoIndex(null);
  const nextPhoto = () => {
    if (lightboxPhotoIndex !== null && photos.length > 0) {
      setLightboxPhotoIndex((lightboxPhotoIndex + 1) % photos.length);
    }
  };
  const prevPhoto = () => {
    if (lightboxPhotoIndex !== null && photos.length > 0) {
      setLightboxPhotoIndex(
        lightboxPhotoIndex === 0 ? photos.length - 1 : lightboxPhotoIndex - 1
      );
    }
  };

  // Video embed helper
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  // Handlers for Admin
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.updateLatestServiceMedia(infoForm, currentUser || undefined);
    showToast('Informations du culte enregistrées.');
    onRefresh();
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoForm.title || !newPhotoForm.url) return;
    await apiClient.addServicePhoto(newPhotoForm, currentUser || undefined);
    setNewPhotoForm({
      title: '',
      url: '',
      caption: '',
      photographer: 'Cellule Média EMF',
      date: safeData.serviceDate,
    });
    showToast('Photo ajoutée à la galerie du culte.');
    onRefresh();
  };

  const handleDeletePhoto = async (id: string, photoTitle: string) => {
    if (confirm(`Confirmer la suppression de la photo "${photoTitle}" ?`)) {
      await apiClient.deleteServicePhoto(id, currentUser || undefined);
      showToast('Photo retirée.');
      onRefresh();
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoForm.title || !newVideoForm.url) return;
    await apiClient.addServiceVideo(newVideoForm, currentUser || undefined);
    setNewVideoForm({
      title: '',
      url: '',
      thumbnailUrl: '',
      duration: '45m 00s',
      preacher: safeData.preacherName,
      description: '',
      isFullService: false,
      date: safeData.serviceDate,
    });
    showToast('Vidéo ajoutée à la médiathèque du culte.');
    onRefresh();
  };

  const handleDeleteVideo = async (id: string, videoTitle: string) => {
    if (confirm(`Confirmer la suppression de la vidéo "${videoTitle}" ?`)) {
      await apiClient.deleteServiceVideo(id, currentUser || undefined);
      showToast('Vidéo retirée.');
      onRefresh();
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    try {
      if (isSupabaseConfigured()) {
        const res = await saveLatestServiceMediaToSupabase(safeData);
        if (res.success) {
          showToast('✓ Médiathèque synchronisée avec Supabase !');
        } else {
          showToast(`Erreur: ${res.error || 'Erreur Supabase'}`);
        }
      } else {
        await apiClient.updateLatestServiceMedia(safeData, currentUser || undefined);
        showToast('✓ Sauvegardé en local.');
      }
    } catch (e) {
      showToast('Erreur lors de la synchronisation.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section id="dernier-culte" className={`${isStandalonePage ? '' : 'py-16 bg-[#F4F7FB] border-y border-slate-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#C99B2E]">
              <Film className="w-4 h-4 text-[#6E1325]" />
              <span>Dernier Culte Célébré à Sangmelima</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#4A0E17] tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Admin Management Buttons */}
          {isAdminOrLeadership && (
            <div className="flex flex-wrap items-center gap-2">
              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
                <button
                  onClick={handleSyncSupabase}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] text-xs font-black rounded-xl transition shadow flex items-center space-x-2 flex-shrink-0 cursor-pointer disabled:opacity-50"
                  title="Enregistrer et synchroniser les photos et vidéos dans Supabase"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>Enregistrer (Supabase)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setInfoForm({
                    serviceDate: safeData.serviceDate,
                    serviceTitle: safeData.serviceTitle,
                    preacherName: safeData.preacherName,
                    themePassage: safeData.themePassage,
                    summary: safeData.summary,
                    attendanceCount: safeData.attendanceCount || 240,
                  });
                  setIsManageModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-2 flex-shrink-0 cursor-pointer border border-[#C99B2E]/40"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>Gérer les Médias du Culte (Admin)</span>
              </button>
            </div>
          )}
        </div>

        {/* Culte Highlights Feature Card */}
        <div className="bg-gradient-to-br from-[#4A0E17] via-[#6E1325] to-[#071d37] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#C99B2E] text-[#4A0E17] font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDateDouala(safeData.serviceDate)}</span>
                </span>
                <span className="bg-white/10 text-slate-200 border border-white/20 text-[11px] font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                  <User className="w-3 h-3 text-[#C99B2E]" />
                  <span>{safeData.preacherName}</span>
                </span>
                {safeData.attendanceCount && (
                  <span className="bg-white/10 text-amber-200 border border-white/20 text-[11px] font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>~{safeData.attendanceCount} Fidèles présents</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
                {safeData.serviceTitle}
              </h3>

              <div className="text-xs sm:text-sm font-semibold text-amber-300 flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span>{safeData.themePassage}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light line-clamp-3">
                {safeData.summary}
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                <div className="text-2xl font-black text-[#C99B2E]">{photos.length}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-200 font-bold">Photos du Culte</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                <div className="text-2xl font-black text-amber-300">{videos.length}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-200 font-bold">Enregistrements Vidéo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Media Type Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'photos'
                  ? 'bg-[#6E1325] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#C99B2E]" />
              <span>Galerie Photos ({photos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-[#6E1325] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Video className="w-4 h-4 text-red-400" />
              <span>Vidéos & Enregistrements ({videos.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Cliquez sur un média pour l'agrandir ou le visionner
          </span>
        </div>

        {/* Media Type Switcher Tabs & View Mode Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'photos'
                  ? 'bg-[#6E1325] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#C99B2E]" />
              <span>Photos du Culte ({photos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-[#6E1325] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Video className="w-4 h-4 text-red-400" />
              <span>Vidéos & Enregistrements ({videos.length})</span>
            </button>
          </div>

          {/* Sub-view mode toggles for Photos: Défilement Carrousel vs Grille */}
          {activeTab === 'photos' && photos.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                onClick={() => setPhotoViewMode('carousel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  photoViewMode === 'carousel'
                    ? 'bg-[#4A0E17] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title="Afficher comme un carrousel défilant"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>Carrousel Défilant</span>
              </button>

              <button
                onClick={() => setPhotoViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  photoViewMode === 'grid'
                    ? 'bg-[#4A0E17] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title="Afficher en mosaïque de photos"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Mosaïque Grille</span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: Photos (Second Carousel OR Grid) */}
        {activeTab === 'photos' && (
          <div>
            {photos.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Aucune photo publiée pour ce culte pour le moment.
              </div>
            ) : photoViewMode === 'carousel' ? (
              /* SECOND CAROUSEL D'IMAGES DÉFILANT */
              <div
                className="relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl border-2 border-slate-800 group min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex flex-col justify-between"
                onMouseEnter={() => setIsCarouselHovered(true)}
                onMouseLeave={() => setIsCarouselHovered(false)}
                role="region"
                aria-label="Carrousel des photos du dernier culte"
              >
                {/* Background Slides with Crossfade */}
                <div className="absolute inset-0 z-0">
                  {photos.map((photo, idx) => {
                    const isCurrent = idx === carouselIndex;
                    return (
                      <div
                        key={photo.id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                          isCurrent ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 pointer-events-none scale-105'
                        }`}
                        style={{ transitionProperty: 'opacity, transform', transitionDuration: '700ms' }}
                      >
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.05]"
                        />
                        {/* Gradients for readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#4A0E17]/80 via-transparent to-transparent" />
                      </div>
                    );
                  })}
                </div>

                {/* Top Badge & Carousel Status */}
                <div className="relative z-20 p-4 sm:p-6 flex items-center justify-between">
                  <div className="inline-flex items-center space-x-2 bg-[#C99B2E] text-[#4A0E17] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cliché du Dernier Culte • {formatDateDouala(safeData.serviceDate)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openLightbox(carouselIndex)}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-white/25 shadow-md"
                      title="Agrandir en plein écran"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden sm:inline">Plein Écran</span>
                    </button>
                    <a
                      href={photos[carouselIndex]?.url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition border border-white/25 cursor-pointer shadow-md"
                      title="Télécharger l'image"
                    >
                      <Download className="w-4 h-4 text-amber-300" />
                    </a>
                  </div>
                </div>

                {/* Carousel Center Info (Title, Caption, Photographer) */}
                <div className="relative z-20 px-6 sm:px-12 py-6 max-w-3xl space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Photo {carouselIndex + 1} sur {photos.length}
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">
                    {photos[carouselIndex]?.title}
                  </h3>
                  {photos[carouselIndex]?.caption && (
                    <p className="text-sm sm:text-base text-slate-100 font-light leading-relaxed max-w-2xl drop-shadow border-l-2 border-[#C99B2E] pl-3 py-0.5 italic">
                      « {photos[carouselIndex]?.caption} »
                    </p>
                  )}
                  {photos[carouselIndex]?.photographer && (
                    <p className="text-xs text-slate-300 flex items-center space-x-1.5 pt-1">
                      <User className="w-3.5 h-3.5 text-[#C99B2E]" />
                      <span>Prise de vue : <strong className="text-white">{photos[carouselIndex]?.photographer}</strong></span>
                    </p>
                  )}
                </div>

                {/* Navigation Arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevCarousel}
                      className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-[#C99B2E] text-white hover:text-[#4A0E17] backdrop-blur-md border border-white/20 transition-all flex items-center justify-center cursor-pointer shadow-xl opacity-80 group-hover:opacity-100"
                      aria-label="Photo précédente"
                      title="Photo précédente"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNextCarousel}
                      className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-[#C99B2E] text-white hover:text-[#4A0E17] backdrop-blur-md border border-white/20 transition-all flex items-center justify-center cursor-pointer shadow-xl opacity-80 group-hover:opacity-100"
                      aria-label="Photo suivante"
                      title="Photo suivante"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Bottom Bar: Thumbnails preview, Counter & Play/Pause controls */}
                <div className="relative z-20 p-4 sm:p-6 bg-black/60 backdrop-blur-md border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Thumbnails preview strip */}
                  <div className="flex items-center space-x-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
                    {photos.map((photo, idx) => {
                      const isActive = idx === carouselIndex;
                      return (
                        <button
                          key={photo.id}
                          onClick={() => setCarouselIndex(idx)}
                          className={`relative h-12 w-16 sm:h-14 sm:w-20 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                            isActive
                              ? 'border-[#C99B2E] ring-2 ring-[#C99B2E]/40 scale-105'
                              : 'border-white/20 opacity-60 hover:opacity-100'
                          }`}
                          title={`Aller à la photo #${idx + 1} : ${photo.title}`}
                        >
                          <img
                            src={photo.url}
                            alt={photo.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-white bg-black/60 px-1 rounded">
                            #{idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Play/Pause & Counter Controls */}
                  <div className="flex items-center space-x-3 bg-black/70 px-4 py-2 rounded-full border border-white/15 shrink-0">
                    {/* Dots indicator */}
                    <div className="flex items-center space-x-1.5">
                      {photos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCarouselIndex(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === carouselIndex ? 'w-5 bg-[#C99B2E]' : 'w-2 bg-white/40 hover:bg-white/70'
                          }`}
                          aria-label={`Aller au cliché ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <span className="text-white/30 text-xs">|</span>

                    {/* Counter */}
                    <span className="font-mono text-xs text-slate-300">
                      <strong className="text-amber-300">{String(carouselIndex + 1).padStart(2, '0')}</strong> /{' '}
                      {String(photos.length).padStart(2, '0')}
                    </span>

                    <span className="text-white/30 text-xs">|</span>

                    {/* Play / Pause toggle */}
                    <button
                      onClick={() => setIsCarouselPlaying(!isCarouselPlaying)}
                      className="text-slate-300 hover:text-amber-300 transition cursor-pointer"
                      title={isCarouselPlaying ? 'Mettre le défilement en pause' : 'Lancer le défilement automatique'}
                      aria-label={isCarouselPlaying ? 'Pause' : 'Lecture'}
                    >
                      {isCarouselPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-amber-300" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ALTERNATIVE GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    onClick={() => openLightbox(index)}
                    className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="relative h-56 bg-slate-200 overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 text-[#4A0E17] flex items-center justify-center shadow-lg">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        Photo #{index + 1}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#4A0E17] line-clamp-1 group-hover:text-[#6E1325] transition">
                          {photo.title}
                        </h4>
                        {photo.caption && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {photo.caption}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{photo.photographer || 'Cellule Média EMF'}</span>
                        <span className="text-[#6E1325] font-bold hover:underline flex items-center space-x-1">
                          <span>Agrandir</span>
                          <Maximize2 className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Videos Grid */}
        {activeTab === 'videos' && (
          <div>
            {videos.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Aucune vidéo indexée pour ce culte pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg transition flex flex-col group"
                  >
                    <div
                      onClick={() => setActiveVideo(vid)}
                      className="relative h-60 bg-slate-900 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={
                          vid.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={vid.title}
                        className="w-full h-full object-cover filter brightness-75 group-hover:brightness-90 transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition transform group-hover:scale-110">
                          <Play className="w-7 h-7 ml-1 fill-white" />
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                        {vid.isFullService ? (
                          <span className="bg-[#C99B2E] text-[#4A0E17] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow">
                            Culte Intégral
                          </span>
                        ) : (
                          <span className="bg-[#4A0E17]/80 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow backdrop-blur-xs">
                            Extrait & Louange
                          </span>
                        )}

                        {vid.duration && (
                          <span className="bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{vid.duration}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-base text-[#4A0E17] line-clamp-2">
                          {vid.title}
                        </h4>
                        {vid.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                            {vid.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">
                          Orateur : <strong className="text-slate-800">{vid.preacher || safeData.preacherName}</strong>
                        </span>

                        <button
                          onClick={() => setActiveVideo(vid)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#6E1325] text-white text-xs font-bold hover:bg-[#4A0E17] transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Visionner</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL FOR PHOTOS */}
      {lightboxPhotoIndex !== null && photos[lightboxPhotoIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white max-w-7xl mx-auto w-full py-2 px-2">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-amber-300">
                {photos[lightboxPhotoIndex].title}
              </h3>
              <p className="text-xs text-slate-400">
                {photos[lightboxPhotoIndex].photographer} • {formatDateDouala(safeData.serviceDate)}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono text-slate-400">
                {lightboxPhotoIndex + 1} / {photos.length}
              </span>
              <a
                href={photos[lightboxPhotoIndex].url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
                title="Télécharger l'image"
              >
                <Download className="w-5 h-5 text-[#C99B2E]" />
              </a>
              <button
                onClick={closeLightbox}
                className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                title="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Photo Display */}
          <div className="relative flex-1 flex items-center justify-center max-w-6xl mx-auto w-full my-auto overflow-hidden">
            <img
              src={photos[lightboxPhotoIndex].url}
              alt={photos[lightboxPhotoIndex].title}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {/* Prev / Next buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-[#C99B2E] text-white hover:text-[#4A0E17] transition cursor-pointer"
                  title="Photo précédente"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-[#C99B2E] text-white hover:text-[#4A0E17] transition cursor-pointer"
                  title="Photo suivante"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Caption */}
          {photos[lightboxPhotoIndex].caption && (
            <div className="text-center text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto py-2">
              « {photos[lightboxPhotoIndex].caption} »
            </div>
          )}
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white w-full max-w-4xl rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="truncate mr-4">
                <h3 className="font-bold text-sm sm:text-base text-amber-300 truncate">
                  {activeVideo.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeVideo.preacher} • {activeVideo.duration}
                </p>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Frame */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {activeVideo.url.includes('youtube') || activeVideo.url.includes('youtu.be') ? (
                <iframe
                  src={getEmbedUrl(activeVideo.url)}
                  title={activeVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Votre navigateur ne supporte pas la lecture vidéo directe.
                </video>
              )}
            </div>

            {/* Video Info footer */}
            <div className="p-4 bg-slate-950/80 flex items-center justify-between text-xs">
              <p className="text-slate-300 max-w-2xl text-[11px] leading-relaxed">
                {activeVideo.description || 'Enregistrement de culte disponible pour l’édification spirituelle des fidèles.'}
              </p>
              <button
                onClick={() => setActiveVideo(null)}
                className="px-4 py-1.5 bg-[#6E1325] hover:bg-[#4A0E17] rounded-lg font-bold text-white transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN MANAGEMENT MODAL */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Film className="w-5 h-5 text-[#C99B2E]" />
                <h3 className="font-bold text-base">Gestion de la Médiathèque du Dernier Culte</h3>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {notification && (
              <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2 text-xs font-bold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{notification}</span>
              </div>
            )}

            {/* Tabs inside Admin Modal */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-bold">
              <button
                onClick={() => setManageSubTab('info')}
                className={`py-3 px-4 border-b-2 transition ${
                  manageSubTab === 'info'
                    ? 'border-[#6E1325] text-[#6E1325]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Détails du Culte
              </button>
              <button
                onClick={() => setManageSubTab('add-photo')}
                className={`py-3 px-4 border-b-2 transition flex items-center space-x-1 ${
                  manageSubTab === 'add-photo'
                    ? 'border-[#6E1325] text-[#6E1325]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>2. Gérer Photos ({photos.length})</span>
              </button>
              <button
                onClick={() => setManageSubTab('add-video')}
                className={`py-3 px-4 border-b-2 transition flex items-center space-x-1 ${
                  manageSubTab === 'add-video'
                    ? 'border-[#6E1325] text-[#6E1325]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>3. Gérer Vidéos ({videos.length})</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              {/* SUBTAB 1: Culte Info */}
              {manageSubTab === 'info' && (
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Date du Culte *</label>
                      <input
                        type="date"
                        required
                        value={infoForm.serviceDate}
                        onChange={(e) => setInfoForm({ ...infoForm, serviceDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nombre estimé de fidèles</label>
                      <input
                        type="number"
                        value={infoForm.attendanceCount}
                        onChange={(e) => setInfoForm({ ...infoForm, attendanceCount: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Grand Titre de la Célébration *</label>
                    <input
                      type="text"
                      required
                      value={infoForm.serviceTitle}
                      onChange={(e) => setInfoForm({ ...infoForm, serviceTitle: e.target.value })}
                      placeholder="Ex: Culte Dominical d’Adoration, Sainte Cène et Guérisons"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Prédicateur / Célébrant</label>
                      <input
                        type="text"
                        value={infoForm.preacherName}
                        onChange={(e) => setInfoForm({ ...infoForm, preacherName: e.target.value })}
                        placeholder="Ex: Pasteur Samuel Ondoa"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Thème & Passage Biblique</label>
                      <input
                        type="text"
                        value={infoForm.themePassage}
                        onChange={(e) => setInfoForm({ ...infoForm, themePassage: e.target.value })}
                        placeholder="Ex: Psaume 100:1-5"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Résumé Spirituel de la Célébration</label>
                    <textarea
                      rows={4}
                      value={infoForm.summary}
                      onChange={(e) => setInfoForm({ ...infoForm, summary: e.target.value })}
                      placeholder="Moments forts, actions de grâce, exhortation pastorale..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl leading-relaxed"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-bold rounded-xl shadow"
                    >
                      Enregistrer les détails du culte
                    </button>
                  </div>
                </form>
              )}

              {/* SUBTAB 2: Manage Photos */}
              {manageSubTab === 'add-photo' && (
                <div className="space-y-6">
                  {/* Add form */}
                  <form onSubmit={handleAddPhoto} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-800 block text-xs">Ajouter une nouvelle photo</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Titre de la photo *</label>
                        <input
                          type="text"
                          required
                          value={newPhotoForm.title}
                          onChange={(e) => setNewPhotoForm({ ...newPhotoForm, title: e.target.value })}
                          placeholder="Ex: Prédication pastorale"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Photographe / Crédit</label>
                        <input
                          type="text"
                          value={newPhotoForm.photographer}
                          onChange={(e) => setNewPhotoForm({ ...newPhotoForm, photographer: e.target.value })}
                          placeholder="Ex: Cellule Média EMF"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    {/* Chargement direct depuis le téléphone */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#4A0E17]">
                        <Smartphone className="w-4 h-4 text-[#C99B2E]" />
                        <span>Charger la photo depuis le téléphone :</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3 py-1.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1.5 shadow-2xs">
                          <Camera className="w-3.5 h-3.5 text-[#C99B2E]" />
                          <span>Prendre une photo (Caméra)</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhonePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        <label className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1.5 shadow-2xs">
                          <ImageIcon className="w-3.5 h-3.5 text-[#4A0E17]" />
                          <span>Choisir dans la galerie</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhonePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {isCompressingPhoto && (
                        <div className="text-[11px] text-blue-700 font-bold flex items-center space-x-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Optimisation de la photo mobile en cours...</span>
                        </div>
                      )}
                      {photoStats && !isCompressingPhoto && (
                        <p className="text-[11px] text-emerald-700 font-bold">{photoStats}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">URL de l'image (ou chargée ci-dessus) *</label>
                      <input
                        type="url"
                        required
                        value={newPhotoForm.url}
                        onChange={(e) => setNewPhotoForm({ ...newPhotoForm, url: e.target.value })}
                        placeholder="https://images.unsplash.com/... ou URL directe"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Légende / Description</label>
                      <input
                        type="text"
                        value={newPhotoForm.caption}
                        onChange={(e) => setNewPhotoForm({ ...newPhotoForm, caption: e.target.value })}
                        placeholder="Ex: Les fidèles réunis dans une ferveur d'adoration."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-bold rounded-xl shadow flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C99B2E]" />
                        <span>Publier la Photo</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Photos List */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700">Photos existantes ({photos.length})</h5>
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <img src={p.url} alt={p.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          <div className="truncate">
                            <h6 className="font-bold text-slate-900 truncate">{p.title}</h6>
                            <p className="text-[11px] text-slate-500 truncate">{p.caption || p.photographer}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeletePhoto(p.id, p.title)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: Manage Videos */}
              {manageSubTab === 'add-video' && (
                <div className="space-y-6">
                  {/* Add Video Form */}
                  <form onSubmit={handleAddVideo} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-800 block text-xs">Ajouter un enregistrement vidéo</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Titre de la vidéo *</label>
                        <input
                          type="text"
                          required
                          value={newVideoForm.title}
                          onChange={(e) => setNewVideoForm({ ...newVideoForm, title: e.target.value })}
                          placeholder="Ex: Culte Intégral du 27 Septembre"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Durée (ex: 1h 45m)</label>
                        <input
                          type="text"
                          value={newVideoForm.duration}
                          onChange={(e) => setNewVideoForm({ ...newVideoForm, duration: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    {/* Chargement direct vidéo téléphone */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#4A0E17]">
                        <Smartphone className="w-4 h-4 text-[#C99B2E]" />
                        <span>Charger la vidéo depuis le téléphone :</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3 py-1.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1.5 shadow-2xs">
                          <Camera className="w-3.5 h-3.5 text-[#C99B2E]" />
                          <span>Filmer une vidéo (Caméra)</span>
                          <input
                            type="file"
                            accept="video/*"
                            capture="environment"
                            onChange={handlePhoneVideoUpload}
                            className="hidden"
                          />
                        </label>
                        <label className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1.5 shadow-2xs">
                          <Film className="w-3.5 h-3.5 text-[#4A0E17]" />
                          <span>Vidéos de la galerie</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,video/*"
                            onChange={handlePhoneVideoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {isProcessingVideo && (
                        <div className="text-[11px] text-blue-700 font-bold flex items-center space-x-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Lecture de la vidéo mobile et capture de miniature...</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">URL de la Vidéo (ou chargée ci-dessus) *</label>
                        <input
                          type="url"
                          required
                          value={newVideoForm.url}
                          onChange={(e) => setNewVideoForm({ ...newVideoForm, url: e.target.value })}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">URL Miniature (Optionnel)</label>
                        <input
                          type="url"
                          value={newVideoForm.thumbnailUrl}
                          onChange={(e) => setNewVideoForm({ ...newVideoForm, thumbnailUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Prédicateur / Intervenant</label>
                        <input
                          type="text"
                          value={newVideoForm.preacher}
                          onChange={(e) => setNewVideoForm({ ...newVideoForm, preacher: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center space-x-2 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newVideoForm.isFullService}
                            onChange={(e) => setNewVideoForm({ ...newVideoForm, isFullService: e.target.checked })}
                            className="rounded text-[#6E1325]"
                          />
                          <span>Marquer comme « Culte Intégral »</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Description courte</label>
                      <textarea
                        rows={2}
                        value={newVideoForm.description}
                        onChange={(e) => setNewVideoForm({ ...newVideoForm, description: e.target.value })}
                        placeholder="Contenu du message ou des louanges..."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-bold rounded-xl shadow flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C99B2E]" />
                        <span>Ajouter la Vidéo</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Videos List */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700">Vidéos existantes ({videos.length})</h5>
                    {videos.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="truncate min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 truncate">{v.title}</span>
                            {v.isFullService && (
                              <span className="bg-amber-100 text-[#4A0E17] text-[10px] font-bold px-1.5 py-0.5 rounded">
                                Intégral
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {v.duration} • {v.preacher}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteVideo(v.id, v.title)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="px-5 py-2 bg-[#4A0E17] text-white text-xs font-bold rounded-xl hover:bg-[#6E1325] transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
