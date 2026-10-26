import React, { useState, useEffect } from 'react';
import {
  Film,
  Video,
  Image as ImageIcon,
  Play,
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  User,
  Clock,
  ExternalLink,
  CheckCircle,
  Sparkles,
  BookOpen,
  Camera,
  Youtube,
  Layers,
  Check,
  Smartphone,
  Cloud,
  Globe,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { LatestServiceMedia, ServiceMediaPhoto, ServiceMediaVideo } from '../types';
import { formatDateDouala } from '../utils/formatters';
import { compressImageFile, extractVideoMetadataAndThumbnail } from '../utils/mediaUpload';
import {
  isSupabaseConfigured,
  saveLatestServiceMediaToSupabase,
  subscribeToLatestServiceMedia,
} from '../services/supabase';

// Utility to extract YouTube video ID from various URL formats
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  // Fallback: if user directly pasted an 11-char ID
  if (url.trim().length === 11 && !url.includes('/') && !url.includes('.')) {
    return url.trim();
  }
  return null;
};

// Utility to extract Google Drive file ID
export const extractGoogleDriveId = (url: string): string | null => {
  if (!url) return null;
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const getGoogleDriveDirectImageUrl = (url: string): string => {
  const id = extractGoogleDriveId(url);
  if (id) {
    return `https://lh3.googleusercontent.com/d/${id}`;
  }
  return url;
};

export const getGoogleDrivePreviewEmbedUrl = (url: string): string => {
  const id = extractGoogleDriveId(url);
  if (id) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  return url;
};

export const MediaGalleryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isPastorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  const [serviceMedia, setServiceMedia] = useState<LatestServiceMedia | null>(null);
  const [activeMediaFilter, setActiveMediaFilter] = useState<'ALL' | 'PHOTOS' | 'VIDEOS'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Modals state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showServiceInfoModal, setShowServiceInfoModal] = useState(false);

  // Photo Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Video Player state
  const [activeVideo, setActiveVideo] = useState<ServiceMediaVideo | null>(null);

  // Source mode for modals
  const [photoSourceType, setPhotoSourceType] = useState<'PHONE' | 'DRIVE' | 'WEB'>('PHONE');
  const [videoSourceType, setVideoSourceType] = useState<'PHONE' | 'DRIVE' | 'YOUTUBE'>('PHONE');

  // Form states for Admin publishing
  const [photoForm, setPhotoForm] = useState({
    title: '',
    url: '',
    caption: '',
    photographer: 'Cellule Média EMF',
    category: 'Culte Dominical',
    date: new Date().toISOString().substring(0, 10),
    fileName: '',
    fileSizeMb: 0,
  });

  const [videoForm, setVideoForm] = useState({
    title: '',
    url: '',
    thumbnailUrl: '',
    duration: '45 min',
    preacher: 'Pasteur Samuel Ondoa',
    category: 'Culte Dominical',
    description: '',
    isFullService: false,
    date: new Date().toISOString().substring(0, 10),
    fileName: '',
    fileSizeMb: 0,
  });

  const [serviceInfoForm, setServiceInfoForm] = useState({
    serviceTitle: '',
    serviceDate: '',
    preacherName: '',
    themePassage: '',
    summary: '',
    attendanceCount: 250,
  });

  // Phone upload processing states
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [photoOptimizationStats, setPhotoOptimizationStats] = useState<{
    originalMb: number;
    compressedMb: number;
    reductionPercent: number;
  } | null>(null);
  const [batchPhotos, setBatchPhotos] = useState<
    { title: string; url: string; fileName: string; sizeMb: number; originalSizeMb: number }[]
  >([]);

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();

    // Abonnement temps réel Supabase
    const unsubscribeMedia = subscribeToLatestServiceMedia((updated) => {
      if (updated) {
        setServiceMedia(updated);
      }
    });

    return () => {
      unsubscribeMedia();
    };
  }, []);

  const loadData = async () => {
    const data = await apiClient.getLatestServiceMedia();
    setServiceMedia(data);
    if (data) {
      setServiceInfoForm({
        serviceTitle: data.serviceTitle,
        serviceDate: data.serviceDate,
        preacherName: data.preacherName,
        themePassage: data.themePassage,
        summary: data.summary,
        attendanceCount: data.attendanceCount || 250,
      });
      setPhotoForm((prev) => ({ ...prev, date: data.serviceDate }));
      setVideoForm((prev) => ({ ...prev, date: data.serviceDate, preacher: data.preacherName }));
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Synchronisation manuelle administrateur vers Supabase
  const handleAdminSync = async () => {
    if (!serviceMedia) return;
    setIsSyncing(true);
    try {
      if (isSupabaseConfigured()) {
        const res = await saveLatestServiceMediaToSupabase(serviceMedia);
        if (res.success) {
          showToast('✓ Médiathèque enregistrée et synchronisée avec Supabase !');
        } else {
          showToast(`Erreur Supabase: ${res.error || 'Vérifiez la table church_settings'}`);
        }
      } else {
        await apiClient.updateLatestServiceMedia(serviceMedia, currentUser || undefined);
        showToast('✓ Données enregistrées en local (Supabase non configuré).');
      }
    } catch (err: any) {
      showToast('Erreur lors de la synchronisation.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Single Photo File Pick from Phone (Camera or Gallery)
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const res = await compressImageFile(file);
      const reduction = Math.round((1 - res.sizeMb / (res.originalSizeMb || 1)) * 100);
      setPhotoOptimizationStats({
        originalMb: res.originalSizeMb,
        compressedMb: res.sizeMb,
        reductionPercent: Math.max(0, reduction),
      });
      setBatchPhotos([]);
      setPhotoForm((prev) => ({
        ...prev,
        url: res.dataUrl,
        fileName: file.name,
        fileSizeMb: res.sizeMb,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
      showToast(`✓ Photo optimisée : ${res.originalSizeMb} Mo ➔ ${res.sizeMb} Mo (${reduction}% plus léger)`);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la compression de la photo");
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Handle Multi-Photo File Pick from Phone Gallery
  const handleMultiPhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhoto(true);
    try {
      const list: {
        title: string;
        url: string;
        fileName: string;
        sizeMb: number;
        originalSizeMb: number;
      }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await compressImageFile(file);
        list.push({
          title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          url: res.dataUrl,
          fileName: file.name,
          sizeMb: res.sizeMb,
          originalSizeMb: res.originalSizeMb,
        });
      }

      if (list.length === 1) {
        const single = list[0];
        const reduction = Math.round((1 - single.sizeMb / (single.originalSizeMb || 1)) * 100);
        setPhotoOptimizationStats({
          originalMb: single.originalSizeMb,
          compressedMb: single.sizeMb,
          reductionPercent: Math.max(0, reduction),
        });
        setBatchPhotos([]);
        setPhotoForm((prev) => ({
          ...prev,
          url: single.url,
          fileName: single.fileName,
          fileSizeMb: single.sizeMb,
          title: prev.title || single.title,
        }));
        showToast(`✓ Photo chargée (${single.sizeMb} Mo)`);
      } else {
        setBatchPhotos(list);
        setPhotoOptimizationStats(null);
        setPhotoForm((prev) => ({
          ...prev,
          url: list[0].url,
          fileName: `${list.length} photos sélectionnées`,
          fileSizeMb: Number(list.reduce((acc, p) => acc + p.sizeMb, 0).toFixed(2)),
          title: prev.title || `Photos du Culte (${list.length} images)`,
        }));
        showToast(`✓ ${list.length} photos chargées depuis votre téléphone !`);
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'importation des photos");
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Handle Photo Google Drive link
  const handlePhotoDriveLink = (driveUrl: string) => {
    const directUrl = getGoogleDriveDirectImageUrl(driveUrl);
    setPhotoForm((prev) => ({
      ...prev,
      url: directUrl,
    }));
  };

  // Handle Video File Pick from Phone (Camera or Gallery)
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingVideo(true);
    try {
      const meta = await extractVideoMetadataAndThumbnail(file);
      setVideoForm((prev) => ({
        ...prev,
        url: meta.videoUrl,
        thumbnailUrl: meta.thumbnailUrl || prev.thumbnailUrl,
        duration: meta.durationText,
        fileName: file.name,
        fileSizeMb: meta.sizeMb,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
      showToast(`✓ Vidéo mobile prête (${meta.sizeMb} Mo, ${meta.durationText})`);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la lecture du fichier vidéo");
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // Handle Video Google Drive link
  const handleVideoDriveLink = (driveUrl: string) => {
    setVideoForm((prev) => ({
      ...prev,
      url: driveUrl,
    }));
  };

  // Publish Photo
  const handlePublishPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoForm.title || !photoForm.url) {
      showToast('Veuillez renseigner le titre et charger une photo depuis votre téléphone, Google Drive ou un lien.');
      return;
    }

    if (batchPhotos.length > 1) {
      for (const item of batchPhotos) {
        await apiClient.addServicePhoto(
          {
            ...photoForm,
            title: item.title,
            url: item.url,
            sourceType: 'PHONE',
          },
          currentUser || undefined
        );
      }
      showToast(`✓ ${batchPhotos.length} photos du téléphone publiées dans la galerie !`);
      setBatchPhotos([]);
    } else {
      await apiClient.addServicePhoto(
        {
          ...photoForm,
          sourceType: photoSourceType,
        },
        currentUser || undefined
      );
      showToast('✓ Photo publiée avec succès dans la galerie.');
    }

    setShowPhotoModal(false);
    setPhotoForm({
      title: '',
      url: '',
      caption: '',
      photographer: 'Cellule Média EMF',
      category: 'Culte Dominical',
      date: serviceMedia?.serviceDate || new Date().toISOString().substring(0, 10),
      fileName: '',
      fileSizeMb: 0,
    });
    setPhotoOptimizationStats(null);
    loadData();
  };

  // Publish Video (YouTube / Google Drive / Téléphone)
  const handlePublishVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.url) {
      showToast('Veuillez renseigner le titre et charger une vidéo (téléphone, Drive ou YouTube).');
      return;
    }

    const yId = getYouTubeVideoId(videoForm.url);
    const isDrive = videoForm.url.includes('drive.google.com');
    const autoThumb = yId
      ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg`
      : isDrive
      ? 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
      : '';

    await apiClient.addServiceVideo(
      {
        ...videoForm,
        youtubeId: yId || undefined,
        thumbnailUrl: videoForm.thumbnailUrl || autoThumb,
        sourceType: isDrive ? 'DRIVE' : yId ? 'YOUTUBE' : videoSourceType,
      },
      currentUser || undefined
    );

    setShowVideoModal(false);
    setVideoForm({
      title: '',
      url: '',
      thumbnailUrl: '',
      duration: '45 min',
      preacher: serviceMedia?.preacherName || 'Pasteur Samuel Ondoa',
      category: 'Culte Dominical',
      description: '',
      isFullService: false,
      date: serviceMedia?.serviceDate || new Date().toISOString().substring(0, 10),
      fileName: '',
      fileSizeMb: 0,
    });
    showToast('✓ Vidéo publiée avec succès dans la galerie.');
    loadData();
  };

  // Update Service Metadata
  const handleUpdateServiceInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.updateLatestServiceMedia(serviceInfoForm, currentUser || undefined);
    setShowServiceInfoModal(false);
    showToast('✓ Informations du culte mises à jour.');
    loadData();
  };

  // Delete Photo
  const handleDeletePhoto = async (photoId: string, title: string) => {
    if (confirm(`Confirmer la suppression de la photo "${title}" ?`)) {
      await apiClient.deleteServicePhoto(photoId, currentUser || undefined);
      showToast('Photo supprimée de la galerie.');
      loadData();
    }
  };

  // Delete Video
  const handleDeleteVideo = async (videoId: string, title: string) => {
    if (confirm(`Confirmer la suppression de la vidéo "${title}" ?`)) {
      await apiClient.deleteServiceVideo(videoId, currentUser || undefined);
      showToast('Vidéo supprimée de la galerie.');
      loadData();
    }
  };

  const photos = serviceMedia?.photos || [];
  const videos = serviceMedia?.videos || [];

  // Filter photos
  const filteredPhotos = photos.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(q) ||
      (p.caption && p.caption.toLowerCase().includes(q)) ||
      (p.photographer && p.photographer.toLowerCase().includes(q)) ||
      (p.date && p.date.includes(q));

    const matchesCat =
      selectedCategory === 'ALL' || (p.category && p.category === selectedCategory);

    return matchesSearch && matchesCat;
  });

  // Filter videos
  const filteredVideos = videos.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      v.title.toLowerCase().includes(q) ||
      (v.description && v.description.toLowerCase().includes(q)) ||
      (v.preacher && v.preacher.toLowerCase().includes(q)) ||
      (v.date && v.date.includes(q));

    const matchesCat =
      selectedCategory === 'ALL' || (v.category && v.category === selectedCategory);

    return matchesSearch && matchesCat;
  });

  // Lightbox navigation
  const currentLightboxPhoto =
    lightboxIndex !== null && filteredPhotos[lightboxIndex]
      ? filteredPhotos[lightboxIndex]
      : null;

  const nextLightbox = () => {
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
    }
  };

  const prevLightbox = () => {
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  };

  // Auto-detect YouTube thumbnail for modal preview
  const detectedVideoId = getYouTubeVideoId(videoForm.url);
  const previewThumbnail =
    videoForm.thumbnailUrl ||
    (detectedVideoId ? `https://img.youtube.com/vi/${detectedVideoId}/hqdefault.jpg` : '');

  const categoriesList = [
    'ALL',
    'Culte Dominical',
    'Culte de Prière & Intercession',
    'Veillée & Nuit d’Impact',
    'Louange & Adoration',
    'Baptêmes & Événements',
    'Jeunesse & Ecodim',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C99B2E]/20 text-[#C99B2E] text-xs font-bold uppercase tracking-wider border border-[#C99B2E]/30">
              <Film className="w-4 h-4" />
              <span>Médiathèque Multimédia • Église de Sangmelima</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Galerie des Cultes & Célébrations
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Revivez en images et en vidéos YouTube les cultes dominicaux, les temps de louange et les prédications inspirantes de notre communauté à Sangmelima.
            </p>
          </div>

          {/* Admin Publishing Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isPastorOrAdmin ? (
              <>
                <button
                  onClick={handleAdminSync}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  title="Enregistrer et synchroniser les photos et vidéos dans Supabase"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#4A0E17]" />
                  ) : (
                    <Cloud className="w-4 h-4 text-[#4A0E17]" />
                  )}
                  <span>Enregistrer dans Supabase</span>
                </button>

                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Publier une Photo (Téléphone)</span>
                </button>

                <button
                  onClick={() => setShowVideoModal(true)}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Publier une Vidéo (Téléphone)</span>
                </button>

                <button
                  onClick={() => setShowServiceInfoModal(true)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/20 cursor-pointer"
                  title="Modifier les détails du culte en vedette"
                >
                  <Edit2 className="w-4 h-4 text-[#C99B2E]" />
                </button>
              </>
            ) : (
              <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/20 text-xs text-slate-200 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#C99B2E]" />
                <span>Photos haute définition & replays YouTube</span>
              </div>
            )}
          </div>
        </div>

        {/* Featured Service Ribbon */}
        {serviceMedia && (
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-full bg-[#C99B2E] text-[#4A0E17] font-black uppercase text-[10px]">
                Dernier Culte
              </span>
              <span className="font-bold text-white text-sm">
                {serviceMedia.serviceTitle}
              </span>
              <span className="text-slate-300">• {formatDateDouala(serviceMedia.serviceDate)}</span>
            </div>

            <div className="flex items-center space-x-4 text-slate-300 text-xs">
              <div>
                <strong>Prédicateur :</strong> {serviceMedia.preacherName}
              </div>
              <div>
                <strong>Thème :</strong> {serviceMedia.themePassage}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Media Type Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveMediaFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeMediaFilter === 'ALL'
                ? 'bg-white text-[#4A0E17] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>Tous les Médias ({photos.length + videos.length})</span>
          </button>

          <button
            onClick={() => setActiveMediaFilter('PHOTOS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeMediaFilter === 'PHOTOS'
                ? 'bg-white text-[#4A0E17] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Photos ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveMediaFilter('VIDEOS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeMediaFilter === 'VIDEOS'
                ? 'bg-white text-[#4A0E17] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-red-600" />
            <span>Vidéos YouTube ({videos.length})</span>
          </button>
        </div>

        {/* Category & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Recherche prédicateur, titre, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#6E1325]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
          >
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'Toutes les catégories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION: YOUTUBE VIDEOS                                  */}
      {/* ======================================================== */}
      {(activeMediaFilter === 'ALL' || activeMediaFilter === 'VIDEOS') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Youtube className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-[#4A0E17]">
                Vidéos & Prédications des Cultes ({filteredVideos.length})
              </h2>
            </div>
            {isPastorOrAdmin && (
              <button
                onClick={() => setShowVideoModal(true)}
                className="text-xs font-bold text-[#6E1325] hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une vidéo (Téléphone / Drive / YouTube)</span>
              </button>
            )}
          </div>

          {filteredVideos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-200">
              Aucune vidéo YouTube ne correspond à vos filtres.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => {
                const yId = video.youtubeId || getYouTubeVideoId(video.url);
                const thumb =
                  video.thumbnailUrl ||
                  (yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : '');

                return (
                  <div
                    key={video.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
                  >
                    {/* Video Thumbnail with Play Button */}
                    <div
                      onClick={() => setActiveVideo(video)}
                      className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden group"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                          <Film className="w-12 h-12" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-6 h-6 fill-current translate-x-0.5" />
                        </div>
                      </div>

                      {/* Duration Badge */}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[10px] font-bold">
                          {video.duration}
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#4A0E17]/90 text-[#C99B2E] text-[10px] font-bold">
                        {video.category || 'Culte'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3
                          onClick={() => setActiveVideo(video)}
                          className="font-black text-slate-900 text-sm hover:text-[#6E1325] cursor-pointer line-clamp-2 leading-snug"
                        >
                          {video.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {video.description || 'Enregistrement de culte diffusé sur la chaîne YouTube de l’église.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{video.preacher || 'Orateur'}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {video.date && (
                            <span className="text-[10px] text-slate-400">
                              {formatDateDouala(video.date)}
                            </span>
                          )}

                          {isPastorOrAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVideo(video.id, video.title);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Supprimer la vidéo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: PHOTOS OF RECENT SERVICES                       */}
      {/* ======================================================== */}
      {(activeMediaFilter === 'ALL' || activeMediaFilter === 'PHOTOS') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-[#4A0E17]">
                Clichés & Photos des Cultes ({filteredPhotos.length})
              </h2>
            </div>
            {isPastorOrAdmin && (
              <button
                onClick={() => setShowPhotoModal(true)}
                className="text-xs font-bold text-[#6E1325] hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une photo (Téléphone / Drive)</span>
              </button>
            )}
          </div>

          {filteredPhotos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-200">
              Aucune photo ne correspond à vos filtres.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 cursor-pointer shadow-xs hover:shadow-md transition"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 text-[#C99B2E] text-[10px] font-bold">
                        {photo.category || 'Culte'}
                      </span>

                      {isPastorOrAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id, photo.title);
                          }}
                          className="p-1 rounded bg-black/60 text-white/80 hover:text-rose-400 hover:bg-black/90 transition"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <h4 className="text-white text-xs font-bold line-clamp-1">
                        {photo.title}
                      </h4>
                      <p className="text-[10px] text-slate-300 truncate mt-0.5">
                        {photo.caption || photo.photographer || 'EMF Sangmelima'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: YOUTUBE VIDEO PLAYER                              */}
      {/* ======================================================== */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Top Bar */}
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-sm truncate max-w-xl">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-[#6E1325]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black w-full relative">
              {(() => {
                const yId = activeVideo.youtubeId || getYouTubeVideoId(activeVideo.url);
                const driveId = extractGoogleDriveId(activeVideo.url);

                if (yId) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${yId}?autoplay=1&rel=0`}
                      title={activeVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  );
                }

                if (driveId || activeVideo.sourceType === 'DRIVE') {
                  const embedUrl = driveId
                    ? `https://drive.google.com/file/d/${driveId}/preview`
                    : activeVideo.url;
                  return (
                    <iframe
                      src={embedUrl}
                      title={activeVideo.title}
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  );
                }

                // Phone / local / blob / MP4 video
                return (
                  <video
                    src={activeVideo.url}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    Votre navigateur ne prend pas en charge la lecture de cette vidéo.
                  </video>
                );
              })()}
            </div>

            {/* Video Details */}
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-[#4A0E17]">{activeVideo.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span><strong>Prédicateur :</strong> {activeVideo.preacher || 'Orateur'}</span>
                    <span>•</span>
                    <span><strong>Date :</strong> {activeVideo.date ? formatDateDouala(activeVideo.date) : 'Dernier Culte'}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {activeVideo.category || 'Culte Dominical'}
                    </span>
                    {activeVideo.sourceType && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                        {activeVideo.sourceType === 'PHONE' ? '📱 Téléphone' : activeVideo.sourceType === 'DRIVE' ? '📁 Google Drive' : '📺 YouTube'}
                      </span>
                    )}
                  </div>
                </div>

                {(() => {
                  const yId = activeVideo.youtubeId || getYouTubeVideoId(activeVideo.url);
                  const isDrive = activeVideo.url.includes('drive.google.com') || activeVideo.sourceType === 'DRIVE';
                  if (yId) {
                    return (
                      <a
                        href={activeVideo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ouvrir sur YouTube</span>
                      </a>
                    );
                  }
                  if (isDrive) {
                    return (
                      <a
                        href={activeVideo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
                      >
                        <Cloud className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ouvrir sur Google Drive</span>
                      </a>
                    );
                  }
                  return (
                    <a
                      href={activeVideo.url}
                      download={activeVideo.fileName || `${activeVideo.title}.mp4`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger la vidéo</span>
                    </a>
                  );
                })()}
              </div>

              {activeVideo.description && (
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <h4 className="font-bold text-slate-800 mb-1">Résumé du message :</h4>
                  <p>{activeVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PHOTO LIGHTBOX VIEWER                             */}
      {/* ======================================================== */}
      {currentLightboxPhoto && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
          >
            {/* Controls */}
            <div className="w-full flex items-center justify-between text-white pb-3 px-2">
              <div>
                <h4 className="text-sm font-bold">{currentLightboxPhoto.title}</h4>
                <p className="text-[11px] text-slate-400">
                  {currentLightboxPhoto.caption || currentLightboxPhoto.photographer || 'EMF Sangmelima'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={currentLightboxPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                  title="Télécharger l'image"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo Image Display */}
            <div className="relative flex items-center justify-center w-full max-h-[75vh]">
              <img
                src={currentLightboxPhoto.url}
                alt={currentLightboxPhoto.title}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />

              {/* Prev / Next Arrows */}
              {filteredPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevLightbox}
                    className="absolute left-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextLightbox}
                    className="absolute right-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="text-[11px] text-slate-400 pt-3">
              Photo {(lightboxIndex || 0) + 1} sur {filteredPhotos.length}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADMIN PUBLISH PHOTO                               */}
      {/* ======================================================== */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Publier une Photo de Culte</h3>
              </div>
              <button onClick={() => setShowPhotoModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishPhoto} className="p-6 space-y-4 text-xs">
              {/* Source Mode Selector: Téléphone vs Google Drive vs Lien Web */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Source de l'image (Téléphone, Google Drive ou Lien Web) :
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoSourceType('PHONE');
                      if (photoForm.url.startsWith('https://lh3.googleusercontent.com') || photoForm.url.includes('drive.google.com')) {
                        setPhotoForm((p) => ({ ...p, url: '' }));
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      photoSourceType === 'PHONE'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#C99B2E]" />
                    <span>Téléphone / Fichier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoSourceType('DRIVE');
                      if (photoForm.url.startsWith('data:')) {
                        setPhotoForm((p) => ({ ...p, url: '' }));
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      photoSourceType === 'DRIVE'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <span>Google Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoSourceType('WEB')}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      photoSourceType === 'WEB'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Lien Web</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: Phone / Computer File Upload */}
              {photoSourceType === 'PHONE' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-2 border-dashed border-[#C99B2E]/50 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-[#4A0E17]">
                    <Smartphone className="w-6 h-6 text-[#C99B2E]" />
                  </div>

                  <div className="space-y-1">
                    <p className="font-extrabold text-sm text-[#4A0E17]">
                      Charger directement depuis votre téléphone
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Prenez une photo en direct avec l'appareil photo ou sélectionnez une ou plusieurs photos depuis votre galerie.
                    </p>
                  </div>

                  {/* Dual Action Buttons: Camera vs Gallery */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                    {/* Bouton 1 : Appareil photo direct */}
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center space-x-2 text-xs">
                      <Camera className="w-4 h-4 text-[#C99B2E]" />
                      <span>Prendre une photo (Caméra)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Bouton 2 : Galerie de photos (choix multiple) */}
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center space-x-2 text-xs">
                      <ImageIcon className="w-4 h-4 text-[#4A0E17]" />
                      <span>Galerie (Multi-photos)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultiPhotoFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Processing Spinner */}
                  {isProcessingPhoto && (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-xl flex items-center justify-center space-x-2 text-xs font-bold animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Optimisation et compression des photos du téléphone en cours...</span>
                    </div>
                  )}

                  {/* Optimization Badge */}
                  {photoOptimizationStats && !isProcessingPhoto && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-bold flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Photo optimisée : {photoOptimizationStats.originalMb} Mo ➔ {photoOptimizationStats.compressedMb} Mo (-{photoOptimizationStats.reductionPercent}% d'espace, affichage ultra-rapide)
                      </span>
                    </div>
                  )}

                  {/* Multi-Photos Selected Preview Grid */}
                  {batchPhotos.length > 1 && !isProcessingPhoto && (
                    <div className="space-y-2 pt-2 border-t border-amber-200/60">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>{batchPhotos.length} photos prêtes à être publiées :</span>
                        <button
                          type="button"
                          onClick={() => setBatchPhotos([])}
                          className="text-rose-600 hover:underline text-[11px]"
                        >
                          Réinitialiser
                        </button>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                        {batchPhotos.map((p, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-2xs group">
                            <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] truncate px-1 text-center font-bold">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {photoForm.fileName && batchPhotos.length <= 1 && (
                    <p className="text-[11px] font-mono text-slate-600">
                      Fichier sélectionné : <strong className="text-slate-900">{photoForm.fileName}</strong> ({photoForm.fileSizeMb} Mo)
                    </p>
                  )}
                </div>
              )}

              {/* Mode 2: Google Drive Sharing Link */}
              {photoSourceType === 'DRIVE' && (
                <div className="space-y-2 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <div className="flex items-center space-x-1.5 text-blue-900 font-bold">
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <span>Lien de partage Google Drive :</span>
                  </div>
                  <input
                    type="url"
                    placeholder="Ex: https://drive.google.com/file/d/1a2b3c.../view?usp=sharing"
                    onChange={(e) => handlePhotoDriveLink(e.target.value)}
                    className="w-full px-3.5 py-2 border border-blue-200 rounded-xl font-mono text-[11px] bg-white"
                  />
                  <p className="text-[10px] text-blue-800 leading-relaxed">
                    💡 Astuce Drive : Faites un clic droit sur le fichier dans Google Drive &rarr; Partager &rarr; Régler sur <strong>« Tous les utilisateurs disposant du lien peuvent voir »</strong>.
                  </p>
                  {photoForm.url && (photoForm.url.startsWith('https://lh3.googleusercontent.com') || photoForm.url.includes('drive.google.com')) && (
                    <span className="text-[11px] text-emerald-700 font-bold block">
                      ✓ Fichier Google Drive reconnu et prêt pour affichage haute résolution !
                    </span>
                  )}
                </div>
              )}

              {/* Mode 3: Direct Web Link */}
              {photoSourceType === 'WEB' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL directe de l'image *</label>
                  <input
                    type="url"
                    required={photoSourceType === 'WEB'}
                    placeholder="https://images.unsplash.com/... ou lien web image"
                    value={photoForm.url}
                    onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>
              )}

              {/* Preview */}
              {photoForm.url && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                  <img
                    src={photoForm.url}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.target as any).style.display = 'none')}
                  />
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-bold">
                    Aperçu en direct
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de la photo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assemblée fervente lors de la louange"
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={photoForm.category}
                    onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Culte Dominical">Culte Dominical</option>
                    <option value="Culte de Prière & Intercession">Culte de Prière</option>
                    <option value="Louange & Adoration">Louange & Adoration</option>
                    <option value="Veillée & Nuit d’Impact">Veillée & Nuit d’Impact</option>
                    <option value="Baptêmes & Événements">Baptêmes & Événements</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date du culte</label>
                  <input
                    type="date"
                    value={photoForm.date}
                    onChange={(e) => setPhotoForm({ ...photoForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Photographe / Crédit</label>
                  <input
                    type="text"
                    value={photoForm.photographer}
                    onChange={(e) => setPhotoForm({ ...photoForm, photographer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Légende / Moment</label>
                  <input
                    type="text"
                    placeholder="Ex: Moment d'intercession pastorale"
                    value={photoForm.caption}
                    onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition"
                >
                  Publier la photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADMIN PUBLISH YOUTUBE VIDEO                       */}
      {/* ======================================================== */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">Publier une Vidéo de Culte</h3>
              </div>
              <button onClick={() => setShowVideoModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishVideo} className="p-6 space-y-4 text-xs">
              {/* Source Mode Selector: Téléphone vs Google Drive vs YouTube */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Source de la vidéo (Téléphone, Google Drive ou YouTube) :
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSourceType('PHONE');
                      if (videoForm.url.includes('youtube.com') || videoForm.url.includes('youtu.be') || videoForm.url.includes('drive.google.com')) {
                        setVideoForm((v) => ({ ...v, url: '' }));
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      videoSourceType === 'PHONE'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#C99B2E]" />
                    <span>Téléphone / Fichier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSourceType('DRIVE');
                      if (videoForm.url.startsWith('blob:') || videoForm.url.startsWith('data:')) {
                        setVideoForm((v) => ({ ...v, url: '' }));
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      videoSourceType === 'DRIVE'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <span>Google Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('YOUTUBE')}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      videoSourceType === 'YOUTUBE'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span>YouTube</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: Phone / Computer File Upload */}
              {videoSourceType === 'PHONE' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-2 border-dashed border-[#C99B2E]/50 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-[#4A0E17]">
                    <Video className="w-6 h-6 text-[#C99B2E]" />
                  </div>

                  <div className="space-y-1">
                    <p className="font-extrabold text-sm text-[#4A0E17]">
                      Charger une vidéo depuis votre téléphone
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Enregistrez une vidéo en direct avec votre caméra ou sélectionnez un extrait depuis vos fichiers vidéo (MP4, WebM, MOV).
                    </p>
                  </div>

                  {/* Dual Video Action Buttons: Camera vs Gallery */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                    {/* Bouton 1 : Enregistrer une vidéo en direct */}
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center space-x-2 text-xs">
                      <Camera className="w-4 h-4 text-[#C99B2E]" />
                      <span>Filmer une vidéo (Caméra)</span>
                      <input
                        type="file"
                        accept="video/*"
                        capture="environment"
                        onChange={handleVideoFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Bouton 2 : Galerie de vidéos du téléphone */}
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center space-x-2 text-xs">
                      <Film className="w-4 h-4 text-[#4A0E17]" />
                      <span>Vidéos de la galerie</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        onChange={handleVideoFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Processing Video Spinner */}
                  {isProcessingVideo && (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-xl flex items-center justify-center space-x-2 text-xs font-bold animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Lecture et génération de la miniature vidéo en cours...</span>
                    </div>
                  )}

                  {videoForm.fileName && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-bold flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Vidéo prête : {videoForm.fileName} ({videoForm.fileSizeMb} Mo, durée détectée : {videoForm.duration})
                      </span>
                    </div>
                  )}

                  {videoForm.url && (
                    <div className="space-y-1.5 pt-1 text-left">
                      <span className="text-[11px] font-bold text-slate-700">Aperçu du fichier vidéo mobile :</span>
                      <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                        <video src={videoForm.url} controls playsInline className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Google Drive Sharing Link */}
              {videoSourceType === 'DRIVE' && (
                <div className="space-y-2 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <div className="flex items-center space-x-1.5 text-blue-900 font-bold">
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <span>Lien de partage vidéo Google Drive :</span>
                  </div>
                  <input
                    type="url"
                    placeholder="Ex: https://drive.google.com/file/d/1a2b3c.../view?usp=sharing"
                    value={videoForm.url}
                    onChange={(e) => handleVideoDriveLink(e.target.value)}
                    className="w-full px-3.5 py-2 border border-blue-200 rounded-xl font-mono text-[11px] bg-white"
                  />
                  <p className="text-[10px] text-blue-800 leading-relaxed">
                    💡 Astuce Drive : Assurez-vous que le fichier vidéo sur Google Drive est partagé avec <strong>« Tous les utilisateurs disposant du lien peuvent voir »</strong>.
                  </p>
                  {(() => {
                    const driveId = extractGoogleDriveId(videoForm.url);
                    if (driveId) {
                      return (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] text-emerald-700 font-bold block">
                            ✓ ID vidéo Drive détecté : {driveId}
                          </span>
                          <div className="aspect-video rounded-xl overflow-hidden border border-blue-200 bg-black">
                            <iframe
                              src={`https://drive.google.com/file/d/${driveId}/preview`}
                              title="Aperçu Drive"
                              allow="autoplay; fullscreen"
                              className="w-full h-full border-0"
                            />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Mode 3: YouTube */}
              {videoSourceType === 'YOUTUBE' && (
                <div className="space-y-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lien de la Vidéo YouTube *</label>
                    <input
                      type="text"
                      required={videoSourceType === 'YOUTUBE'}
                      placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                      value={videoForm.url}
                      onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-[11px]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      La miniature et le lecteur seront intégrés automatiquement depuis YouTube
                    </span>
                  </div>

                  {(() => {
                    const yId = getYouTubeVideoId(videoForm.url);
                    if (yId) {
                      const thumb = `https://img.youtube.com/vi/${yId}/hqdefault.jpg`;
                      return (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black">
                          <img
                            src={thumb}
                            alt="Aperçu YouTube"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                              <Play className="w-5 h-5 fill-current" />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de la vidéo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Culte de Victoire et de Louange - Pasteur Samuel Ondoa"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prédicateur / Intervenant</label>
                  <input
                    type="text"
                    value={videoForm.preacher}
                    onChange={(e) => setVideoForm({ ...videoForm, preacher: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durée approximative</label>
                  <input
                    type="text"
                    placeholder="Ex: 1h 15m ou 45 min"
                    value={videoForm.duration}
                    onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={videoForm.category}
                    onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Culte Dominical">Culte Dominical</option>
                    <option value="Culte de Prière & Intercession">Culte de Prière</option>
                    <option value="Louange & Adoration">Louange & Adoration</option>
                    <option value="Veillée & Nuit d’Impact">Veillée & Nuit d’Impact</option>
                    <option value="Baptêmes & Événements">Baptêmes & Événements</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date du culte</label>
                  <input
                    type="date"
                    value={videoForm.date}
                    onChange={(e) => setVideoForm({ ...videoForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Points clés</label>
                <textarea
                  rows={2}
                  placeholder="Texte biblique abordé, message principal..."
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold rounded-xl shadow transition cursor-pointer"
                >
                  {videoSourceType === 'PHONE'
                    ? 'Publier la vidéo (téléphone)'
                    : videoSourceType === 'DRIVE'
                    ? 'Publier la vidéo (Google Drive)'
                    : 'Publier la vidéo (YouTube)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADMIN EDIT SERVICE INFO                           */}
      {/* ======================================================== */}
      {showServiceInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Paramètres du Culte en Vedette</h3>
              <button onClick={() => setShowServiceInfoModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateServiceInfo} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre du Culte</label>
                <input
                  type="text"
                  required
                  value={serviceInfoForm.serviceTitle}
                  onChange={(e) => setServiceInfoForm({ ...serviceInfoForm, serviceTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date du culte</label>
                  <input
                    type="date"
                    required
                    value={serviceInfoForm.serviceDate}
                    onChange={(e) => setServiceInfoForm({ ...serviceInfoForm, serviceDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prédicateur</label>
                  <input
                    type="text"
                    required
                    value={serviceInfoForm.preacherName}
                    onChange={(e) => setServiceInfoForm({ ...serviceInfoForm, preacherName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Passage / Thème</label>
                <input
                  type="text"
                  value={serviceInfoForm.themePassage}
                  onChange={(e) => setServiceInfoForm({ ...serviceInfoForm, themePassage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Résumé du culte</label>
                <textarea
                  rows={3}
                  value={serviceInfoForm.summary}
                  onChange={(e) => setServiceInfoForm({ ...serviceInfoForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowServiceInfoModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
