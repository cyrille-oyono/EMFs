import React, { useState, useEffect } from 'react';
import {
  Church,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Heart,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sun,
  Flame,
  Users,
  Shield,
  Download,
  Share2,
  X,
  Globe,
  Plus,
  Edit2,
  Sparkles,
  User as UserIcon,
  RefreshCw,
  LogIn,
  UserPlus,
  Save,
  CheckCircle,
  Camera,
  Smartphone,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Maximize2,
  ZoomIn,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { churchSyncService } from '../services/churchSyncService';
import {
  HomepageSection,
  Event,
  Testimonial,
  DailyBibleVerse,
  MediaItem,
  HomepageCarouselSlide,
  LatestServiceMedia,
  Announcement,
  WeeklyProgram,
} from '../types';
import { formatDateDouala } from '../utils/formatters';

import { ChurchLogo } from '../components/common/ChurchLogo';
import { HomeCarousel } from '../components/home/HomeCarousel';
import { ManageCarouselModal } from '../components/home/ManageCarouselModal';
import {
  ManageWeeklyProgramsModal,
  renderProgramIcon,
  getProgramColorClasses,
} from '../components/home/ManageWeeklyProgramsModal';
import { LatestServiceMediaSection } from '../components/media/LatestServiceMediaSection';
import { ChurchSocialsSection } from '../components/home/ChurchSocialsSection';
import { JoinCommunityModal } from '../components/home/JoinCommunityModal';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { InteractiveHomeCalendar } from '../components/home/InteractiveHomeCalendar';
import { FooterChurchEditorModal } from '../components/home/FooterChurchEditorModal';
import { ManagePresentationImageModal } from '../components/home/ManagePresentationImageModal';
import { RandomVerseSection } from '../components/home/RandomVerseSection';
import {
  subscribeToCMSState,
  subscribeToAppContent,
  subscribeToDynamicPosts,
  FALLBACK_DYNAMIC_POSTS,
} from '../services/supabase';
import { DynamicPost } from '../types';
import { Storage } from '../server/storage';
import {
  INITIAL_HOMEPAGE_SECTIONS,
  INITIAL_CAROUSEL_SLIDES,
  INITIAL_WEEKLY_PROGRAMS,
  INITIAL_LATEST_SERVICE_MEDIA,
  INITIAL_EVENTS,
  INITIAL_TESTIMONIALS,
  INITIAL_MEDIA,
} from '../server/initialData';

interface PublicHomePageProps {
  onGoToDashboard: () => void;
  onGoToCMS: () => void;
  onGoToPrayers?: () => void;
  onNavigateToPage?: (page: string) => void;
  onOpenPublish?: () => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({
  onGoToDashboard,
  onGoToCMS,
  onGoToPrayers,
  onNavigateToPage,
  onOpenPublish,
  onOpenAuth,
}) => {
  const { settings, currentUser, refreshSettings, updateSettings } = useAuth();
  
  const [sections, setSections] = useState<HomepageSection[]>(() => {
    try {
      const s = Storage.getPublicHomepageSections();
      if (Array.isArray(s)) return s;
      return [];
    } catch {
      return [];
    }
  });
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const e = Storage.getEvents();
      if (Array.isArray(e)) return e;
      return [];
    } catch {
      return [];
    }
  });
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    try {
      const t = Storage.getTestimonials(true);
      if (Array.isArray(t)) return t;
      return [];
    } catch {
      return [];
    }
  });
  const [todayVerse, setTodayVerse] = useState<DailyBibleVerse | undefined>(() => {
    try {
      return Storage.getTodayVerse();
    } catch {
      return undefined;
    }
  });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    try {
      const m = Storage.getMediaItems();
      if (Array.isArray(m)) return m;
      return [];
    } catch {
      return [];
    }
  });
  const [latestServiceMedia, setLatestServiceMedia] = useState<LatestServiceMedia>(() => {
    try {
      const m = Storage.getLatestServiceMedia();
      if (m && typeof m === 'object') return m;
      return INITIAL_LATEST_SERVICE_MEDIA;
    } catch {
      return INITIAL_LATEST_SERVICE_MEDIA;
    }
  });
  const isStorageInit = typeof window !== 'undefined' ? Boolean(Storage.getSnapshot()?.isInitialized) : false;
  const [carouselSlides, setCarouselSlides] = useState<HomepageCarouselSlide[]>(() => {
    try {
      const s = Storage.getCarouselSlides();
      if (Array.isArray(s)) return s;
      return [];
    } catch {
      return [];
    }
  });
  const [weeklyPrograms, setWeeklyPrograms] = useState<WeeklyProgram[]>(() => {
    try {
      const p = Storage.getWeeklyPrograms();
      if (Array.isArray(p)) return p;
      return [];
    } catch {
      return [];
    }
  });
  const [isManageCarouselOpen, setIsManageCarouselOpen] = useState(false);
  const [carouselModalCreateMode, setCarouselModalCreateMode] = useState(false);
  const [isManageProgramsOpen, setIsManageProgramsOpen] = useState(false);
  const [programsModalCreateMode, setProgramsModalCreateMode] = useState(false);
  const [isFooterEditorOpen, setIsFooterEditorOpen] = useState(false);
  const [isPresentationImageModalOpen, setIsPresentationImageModalOpen] = useState(false);
  const [isPresentationLightboxOpen, setIsPresentationLightboxOpen] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('TOUS');
  const [eventsDisplayMode, setEventsDisplayMode] = useState<'calendar' | 'cards'>('calendar');
  const [isJoinCommunityOpen, setIsJoinCommunityOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [adminSaveFeedback, setAdminSaveFeedback] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Dynamic Posts State (Table Supabase dynamic_posts)
  const [dynamicPosts, setDynamicPosts] = useState<DynamicPost[]>(() => []);
  const [selectedPostCategory, setSelectedPostCategory] = useState<string>('TOUS');
  const [selectedPostModal, setSelectedPostModal] = useState<DynamicPost | null>(null);
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({
    title: '',
    category: 'ACTUALITE',
    body: '',
    media_url: '',
    author: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Bureau Pastoral',
  });
  const [isSavingPost, setIsSavingPost] = useState(false);

  // Sécurité anti-blocage sur le chargement initial
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(safetyTimer);
  }, []);

  const handleAdminQuickSave = async () => {
    setIsAdminSaving(true);
    setAdminSaveFeedback('Synchronisation Supabase...');
    try {
      await Promise.all([
        updateSettings(settings),
        apiClient.syncFullCMSToSupabase(currentUser || undefined),
      ]);
      setAdminSaveFeedback('✓ Enregistré dans Supabase !');
      setTimeout(() => setAdminSaveFeedback(null), 3500);
    } catch (err) {
      console.error('Erreur sauvegarde admin:', err);
      setAdminSaveFeedback('Erreur');
      setTimeout(() => setAdminSaveFeedback(null), 3000);
    } finally {
      setIsAdminSaving(false);
    }
  };

  const loadData = async () => {
    try {
      const [secList, evts, tst, vrs, med, slides, lastMedia, progs, posts] = await Promise.all([
        apiClient.getPublicHomepageSections().catch(() => []),
        apiClient.getEvents().catch(() => []),
        apiClient.getTestimonials(true).catch(() => []),
        apiClient.getTodayVerse().catch(() => undefined),
        apiClient.getMediaItems().catch(() => []),
        apiClient.getCarouselSlides().catch(() => []),
        apiClient.getLatestServiceMedia().catch(() => null),
        apiClient.getWeeklyPrograms().catch(() => []),
        apiClient.getDynamicPosts().catch(() => []),
      ]);
      if (Array.isArray(secList)) setSections(secList);
      if (Array.isArray(evts)) setEvents(evts);
      if (Array.isArray(tst)) setTestimonials(tst);
      if (vrs !== undefined) setTodayVerse(vrs);
      if (Array.isArray(med)) setMediaItems(med);
      if (Array.isArray(slides)) setCarouselSlides(slides);
      if (lastMedia && typeof lastMedia === 'object') setLatestServiceMedia(lastMedia);
      if (Array.isArray(progs)) setWeeklyPrograms(progs);
      if (Array.isArray(posts)) setDynamicPosts(posts);
      setLastSyncedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Note chargement public (secours actif):', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      await Promise.all([loadData(), refreshSettings()]);
      setLastSyncedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error during force sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostData.title.trim()) return;
    try {
      setIsSavingPost(true);
      const res = await apiClient.createDynamicPost({
        category: newPostData.category,
        title: newPostData.title.trim(),
        body: newPostData.body.trim() || null,
        media_url: newPostData.media_url.trim() || null,
        author: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : (newPostData.author || 'Bureau Pastoral'),
        is_published: true,
      });
      if (res.success) {
        setIsAddPostModalOpen(false);
        setNewPostData({
          title: '',
          category: 'ACTUALITE',
          body: '',
          media_url: '',
          author: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Bureau Pastoral',
        });
        showToast('✓ Publication enregistrée et diffusée en direct sur le web !');
        loadData();
      }
    } catch (err) {
      console.error('Erreur ajout publication dynamic_posts:', err);
    } finally {
      setIsSavingPost(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Souscription temps réel à la table app_content (sections, CMS, cultes, carrousel, paramètres, événements)
    let unsubscribeAppContent = () => {};
    try {
      unsubscribeAppContent = subscribeToAppContent(({ sectionKey, contentData }) => {
        if (sectionKey === 'homepage_cms' && contentData?.cmsState?.publishedSections) {
          setSections(contentData.cmsState.publishedSections.filter((s: any) => s.isVisible));
          if (contentData.carouselSlides) setCarouselSlides(contentData.carouselSlides);
          if (contentData.weeklyPrograms) setWeeklyPrograms(contentData.weeklyPrograms);
          showToast('✓ Page d’accueil actualisée en direct');
        } else if (sectionKey === 'church_settings') {
          refreshSettings();
          showToast('✓ Paramètres de la paroisse mis à jour');
        } else if (sectionKey === 'carousel_slides' && Array.isArray(contentData)) {
          setCarouselSlides(contentData);
          showToast('✓ Carrousel d’accueil actualisé en direct');
        } else if (sectionKey === 'weekly_programs' && Array.isArray(contentData)) {
          setWeeklyPrograms(contentData);
          showToast('✓ Programmes des cultes actualisés en direct');
        } else if (sectionKey === 'latest_service_media') {
          setLatestServiceMedia(contentData);
          showToast('✓ Médias du culte actualisés en direct');
        } else if (sectionKey === 'homepage_sections' && Array.isArray(contentData)) {
          setSections(contentData.filter((s: any) => s.isVisible));
        } else if (sectionKey === 'events' && Array.isArray(contentData)) {
          setEvents(contentData);
        } else if (sectionKey === 'testimonials' && Array.isArray(contentData)) {
          setTestimonials(contentData);
        }
        setLastSyncedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      });
    } catch (e) {
      console.warn('Realtime app_content non disponible:', e);
    }

    // 2. Souscription temps réel à la table dynamic_posts (publications, enseignements, annonces)
    let unsubscribeDynamicPosts = () => {};
    try {
      unsubscribeDynamicPosts = subscribeToDynamicPosts((payload) => {
        if (payload.eventType === 'INSERT' && payload.newPost) {
          setDynamicPosts((prev) => {
            const exists = prev.some((p) => p.id === payload.newPost?.id);
            if (exists) return prev;
            return [payload.newPost!, ...prev];
          });
          showToast(`✨ Nouvelle publication : "${payload.newPost.title}"`);
        } else if (payload.eventType === 'UPDATE' && payload.newPost) {
          setDynamicPosts((prev) =>
            prev.map((p) => (p.id === payload.newPost?.id ? payload.newPost! : p))
          );
        } else if (payload.eventType === 'DELETE' && payload.oldPostId) {
          setDynamicPosts((prev) => prev.filter((p) => p.id !== payload.oldPostId));
        } else {
          apiClient.getDynamicPosts().then((posts) => {
            if (posts) setDynamicPosts(posts);
          }).catch(() => {});
        }
        setLastSyncedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      });
    } catch (e) {
      console.warn('Realtime dynamic_posts non disponible:', e);
    }

    // 3. Souscription temps réel historique CMS
    let unsubscribeCmsSupabase = () => {};
    try {
      unsubscribeCmsSupabase = subscribeToCMSState((payload) => {
        if (payload?.cmsState?.publishedSections) {
          setSections(payload.cmsState.publishedSections.filter((s) => s.isVisible));
        }
        if (payload?.carouselSlides && payload.carouselSlides.length > 0) {
          setCarouselSlides(payload.carouselSlides);
        }
        if (payload?.weeklyPrograms && payload.weeklyPrograms.length > 0) {
          setWeeklyPrograms(payload.weeklyPrograms);
        }
        setLastSyncedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      });
    } catch (e) {
      console.warn('Realtime CMS non disponible:', e);
    }

    // 4. Événements réseau local / sockets
    let unsubscribeLocal = () => {};
    try {
      unsubscribeLocal = churchSyncService.subscribe((event) => {
        if (event.type === 'church:settings_updated') {
          refreshSettings();
        } else if (event.type === 'church:agenda_updated') {
          Promise.all([
            apiClient.getWeeklyPrograms().catch(() => Storage.getWeeklyPrograms()),
            apiClient.getEvents().catch(() => Storage.getEvents()),
          ]).then(([progs, evts]) => {
            if (progs) setWeeklyPrograms(progs);
            if (evts) setEvents(evts);
          }).catch(() => {});
        } else if (event.type === 'church:cms_updated') {
          loadData();
        }
      });
    } catch (e) {
      console.warn('Sync locale non disponible:', e);
    }

    const handleFocus = () => {
      try {
        loadData();
      } catch {}
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      try { unsubscribeAppContent(); } catch {}
      try { unsubscribeDynamicPosts(); } catch {}
      try { unsubscribeCmsSupabase(); } catch {}
      try { unsubscribeLocal(); } catch {}
      try { window.removeEventListener('focus', handleFocus); } catch {}
    };
  }, []);

  const getSection = (key: string) => (sections || []).find((s) => s && s.key === key && s.isVisible);

  const heroSec = getSection('hero');
  const presentationSec = getSection('presentation');
  const servicesSec = getSection('services');
  const eventsSec = getSection('events');
  const verseSec = getSection('verse');
  const testimonialsSec = getSection('testimonials');
  const mediaSec = getSection('media');
  const ctaSec = getSection('cta');
  const footerSec = getSection('footer');

  const activeWeeklyPrograms = (weeklyPrograms || [])
    .filter((p) => p && p.isActive !== false)
    .sort((a, b) => (a?.order || 0) - (b?.order || 0));

  const upcomingEvents = (events ? [...events] : [])
    .filter((e) => e && e.status !== 'ANNULÉ')
    .sort((a, b) => {
      const timeA = a?.startDate ? new Date(a.startDate).getTime() : 0;
      const timeB = b?.startDate ? new Date(b.startDate).getTime() : 0;
      return timeA - timeB;
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-slate-800 flex flex-col font-sans selection:bg-[#C99B2E] selection:text-[#4A0E17] relative">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4A0E17] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-[#C99B2E] text-xs font-bold animate-in fade-in slide-in-from-bottom-2 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#C99B2E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Notice for Admin & Visitors */}
      <div className="bg-[#4A0E17] text-white text-xs py-2 px-4 border-b border-[#C99B2E]/30 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-amber-300 truncate">
            {settings?.churchName || 'Église Missionnaire de la Foi'} — Sangmelima (Sud, Cameroun)
          </span>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && onOpenPublish && (
            <button
              onClick={onOpenPublish}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded transition flex items-center space-x-1 cursor-pointer"
            >
              <Globe className="w-3 h-3 text-emerald-200" />
              <span>Publication Web Gratuite</span>
            </button>
          )}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
            <button
              onClick={handleAdminQuickSave}
              disabled={isAdminSaving}
              className="text-xs bg-gradient-to-r from-amber-400 to-[#C99B2E] hover:from-amber-300 hover:to-amber-400 text-[#4A0E17] font-black px-2.5 py-0.5 rounded transition flex items-center space-x-1 shadow-xs cursor-pointer disabled:opacity-50"
              title="Enregistrer et synchroniser les modifications avec Supabase pour tous les utilisateurs"
            >
              {isAdminSaving ? (
                <RefreshCw className="w-3 h-3 animate-spin text-[#4A0E17]" />
              ) : adminSaveFeedback ? (
                <CheckCircle className="w-3.5 h-3.5 text-[#4A0E17]" />
              ) : (
                <Save className="w-3 h-3 text-[#4A0E17]" />
              )}
              <span>{isAdminSaving ? 'Sauvegarde...' : adminSaveFeedback || 'Enregistrer (Admin)'}</span>
            </button>
          )}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
            <>
              <button
                onClick={() => {
                  setCarouselModalCreateMode(false);
                  setIsManageCarouselOpen(true);
                }}
                className="text-xs bg-amber-400/90 hover:bg-amber-300 text-[#4A0E17] font-bold px-2.5 py-0.5 rounded transition cursor-pointer flex items-center space-x-1 shadow-xs"
                title="Configurer les photos, titres et liens du carrousel d'accueil"
              >
                <Sparkles className="w-3 h-3 text-[#4A0E17]" />
                <span>Carrousel</span>
              </button>
              <button
                onClick={onGoToCMS}
                className="text-xs bg-[#C99B2E] text-[#4A0E17] font-bold px-2.5 py-0.5 rounded hover:bg-amber-400 transition cursor-pointer"
              >
                Éditer via le CMS
              </button>
            </>
          )}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <UserIcon className="w-3 h-3 text-[#C99B2E]" />
                <span>{currentUser.firstName} ({currentUser.role})</span>
              </span>
              <button
                onClick={onGoToDashboard}
                className="text-xs bg-[#6E1325] text-white font-medium px-2.5 py-0.5 rounded hover:bg-[#8C182F] transition cursor-pointer"
              >
                {currentUser.role === 'ADMIN' || currentUser.role === 'PASTEUR' ? 'Tableau de Bord' : 'Espace Membre'}
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => (onOpenAuth ? onOpenAuth('login') : onGoToDashboard())}
                className="text-xs bg-white/10 hover:bg-white/20 text-white font-bold px-2.5 py-0.5 rounded transition flex items-center space-x-1 cursor-pointer border border-[#C99B2E]/40"
                title="Se connecter avec mot de passe"
              >
                <LogIn className="w-3 h-3 text-[#C99B2E]" />
                <span>Se Connecter</span>
              </button>
              <button
                onClick={() => (onOpenAuth ? onOpenAuth('register') : onGoToDashboard())}
                className="text-xs bg-[#C99B2E] text-[#4A0E17] font-black px-2.5 py-0.5 rounded hover:bg-amber-400 transition cursor-pointer"
                title="Créer un compte"
              >
                <span>S'inscrire</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Public Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChurchLogo size="md" />
            <div>
              <span className="font-black text-lg tracking-tight text-[#4A0E17]">
                EMF SANGMELIMA
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Église Missionnaire de la Foi
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <a href="#about" className="hover:text-[#6E1325] transition">L’Église</a>
            <a href="#services" className="hover:text-[#6E1325] transition">Cultes</a>
            <button
              onClick={() => onNavigateToPage?.('media-gallery')}
              className="text-[#6E1325] hover:text-[#4A0E17] font-black transition flex items-center space-x-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer"
            >
              <span>Vidéos & Photos</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </button>
            <button
              onClick={() => onNavigateToPage?.('resources')}
              className="hover:text-[#6E1325] text-[#4A0E17] transition uppercase font-bold tracking-wider cursor-pointer flex items-center space-x-1"
            >
              <span>Ressources & Prières</span>
            </button>
            <button
              onClick={() => onNavigateToPage?.('finances')}
              className="hover:text-[#6E1325] text-emerald-700 transition uppercase font-black tracking-wider cursor-pointer flex items-center space-x-1"
            >
              <span>Dîmes & Offrandes</span>
            </button>
            <button
              onClick={() => onNavigateToPage?.('parakletos')}
              className="hover:text-[#6E1325] text-[#4A0E17] transition uppercase font-bold tracking-wider cursor-pointer"
            >
              <span>Institut Parakletos</span>
            </button>
            <button
              onClick={onGoToPrayers || onGoToDashboard}
              className="hover:text-[#6E1325] text-[#C99B2E] transition uppercase font-bold tracking-wider cursor-pointer"
            >
              <span>Prières</span>
            </button>
            <button
              onClick={() => onNavigateToPage?.('forum')}
              className="hover:text-[#6E1325] text-[#4A0E17] transition uppercase font-bold tracking-wider cursor-pointer flex items-center space-x-1"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Forum Chrétien</span>
            </button>
            <button
              onClick={() => {
                if (onNavigateToPage) onNavigateToPage('events-and-news');
                else if (typeof window !== 'undefined') window.location.hash = '#events-and-news';
              }}
              className="hover:text-[#6E1325] text-[#4A0E17] transition uppercase font-bold tracking-wider cursor-pointer flex items-center space-x-1 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200"
            >
              <Calendar className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Événements & Actualités</span>
            </button>
            <a href="#socials" className="hover:text-[#6E1325] transition">Réseaux</a>
          </nav>

          <div className="flex items-center space-x-2">
            <ThemeToggle
              variant="icon"
              className="text-[#4A0E17] dark:text-amber-200 hover:bg-slate-100 dark:hover:bg-[#2B070E] border border-slate-200 dark:border-[#4A0E17]"
            />
            <NotificationBell
              onNavigate={(page) => (onNavigateToPage ? onNavigateToPage(page) : onGoToDashboard())}
              className="text-[#4A0E17] hover:bg-slate-100 border border-slate-200"
            />
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && onOpenPublish && (
              <button
                onClick={onOpenPublish}
                className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                title="Partager ou publier le site web gratuitement"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Partager le Site</span>
              </button>
            )}
            <button
              onClick={() => setIsJoinCommunityOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C99B2E] to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#4A0E17] font-black text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-[#4A0E17]" />
              <span>Rejoindre la Communauté</span>
            </button>
            {currentUser ? (
              <button
                onClick={onGoToDashboard}
                className="px-4 py-2 rounded-xl bg-[#4A0E17] text-white text-xs font-bold hover:bg-[#6E1325] transition shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{currentUser.role === 'ADMIN' || currentUser.role === 'PASTEUR' ? 'Tableau de Bord' : 'Espace Membre'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C99B2E]" />
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('login') : onGoToDashboard())}
                  className="px-3.5 py-2 rounded-xl bg-[#4A0E17] text-white text-xs font-bold hover:bg-[#6E1325] transition shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>Connexion</span>
                </button>
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('register') : onGoToDashboard())}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#4A0E17] text-xs font-bold transition flex items-center space-x-1 cursor-pointer border border-slate-200"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span className="hidden sm:inline">S'inscrire</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Parish Alert Ticker Banner */}
      <div className="bg-[#4A0E17] text-white text-xs border-b border-[#C99B2E]/30 py-2 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-hidden truncate">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="font-bold text-[#C99B2E] uppercase text-[10px] tracking-wider flex-shrink-0">
              Notification & Alertes :
            </span>
            <span className="truncate text-rose-100">
              Nouveau Message d’Enseignement, Communiqués de la Direction & Prochaines dates des cultes
            </span>
          </div>
          <button
            onClick={() => {
              if (onNavigateToPage) onNavigateToPage('media-gallery');
            }}
            className="flex-shrink-0 text-[11px] text-[#C99B2E] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
          >
            <span>Voir les alertes</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Image Carousel (Premier Showcase Visuel) */}
      <HomeCarousel
        slides={carouselSlides}
        onRefreshSlides={loadData}
        onNavigateToPage={onNavigateToPage}
        onOpenManageModal={(startInCreateMode = false) => {
          setCarouselModalCreateMode(startInCreateMode);
          setIsManageCarouselOpen(true);
        }}
      />

      {/* Presentation Section - Grand Format & Dimensions Augmentées */}
      {presentationSec && (
        <section id="about" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Présentation textuelle */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center space-x-2 bg-amber-50 text-[#C99B2E] border border-amber-200 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  <Church className="w-3.5 h-3.5" />
                  <span>Présentation Institutionnelle</span>
                </div>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
                  <button
                    onClick={() => setIsPresentationImageModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] border border-[#C99B2E]/40 rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                    title="Prendre ou charger la photo de l'église depuis votre téléphone en grand format"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Photo Église HD</span>
                  </button>
                )}
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#4A0E17] tracking-tight leading-tight">
                {presentationSec.title || 'Qui Sommes-Nous ?'}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-slate-600 leading-relaxed">
                {presentationSec.subtitle}
              </p>
              <div className="text-sm sm:text-base text-slate-700 leading-relaxed space-y-3">
                <p>{presentationSec.content}</p>
              </div>

              {/* Statistics Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-slate-200">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-2xl sm:text-3xl font-black text-[#4A0E17]">150+</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Familles Actives</div>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-2xl sm:text-3xl font-black text-[#C99B2E]">4 / sem.</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Cultes & Réunions</div>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-2xl sm:text-3xl font-black text-[#6E1325]">6</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Ministères d’Impact</div>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700">15+</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Années à Sangmelima</div>
                </div>
              </div>
            </div>

            {/* Right Column: Grand Format Présentation Image (Dimensions Augmentées) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center w-full my-auto self-center text-center">
              {presentationSec.imageUrl && !presentationSec.imageUrl.includes('511795409834') ? (
                <div className="relative group rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 ring-2 ring-[#C99B2E]/40 bg-slate-950 w-full flex items-center justify-center text-center">
                  <img
                    src={presentationSec.imageUrl}
                    alt="Communauté EMF Sangmelima - Grand Temple d’Akon"
                    onClick={() => setIsPresentationLightboxOpen(true)}
                    className="w-full h-[420px] sm:h-[500px] md:h-[560px] lg:h-[620px] object-cover object-center block mx-auto transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                    loading="lazy"
                  />

                  {/* Header Badge on image */}
                  <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md text-[#C99B2E] border border-[#C99B2E]/40 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-lg flex items-center space-x-2">
                    <Church className="w-4 h-4 text-[#C99B2E]" />
                    <span>Grand Temple d’Akon • Sangmelima</span>
                  </div>

                  {/* Bottom Actions Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-between pointer-events-none">
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPresentationImageModalOpen(true);
                        }}
                        className="pointer-events-auto px-3.5 py-2 bg-white/95 hover:bg-white text-[#4A0E17] rounded-xl font-bold text-xs shadow-xl flex items-center space-x-2 transition cursor-pointer border border-[#C99B2E]/40"
                      >
                        <Camera className="w-4 h-4 text-[#C99B2E]" />
                        <span>Changer la photo (Téléphone)</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPresentationLightboxOpen(true);
                      }}
                      className="pointer-events-auto ml-auto px-3.5 py-2 bg-slate-950/85 hover:bg-black text-white rounded-xl font-black text-xs shadow-xl flex items-center space-x-1.5 transition cursor-pointer border border-white/20 backdrop-blur-md"
                    >
                      <Maximize2 className="w-4 h-4 text-[#C99B2E]" />
                      <span>Grand Format HD</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* No image uploaded yet */
                currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR' ? (
                  <div
                    onClick={() => setIsPresentationImageModalOpen(true)}
                    className="rounded-3xl border-2 border-dashed border-[#C99B2E] bg-gradient-to-br from-amber-50/70 via-rose-50/40 to-amber-50/70 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-5 hover:border-[#6E1325] transition shadow-lg cursor-pointer group min-h-[420px] sm:min-h-[500px] lg:min-h-[600px] w-full"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-white shadow-xl text-[#C99B2E] border-2 border-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform mx-auto">
                      <Camera className="w-10 h-10" />
                    </div>
                    <div className="space-y-2 max-w-sm mx-auto text-center">
                      <span className="text-[10px] uppercase font-black tracking-wider bg-[#C99B2E] text-[#4A0E17] px-2.5 py-1 rounded-md inline-block">
                        Grand Format Haute Résolution
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-[#4A0E17]">
                        Ajouter la photo de présentation de l'église
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Prenez une photo de la façade ou du sanctuaire depuis votre smartphone ou choisissez-la dans votre galerie. Elle sera affichée en grand format haute définition sur la page d'accueil.
                      </p>
                    </div>
                    <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-2xl shadow-md transition mx-auto group-hover:scale-105">
                      <Smartphone className="w-4 h-4 text-[#C99B2E]" />
                      <span>Prendre / Charger la photo en Grand Format</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-[#4A0E17] via-[#6E1325] to-[#4A0E17] p-8 sm:p-12 text-white flex flex-col justify-between min-h-[420px] sm:min-h-[500px] lg:min-h-[600px] w-full text-center items-center">
                    <div className="flex items-center justify-between w-full">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#C99B2E] shadow-sm">
                        <Church className="w-7 h-7" />
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-[#C99B2E]/20 text-[#C99B2E] border border-[#C99B2E]/30 text-xs font-black uppercase tracking-wider">
                        Temple d’Akon
                      </span>
                    </div>
                    <div className="space-y-3 my-auto py-8 mx-auto text-center max-w-md">
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                        Église Missionnaire de la Foi
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Paroisse Grand Temple d’Akon, Sangmelima. Une maison de prière, de foi, d'adoration et de transformation.
                      </p>
                    </div>
                    <div className="text-xs text-amber-300 font-semibold flex items-center justify-center space-x-2 w-full pt-4 border-t border-white/10">
                      <span>Sud-Cameroun • Sangmelima</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Services & Horaires des Cultes */}
      {servicesSec && (
        <section id="services" className="py-16 bg-white border-y border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header & Admin Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#C99B2E] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Nos Rendez-vous Hebdomadaires
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    • Temple d’Akon & Quartiers
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-[#4A0E17] tracking-tight">
                  {servicesSec.title || 'Cultes & Réunions de Foi'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {servicesSec.subtitle ||
                    'Rejoignez notre assemblée vivante pour adorer le Seigneur, grandir dans Sa Parole et expérimenter la puissance du Saint-Esprit.'}
                </p>
              </div>

              {/* Admin Floating / Inline Quick Controls */}
              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
                <div className="flex flex-wrap items-center gap-2 p-2.5 bg-gradient-to-r from-amber-50 to-rose-50/70 rounded-2xl border border-[#C99B2E]/40 shrink-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#4A0E17] px-2 py-1 bg-white rounded-lg border border-slate-200 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#C99B2E]" />
                    <span>Admin Cultes</span>
                  </div>
                  <button
                    onClick={() => {
                      setProgramsModalCreateMode(true);
                      setIsManageProgramsOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>+ Ajouter un Programme</span>
                  </button>
                  <button
                    onClick={() => {
                      setProgramsModalCreateMode(false);
                      setIsManageProgramsOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#4A0E17] text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Gérer les Programmes ({weeklyPrograms.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Day Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedDayFilter('TOUS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  selectedDayFilter === 'TOUS'
                    ? 'bg-[#4A0E17] text-white shadow-xs'
                    : 'bg-[#FAF0F2] text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>Tous les programmes</span>
                <span className="text-[10px] opacity-80 bg-white/20 px-1.5 py-0.2 rounded-full">
                  {currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR'
                    ? (weeklyPrograms || []).length
                    : (weeklyPrograms || []).filter((p) => p && p.isActive).length}
                </span>
              </button>

              {['Dimanche', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => {
                const count = (weeklyPrograms || []).filter(
                  (p) =>
                    p &&
                    p.dayOfWeek === day &&
                    (currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR' || p.isActive)
                ).length;
                if (count === 0 && selectedDayFilter !== day) return null;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDayFilter(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      selectedDayFilter === day
                        ? 'bg-[#C99B2E] text-[#4A0E17] shadow-xs'
                        : 'bg-[#FAF0F2] text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>{day}</span>
                    <span className="text-[10px] font-bold bg-white/40 px-1.5 py-0.2 rounded-full">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Programs Cards Grid */}
            {(() => {
              const displayable = (weeklyPrograms || []).filter((prog) => {
                if (!prog) return false;
                const isRoleAdmin =
                  currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';
                if (!isRoleAdmin && !prog.isActive) return false;
                if (selectedDayFilter === 'TOUS') return true;
                return prog.dayOfWeek === selectedDayFilter || prog.dayOfWeek === 'Tous les jours';
              });

              if (displayable.length === 0) {
                return (
                  <div className="text-center py-12 px-4 rounded-3xl bg-white border-2 border-dashed border-slate-200 space-y-3">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">
                      Aucun programme trouvé pour ce filtre ({selectedDayFilter})
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Consultez les autres jours ou réinitialisez le filtre pour découvrir tous les rendez-vous de l’assemblée.
                    </p>
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
                      <button
                        onClick={() => {
                          setProgramsModalCreateMode(true);
                          setIsManageProgramsOpen(true);
                        }}
                        className="px-4 py-2 bg-[#4A0E17] text-white text-xs font-bold rounded-xl shadow hover:bg-[#6E1325] transition"
                      >
                        + Ajouter un programme pour {selectedDayFilter}
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayable.map((prog) => {
                    const colors = getProgramColorClasses(prog?.colorTheme);
                    const isAdmin =
                      currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

                    return (
                      <div
                        key={prog?.id || Math.random()}
                        className={`p-6 rounded-3xl bg-white border transition-all duration-200 shadow-xs group flex flex-col justify-between relative ${
                          prog?.isActive
                            ? `border-slate-200 ${colors.borderHover} hover:shadow-md hover:-translate-y-1`
                            : 'border-dashed border-amber-300 opacity-75 bg-amber-50/20'
                        }`}
                      >
                        {/* Admin Quick Edit Button */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setProgramsModalCreateMode(false);
                              setIsManageProgramsOpen(true);
                            }}
                            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/90 hover:bg-[#4A0E17] hover:text-white text-slate-400 border border-slate-200 shadow-2xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Modifier ce programme"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div>
                          {/* Top Row: Icon + Day Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition ${colors.iconBg}`}
                            >
                              {renderProgramIcon(prog.iconName, 'w-6 h-6')}
                            </div>

                            <div className="flex flex-col items-end space-y-1">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${colors.badgeBg}`}
                              >
                                {prog.dayOfWeek}
                              </span>
                              {!prog.isActive && (
                                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  Masqué
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-black text-[#4A0E17] mb-1.5 leading-snug group-hover:text-[#6E1325]">
                            {prog.title}
                          </h3>

                          {/* Time */}
                          <div
                            className={`text-xs font-black mb-3 flex items-center space-x-1.5 ${colors.timeText}`}
                          >
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {prog.dayOfWeek} : {prog.time}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            {prog.description}
                          </p>
                        </div>

                        {/* Card Footer: Location, Minister, Audience */}
                        <div className="pt-3 border-t border-slate-200/80 space-y-2 text-[11px] text-slate-500 font-medium">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center space-x-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{prog.location}</span>
                            </span>

                            {prog.targetAudience && (
                              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                                {prog.targetAudience}
                              </span>
                            )}
                          </div>

                          {prog.leaderOrMinister && (
                            <div className="flex items-center space-x-1 text-[11px] text-[#4A0E17] font-bold truncate">
                              <UserIcon className="w-3 h-3 text-[#C99B2E] shrink-0" />
                              <span className="truncate">{prog.leaderOrMinister}</span>
                            </div>
                          )}

                          {prog.notes && (
                            <div className="text-[10px] italic text-slate-400 line-clamp-1 pt-0.5">
                              Note : {prog.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* Médiathèque des Photos et Vidéos du Dernier Culte */}
      {latestServiceMedia && (
        <LatestServiceMediaSection
          data={latestServiceMedia}
          onRefresh={loadData}
        />
      )}

      {/* Verset du Jour Aléatoire (Table Supabase 'verses') */}
      {(!verseSec || verseSec.isVisible !== false) && (
        <RandomVerseSection />
      )}

      {/* Redirection vers la page unique des Événements, Enseignements & Actualités */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-[#C99B2E]/30">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-black tracking-wider uppercase border border-white/20">
              <Calendar className="w-3.5 h-3.5" />
              <span>Agenda Paroissial & Enseignements</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Prochains Grands Événements & Actualités
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
              Consultez notre page unique dédiée pour retrouver l'ensemble des cultes, conférences, programmes spirituels, prédications bibliques et annonces officielles de l'église.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                if (onNavigateToPage) {
                  onNavigateToPage('events-and-news');
                } else if (typeof window !== 'undefined') {
                  window.location.hash = '#events-and-news';
                }
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-400 via-[#C99B2E] to-amber-500 hover:from-amber-300 hover:to-[#C99B2E] text-[#4A0E17] text-xs sm:text-sm font-black rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer group"
            >
              <span>Accéder aux Événements & Actualités</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>



      {/* Validated Testimonials Section */}
      {testimonialsSec && (testimonials || []).length > 0 && (
        <section id="testimonials" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-[#C99B2E]">
              Actions de Grâce & Témoignages
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#4A0E17]">
              {testimonialsSec.title || 'Ce que le Seigneur a Fait'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">{testimonialsSec.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(testimonials || []).slice(0, 2).map((tst) => (
              <div
                key={tst?.id || Math.random()}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-[#4A0E17]">
                      {tst?.category || 'Témoignage'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDateDouala(tst?.createdAt || new Date().toISOString())}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#4A0E17]">{tst.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    « {tst.content} »
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#6E1325]">
                    {tst.isIdentityVisible ? tst.authorName : 'Une âme bénie (Anonyme)'}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    ✓ Témoignage certifié
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      {ctaSec && (
        <section
          id="cta"
          className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white py-16 px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              {ctaSec.title || 'Vous cherchez une famille spirituelle à Sangmelima ?'}
            </h2>
            <p className="text-sm sm:text-base text-rose-100 max-w-2xl mx-auto leading-relaxed">
              {ctaSec.subtitle || 'Les portes de l’Église Missionnaire de la Foi vous sont grandes ouvertes.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => setIsJoinCommunityOpen(true)}
                className="px-6 py-3 rounded-xl bg-[#C99B2E] text-[#4A0E17] text-xs font-black hover:bg-amber-400 transition shadow-lg cursor-pointer flex items-center space-x-2"
              >
                <Heart className="w-4 h-4 fill-[#4A0E17]" />
                <span>{ctaSec.primaryButtonText || 'Rejoindre la communauté'}</span>
              </button>
              <a
                href={`tel:${settings.phone}`}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 flex items-center space-x-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{ctaSec.secondaryButtonText || 'Parler à un pasteur'}</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Liens Sociaux & Communauté Numérique de l'Église */}
      <ChurchSocialsSection settings={settings} />

      {/* Footer Paroissial Intelligent & Synchronisé */}
      <footer id="contact" className="bg-[#33050B] text-rose-100 pt-12 pb-8 px-4 sm:px-6 lg:px-8 border-t border-[#6E1325] relative">
        {/* Barre de Statut de Synchronisation en Direct & Contrôle Admin */}
        <div className="max-w-7xl mx-auto mb-8 p-3.5 sm:p-4 rounded-2xl bg-[#420810] border border-[#6E1325]/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-white tracking-wide">
                  Informations & Horaires Paroissiaux en Direct
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  Temps Réel Actif
                </span>
              </div>
              <p className="text-[11px] text-rose-200/80">
                Les coordonnées officielles, cultes réguliers ({activeWeeklyPrograms.length}) et l'agenda des rassemblements ({events.length}) sont actualisés en temps réel pour tous les fidèles et visiteurs.
                {lastSyncedTime && (
                  <span className="ml-1 text-amber-300/90 font-medium">
                    • Dernière synchronisation à {lastSyncedTime}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
            <button
              onClick={() => handleForceSync()}
              disabled={isSyncing}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-rose-100 hover:text-white font-bold transition flex items-center space-x-1.5 border border-white/15 cursor-pointer disabled:opacity-50"
              title="Forcer la réactualisation des données"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C99B2E] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Actualisation...' : 'Actualiser'}</span>
            </button>

            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
              <button
                onClick={() => setIsFooterEditorOpen(true)}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                title="Modifier les coordonnées et informations de contact du pied de page"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#4A0E17]" />
                <span>Modifier les Coordonnées & Liens</span>
              </button>
            )}
          </div>
        </div>

        {/* Grille Principale à 3 Colonnes */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 text-xs">
          {/* Colonne 1 : Identité & Mission Spirituelle */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <ChurchLogo size="sm" />
              <div>
                <span className="font-black text-base text-white block leading-tight">EMF SMART</span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Sangmelima • Sud Cameroun
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {settings.slogan ||
                'Une église vivante au cœur du Sud, enracinée dans la Parole et tournée vers les nations.'}
            </p>
            <div className="space-y-1 text-[11px] text-slate-400">
              <p className="flex items-start space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C99B2E] shrink-0 mt-0.5" />
                <span>{settings.address || 'Quartier Akon, Route Principale, Sangmelima'}</span>
              </p>
              <p className="text-[10px] text-slate-500 pl-5">
                Département du Dja-et-Lobo, Région du Sud, République du Cameroun.
              </p>
            </div>

            {/* Réseaux Sociaux Officiels */}
            <div className="pt-2">
              <span className="font-bold uppercase tracking-wider text-[#C99B2E] text-[10px] block mb-2">
                Réseaux Sociaux Officiels :
              </span>
              <div className="flex items-center space-x-2">
                {settings?.socials?.facebook && (
                  <a
                    href={settings.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#1877F2] text-slate-300 hover:text-white transition flex items-center justify-center border border-slate-700"
                    title="Facebook EMF Sangmelima"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                )}

                {settings?.socials?.youtube && (
                  <a
                    href={settings.socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#FF0000] text-slate-300 hover:text-white transition flex items-center justify-center border border-slate-700"
                    title="Chaîne YouTube EMF"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}

                {settings?.socials?.whatsapp && (
                  <a
                    href={
                      settings.socials.whatsapp.startsWith('http')
                        ? settings.socials.whatsapp
                        : `https://wa.me/${settings.socials.whatsapp.replace(/\D/g, '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#25D366] text-slate-300 hover:text-white transition flex items-center justify-center border border-slate-700"
                    title="WhatsApp EMF Sangmelima"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </a>
                )}

                {settings?.socials?.instagram && (
                  <a
                    href={settings.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#E1306C] text-slate-300 hover:text-white transition flex items-center justify-center border border-slate-700"
                    title="Instagram EMF Sangmelima"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}

                {settings?.socials?.telegram && (
                  <a
                    href={settings.socials.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#0088CC] text-slate-300 hover:text-white transition flex items-center justify-center border border-slate-700"
                    title="Telegram EMF"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Colonne 2 : Liens Rapides & Services Paroissiaux */}
          <div className="space-y-3">
            <span className="font-bold uppercase tracking-wider text-[#C99B2E] text-[11px] block">
              Navigation & Services Paroissiaux
            </span>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center space-x-2 text-slate-300 hover:text-[#C99B2E] transition group"
                >
                  <ArrowRight className="w-3 h-3 text-[#C99B2E] group-hover:translate-x-1 transition" />
                  <span>Accueil & Présentation de l'Église</span>
                </a>
              </li>
              <li>
                <a
                  href="#ministries"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('ministries');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center space-x-2 text-slate-300 hover:text-[#C99B2E] transition group"
                >
                  <ArrowRight className="w-3 h-3 text-[#C99B2E] group-hover:translate-x-1 transition" />
                  <span>Nos Départements & Ministères</span>
                </a>
              </li>
              <li>
                <a
                  href="#prayer-requests"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('prayer-requests');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center space-x-2 text-slate-300 hover:text-[#C99B2E] transition group"
                >
                  <ArrowRight className="w-3 h-3 text-[#C99B2E] group-hover:translate-x-1 transition" />
                  <span>Requêtes de Prière & Intercession</span>
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('testimonials');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center space-x-2 text-slate-300 hover:text-[#C99B2E] transition group"
                >
                  <ArrowRight className="w-3 h-3 text-[#C99B2E] group-hover:translate-x-1 transition" />
                  <span>Témoignages & Louanges des Fidèles</span>
                </a>
              </li>
              <li>
                <a
                  href="#latest-service-media"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('latest-service-media');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center space-x-2 text-slate-300 hover:text-[#C99B2E] transition group"
                >
                  <ArrowRight className="w-3 h-3 text-[#C99B2E] group-hover:translate-x-1 transition" />
                  <span>Médiathèque, Photos & Prédications</span>
                </a>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => {
                    if (onOpenAuth) {
                      onOpenAuth('login');
                    } else {
                      window.location.hash = '#dashboard';
                    }
                  }}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#C99B2E] hover:text-[#4A0E17] text-white font-bold transition border border-white/20 cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-[#C99B2E] hover:text-[#4A0E17]" />
                  <span>Espace Sécurisé Membres & Dirigeants</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Coordonnées Officielles & Contact */}
          <div className="space-y-3">
            <span className="font-bold uppercase tracking-wider text-[#C99B2E] text-[11px] block">
              Contact & Permanence
            </span>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white transition group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-[#C99B2E] text-[#C99B2E] group-hover:text-[#4A0E17] flex items-center justify-center transition border border-slate-700 shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Téléphone</span>
                    <span className="font-bold">{settings.phone}</span>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white transition group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-[#C99B2E] text-[#C99B2E] group-hover:text-[#4A0E17] flex items-center justify-center transition border border-slate-700 shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Email Officiel</span>
                    <span className="font-bold truncate max-w-[170px] block">{settings.email}</span>
                  </div>
                </a>
              </li>
              <li className="flex items-center space-x-2 pt-0.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-[#C99B2E] flex items-center justify-center shrink-0 border border-slate-700">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Secrétariat Paroissial</span>
                  <span className="text-slate-300 text-[11px]">Mar - Sam : 08h30 - 17h00</span>
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href={
                  settings.socials.whatsapp
                    ? settings.socials.whatsapp.startsWith('http')
                      ? settings.socials.whatsapp
                      : `https://wa.me/${settings.socials.whatsapp.replace(/\D/g, '')}`
                    : `https://wa.me/${settings.phone.replace(/\D/g, '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
              >
                <span>Contacter le Pasteur par WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Barre Inférieure Légale */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div>
            © 2026 {settings.churchName}. Tous droits réservés.
          </div>
          <div className="flex items-center space-x-4">
            <span>Fuseau : {settings.timezone}</span>
            <span>•</span>
            <span>Devise : {settings.currency}</span>
            <span>•</span>
            <span className="text-[#C99B2E]">EMF SMART Sangmelima</span>
          </div>
        </div>
      </footer>

      {/* Admin Manage Carousel Modal */}
      <ManageCarouselModal
        isOpen={isManageCarouselOpen}
        onClose={() => setIsManageCarouselOpen(false)}
        slides={carouselSlides}
        onSlidesUpdated={loadData}
        initialCreateMode={carouselModalCreateMode}
      />

      {/* Admin Manage Weekly Programs Modal */}
      <ManageWeeklyProgramsModal
        isOpen={isManageProgramsOpen}
        onClose={() => setIsManageProgramsOpen(false)}
        programs={weeklyPrograms}
        onProgramsUpdated={loadData}
        initialCreateMode={programsModalCreateMode}
      />

      {/* Member Join Community Modal */}
      <JoinCommunityModal
        isOpen={isJoinCommunityOpen}
        onClose={() => setIsJoinCommunityOpen(false)}
        onSuccess={loadData}
      />

      {/* Admin Presentation Image Modal (Photo Église depuis Téléphone) */}
      <ManagePresentationImageModal
        isOpen={isPresentationImageModalOpen}
        onClose={() => setIsPresentationImageModalOpen(false)}
        currentImageUrl={presentationSec?.imageUrl}
        onImageUpdated={(newUrl) => {
          setSections((prev) =>
            prev.map((s) => (s.key === 'presentation' ? { ...s, imageUrl: newUrl } : s))
          );
        }}
      />

      {/* Lightbox Plein Écran Grand Format pour la Photo de Présentation */}
      {isPresentationLightboxOpen && presentationSec?.imageUrl && (
        <div
          onClick={() => setIsPresentationLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-6xl w-full max-h-[94vh] flex flex-col items-center cursor-default"
          >
            {/* Header Controls */}
            <div className="w-full flex items-center justify-between py-3 px-4 bg-slate-950/80 rounded-t-2xl border border-white/10 text-white">
              <div className="flex items-center space-x-2">
                <Church className="w-4 h-4 text-[#C99B2E]" />
                <span className="text-xs font-black text-amber-200">
                  Grand Temple d’Akon • Église Missionnaire de la Foi (Sangmelima)
                </span>
                <span className="text-[10px] bg-[#C99B2E] text-[#4A0E17] font-black px-2 py-0.5 rounded">
                  Plein Format HD
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={presentationSec.imageUrl}
                  download="emf-sangmelima-temple.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-white/10"
                  title="Télécharger la photo en taille réelle"
                >
                  <Download className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span className="hidden sm:inline">Télécharger</span>
                </a>
                <button
                  onClick={() => setIsPresentationLightboxOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-white transition cursor-pointer"
                  title="Fermer (Échap)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Large Image Frame */}
            <div className="w-full bg-black rounded-b-2xl overflow-hidden border-x border-b border-white/10 flex items-center justify-center max-h-[82vh]">
              <img
                src={presentationSec.imageUrl}
                alt="Communauté EMF Sangmelima - Plein Écran"
                className="max-w-full max-h-[82vh] object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Admin Footer & Church Synchronizer Modal */}
      <FooterChurchEditorModal
        isOpen={isFooterEditorOpen}
        onClose={() => setIsFooterEditorOpen(false)}
        weeklyPrograms={weeklyPrograms}
        events={events}
        onOpenProgramsManager={() => {
          setProgramsModalCreateMode(false);
          setIsManageProgramsOpen(true);
        }}
        onNavigateToEvents={onNavigateToPage ? () => onNavigateToPage('events') : undefined}
        onRefreshData={loadData}
      />

      {/* Modal Lecture Complète Publication (dynamic_posts) */}
      {selectedPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedPostModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedPostModal.media_url && (
              <div className="h-64 sm:h-72 w-full bg-slate-100 relative shrink-0">
                <img
                  src={selectedPostModal.media_url}
                  alt={selectedPostModal.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/95 text-[#4A0E17] shadow-md border border-slate-200">
                    {selectedPostModal.category}
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
              {!selectedPostModal.media_url && (
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#4A0E17]/10 text-[#4A0E17] border border-[#4A0E17]/20 inline-block">
                  {selectedPostModal.category}
                </span>
              )}

              <h2 className="text-xl sm:text-2xl font-black text-[#4A0E17] leading-tight">
                {selectedPostModal.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
                <span className="flex items-center space-x-1.5 font-bold text-slate-700">
                  <UserIcon className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>{selectedPostModal.author || 'Bureau Pastoral'}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {selectedPostModal.created_at
                      ? new Date(selectedPostModal.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : ''}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ Validé & Diffusé
                </span>
              </div>

              <div className="text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line pt-2">
                {selectedPostModal.body}
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
                      const text = `*${selectedPostModal.title}*\n${selectedPostModal.body ? selectedPostModal.body.substring(0, 180) + '...' : ''}\nLire en intégralité sur le portail de l'Église Missionnaire de la Foi :\n${shareUrl}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="px-4 py-2 bg-[#25D366] hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
                  >
                    <span>Partager sur WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/#publications`);
                        showToast('✓ Lien copié dans le presse-papier !');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#4A0E17] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-slate-200 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copier le lien</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedPostModal(null)}
                  className="px-4 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Admin Création de Publication (dynamic_posts) */}
      {isAddPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-6 bg-gradient-to-r from-[#4A0E17] to-[#6E1325] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C99B2E] block">
                  Table Supabase dynamic_posts • Realtime
                </span>
                <h3 className="text-lg font-black tracking-tight">
                  Publier un Contenu (En direct)
                </h3>
              </div>
              <button
                onClick={() => setIsAddPostModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catégorie de la Publication *
                </label>
                <select
                  value={newPostData.category}
                  onChange={(e) => setNewPostData({ ...newPostData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#4A0E17] focus:bg-white focus:outline-none"
                >
                  <option value="ENSEIGNEMENT">Enseignement & Prédication Biblique</option>
                  <option value="ANNONCE">Annonce Officielle & Communiqué</option>
                  <option value="ACTUALITE">Actualité Paroissiale & Vie d'Église</option>
                  <option value="CULTE">Culte Spécial & Célébration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre de la publication *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Grande Veillée de Prière & Victoire"
                  value={newPostData.title}
                  onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contenu détaillé / Message *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Rédigez le texte complet du message, passage biblique ou communiqué..."
                  value={newPostData.body}
                  onChange={(e) => setNewPostData({ ...newPostData, body: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325] leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image d'illustration (URL ou Photo)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newPostData.media_url}
                  onChange={(e) => setNewPostData({ ...newPostData, media_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold">Suggestions :</span>
                  {[
                    { label: 'Prière', url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'Temple', url: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'Fraternité', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setNewPostData({ ...newPostData, media_url: s.url })}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[#4A0E17] font-semibold cursor-pointer border border-slate-200"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auteur / Émetteur
                </label>
                <input
                  type="text"
                  placeholder="Bureau Pastoral / Pasteur"
                  value={newPostData.author}
                  onChange={(e) => setNewPostData({ ...newPostData, author: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPostModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  className="px-5 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPost ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#C99B2E]" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-[#C99B2E]" />
                  )}
                  <span>Publier en Direct (Realtime)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Admin Save Pill */}
      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
        <div className="fixed bottom-5 right-5 z-40 bg-[#4A0E17]/95 text-white border border-[#C99B2E] shadow-2xl p-2 px-3.5 rounded-2xl flex items-center space-x-2.5 backdrop-blur-md animate-in slide-in-from-bottom">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-300">
            <Shield className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span className="hidden sm:inline">Admin :</span>
          </div>
          <button
            onClick={handleAdminQuickSave}
            disabled={isAdminSaving}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-400 via-[#C99B2E] to-amber-500 hover:from-amber-300 hover:to-[#C99B2E] text-[#4A0E17] text-xs font-black rounded-xl transition flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
            title="Enregistrer et synchroniser immédiatement dans Supabase"
          >
            {isAdminSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4A0E17]" />
            ) : adminSaveFeedback ? (
              <CheckCircle className="w-3.5 h-3.5 text-[#4A0E17]" />
            ) : (
              <Save className="w-3.5 h-3.5 text-[#4A0E17]" />
            )}
            <span>{isAdminSaving ? 'Sauvegarde en cours...' : adminSaveFeedback || 'Enregistrer (Admin)'}</span>
          </button>
          <button
            onClick={() => setIsFooterEditorOpen(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-rose-100 hover:text-white transition cursor-pointer"
            title="Modifier les coordonnées & le pied de page"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
