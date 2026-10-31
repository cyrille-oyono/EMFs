import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Share2,
  ArrowRight,
  User as UserIcon,
  Tag,
  BookOpen,
  Megaphone,
  Sparkles,
  Church,
  X,
  ExternalLink,
  ChevronLeft,
  CalendarDays,
  Flame,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Event, WeeklyProgram, DynamicPost, User } from '../types';
import { formatDateDouala } from '../utils/formatters';
import { InteractiveHomeCalendar } from '../components/home/InteractiveHomeCalendar';
import {
  FALLBACK_DYNAMIC_POSTS,
  subscribeToDynamicPosts,
  subscribeToAppContent,
  createDynamicPost,
  deleteDynamicPost,
} from '../services/supabase';

interface EventsAndNewsPageProps {
  onNavigate?: (page: string) => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}

export const EventsAndNewsPage: React.FC<EventsAndNewsPageProps> = ({
  onNavigate,
  onOpenAuth,
}) => {
  const { currentUser, settings } = useAuth();
  const isPastorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  // Active view tab: 'all' | 'events' | 'news'
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'news'>('all');

  // Events & Programs state
  const [events, setEvents] = useState<Event[]>([]);
  const [weeklyPrograms, setWeeklyPrograms] = useState<WeeklyProgram[]>([]);
  const [eventsDisplayMode, setEventsDisplayMode] = useState<'calendar' | 'cards'>('calendar');
  const [selectedEventType, setSelectedEventType] = useState<string>('TOUS');

  const [dynamicPosts, setDynamicPosts] = useState<DynamicPost[]>([]);
  const [selectedPostCategory, setSelectedPostCategory] = useState<string>('TOUS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPostModal, setSelectedPostModal] = useState<DynamicPost | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<Event | null>(null);

  // Add post modal state (Admin / Pastor)
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({
    title: '',
    category: 'ACTUALITE',
    body: '',
    media_url: '',
    author: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Bureau Pastoral',
  });
  const [isSavingPost, setIsSavingPost] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [evts, progs, posts] = await Promise.all([
        apiClient.getEvents().catch(() => []),
        apiClient.getWeeklyPrograms().catch(() => []),
        apiClient.getDynamicPosts().catch(() => []),
      ]);
      setEvents(Array.isArray(evts) ? evts : []);
      setWeeklyPrograms(Array.isArray(progs) ? progs : []);
      setDynamicPosts(Array.isArray(posts) ? posts : []);
    } catch (err) {
      console.warn('Erreur chargement événements & actualités:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Souscription temps réel aux modifications Supabase
    const unsubscribePosts = subscribeToDynamicPosts((posts) => {
      if (Array.isArray(posts)) {
        setDynamicPosts(posts);
      }
    });

    const unsubscribeContent = subscribeToAppContent(({ sectionKey, contentData }) => {
      if (!contentData) return;
      if (sectionKey === 'events' && Array.isArray(contentData)) {
        setEvents(contentData);
      } else if (sectionKey === 'weekly_programs' && Array.isArray(contentData)) {
        setWeeklyPrograms(contentData);
      } else if (sectionKey === 'dynamic_posts' && Array.isArray(contentData)) {
        setDynamicPosts(contentData);
      }
    });

    return () => {
      unsubscribePosts();
      unsubscribeContent();
    };
  }, []);

  // Filtered dynamic posts
  const filteredPosts = useMemo(() => {
    return (dynamicPosts || []).filter((post) => {
      if (!post) return false;
      const matchesCategory =
        selectedPostCategory === 'TOUS' || post.category === selectedPostCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.body && post.body.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.author && post.author.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [dynamicPosts, selectedPostCategory, searchQuery]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return (events || []).filter((evt) => {
      if (!evt) return false;
      if (selectedEventType === 'TOUS') return true;
      return evt.type === selectedEventType;
    });
  }, [events, selectedEventType]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostData.title.trim() || !newPostData.body.trim()) {
      showToast('Veuillez remplir le titre et le contenu de la publication.');
      return;
    }
    setIsSavingPost(true);
    try {
      const created = await apiClient.createDynamicPost({
        title: newPostData.title.trim(),
        category: newPostData.category,
        body: newPostData.body.trim(),
        media_url: newPostData.media_url.trim() || null,
        author: newPostData.author.trim() || 'Bureau Pastoral',
        is_published: true,
        metadata: {
          targetAudience: 'TOUS',
          viewCount: 1,
        },
      });

      if (created.success && created.data) {
        setDynamicPosts((prev) => [created.data!, ...(prev || [])]);
        setIsAddPostModalOpen(false);
        setNewPostData({
          title: '',
          category: 'ACTUALITE',
          body: '',
          media_url: '',
          author: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Bureau Pastoral',
        });
        showToast('✓ Contenu publié et synchronisé en direct sur Supabase !');
      } else {
        showToast(`Erreur publication: ${created.error || 'Échec de publication'}`);
      }
    } catch (err: any) {
      showToast(`Erreur publication: ${err?.message || 'Échec de connexion'}`);
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Voulez-vous supprimer définitivement cette publication ?')) return;
    try {
      await deleteDynamicPost(postId);
      setDynamicPosts((prev) => prev.filter((p) => p.id !== postId));
      if (selectedPostModal?.id === postId) {
        setSelectedPostModal(null);
      }
      showToast('✓ Publication définitivement supprimée');
    } catch (err: any) {
      showToast(`Erreur: ${err?.message || 'Échec de suppression'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0B0204] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4A0E17] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-[#C99B2E]/40 flex items-center space-x-2 animate-in slide-in-from-bottom">
          <Sparkles className="w-4 h-4 text-[#C99B2E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Navigation */}
      <div className="bg-[#4A0E17] text-white border-b border-[#C99B2E]/30 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('public-home')}
                className="px-3 py-1.5 bg-[#6E1325] hover:bg-[#85182D] text-amber-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-[#C99B2E]/30"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Accueil Public</span>
              </button>
            )}
            <div className="hidden sm:block">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#C99B2E] block">
                Portail Paroissial • Sangmelima
              </span>
              <h1 className="text-sm sm:text-base font-black truncate text-white">
                Événements, Enseignements & Actualités
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C99B2E] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            {isPastorOrAdmin && (
              <button
                onClick={() => setIsAddPostModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 via-[#C99B2E] to-amber-500 hover:from-amber-300 hover:to-[#C99B2E] text-[#4A0E17] text-xs font-black rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Publier (Realtime)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-[#4A0E17] via-[#6E1325] to-[#2E070D] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,155,46,0.15),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#C99B2E]/40 text-[#C99B2E] text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Page Unique • Agenda & Publications Officielles</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-4xl">
            Prochains Grands Événements, Enseignements & Actualités
          </h2>

          <p className="text-xs sm:text-base text-rose-100/90 max-w-3xl leading-relaxed">
            Consultez en un seul endroit tous les cultes, conférences spirituelles, retraites de prière, enseignements bibliques et annonces de l'Église Missionnaire de la Foi de Sangmelima.
          </p>

          {/* Quick Filter Switcher */}
          <div className="pt-4 flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tout Afficher', count: (events?.length || 0) + (dynamicPosts?.length || 0) },
              { id: 'events', label: '📅 Prochains Grands Événements', count: events?.length || 0 },
              { id: 'news', label: '📖 Enseignements, Annonces & Actualités', count: dynamicPosts?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#C99B2E] text-[#4A0E17] shadow-lg font-black'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                    activeTab === tab.id ? 'bg-[#4A0E17]/20 text-[#4A0E17]' : 'bg-white/20 text-rose-100'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* ========================================================= */}
        {/* SECTION 1 : PROCHAINS GRANDS ÉVÉNEMENTS                   */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'events') && (
          <section id="grands-evenements" className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#C99B2E]">
                  <Calendar className="w-4 h-4" />
                  <span>Partie 1 • Agenda Paroissial</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#4A0E17] dark:text-rose-100">
                  Prochains Grands Événements
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Cultes spéciaux, conférences, conventions et rencontres de prière programmés à Sangmelima.
                </p>
              </div>

              {/* Display mode toggle */}
              <div className="inline-flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setEventsDisplayMode('calendar')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    eventsDisplayMode === 'calendar'
                      ? 'bg-[#4A0E17] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendrier Interactif</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventsDisplayMode('cards')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    eventsDisplayMode === 'cards'
                      ? 'bg-[#4A0E17] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <span>Cartes des Événements</span>
                  {events.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-[#4A0E17] font-black">
                      {events.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Display Mode: Interactive Calendar */}
            {eventsDisplayMode === 'calendar' ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <InteractiveHomeCalendar
                  events={events}
                  weeklyPrograms={weeklyPrograms}
                  currentUser={currentUser}
                  onRefresh={loadData}
                />
              </div>
            ) : (
              /* Display Mode: Event Cards Grid */
              <div className="space-y-6">
                {/* Event Type Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {['TOUS', 'CULTE', 'CONFÉRENCE', 'SÉMINAIRE', 'JEÛNE_PRIÈRE', 'CONCERT', 'AUTRE'].map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedEventType(type)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedEventType === type
                            ? 'bg-[#4A0E17] text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Aucun grand événement programmé pour cette catégorie.
                    </p>
                    <p className="text-xs text-slate-400">
                      Basculez sur le « Calendrier Interactif » pour consulter le calendrier complet des cultes réguliers.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col group"
                      >
                        <div className="h-48 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                          <img
                            src={
                              evt.bannerUrl ||
                              'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=800&q=80'
                            }
                            alt={evt.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <span className="absolute top-3 left-3 bg-[#4A0E17]/90 backdrop-blur-xs text-[#C99B2E] text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#C99B2E]/30">
                            {evt.type || 'ÉVÉNEMENT'}
                          </span>
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="text-xs text-[#C99B2E] font-black mb-1.5 flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDateDouala(evt.startDate)}</span>
                            </div>
                            <h4 className="text-base font-black text-[#4A0E17] dark:text-rose-100 line-clamp-2 leading-snug group-hover:text-[#6E1325]">
                              {evt.title}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                              {evt.description || 'Grand rassemblement spirituel de la communauté paroissiale.'}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span className="flex items-center space-x-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{evt.location || 'Grand Temple Akon, Sangmelima'}</span>
                            </span>
                            <button
                              onClick={() => setSelectedEventModal(evt)}
                              className="text-xs font-bold text-[#6E1325] dark:text-amber-300 hover:underline cursor-pointer"
                            >
                              Détails
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 2 : ENSEIGNEMENTS, ANNONCES & ACTUALITÉS          */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'news') && (
          <section id="enseignements-actualites" className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#C99B2E]">
                  <Megaphone className="w-4 h-4" />
                  <span>Partie 2 • Vie de l'Église</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#4A0E17] dark:text-rose-100">
                  Enseignements, Annonces & Actualités
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Publications spirituelles, messages pastoraux, nouvelles officielles et avis paroissiaux.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une publication..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#C99B2E]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'TOUS', label: 'Toutes les publications', count: (dynamicPosts || []).length },
                {
                  id: 'ENSEIGNEMENT',
                  label: 'Enseignements & Prédications',
                  count: (dynamicPosts || []).filter((p) => p && p.category === 'ENSEIGNEMENT').length,
                },
                {
                  id: 'ANNONCE',
                  label: 'Annonces Officielles',
                  count: (dynamicPosts || []).filter((p) => p && p.category === 'ANNONCE').length,
                },
                {
                  id: 'ACTUALITE',
                  label: 'Actualités Paroissiales',
                  count: (dynamicPosts || []).filter((p) => p && p.category === 'ACTUALITE').length,
                },
                {
                  id: 'CULTE',
                  label: 'Cultes & Rassemblements',
                  count: (dynamicPosts || []).filter((p) => p && p.category === 'CULTE').length,
                },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedPostCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    selectedPostCategory === cat.id
                      ? 'bg-[#4A0E17] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      selectedPostCategory === cat.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Dynamic Posts Grid */}
            {filteredPosts.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Aucune publication ne correspond à vos critères de recherche.
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedPostCategory('TOUS');
                    }}
                    className="text-xs font-bold text-[#6E1325] hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => {
                  let categoryBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (post.category === 'ENSEIGNEMENT') {
                    categoryBadgeClass = 'bg-purple-50 text-purple-800 border-purple-200';
                  } else if (post.category === 'ANNONCE') {
                    categoryBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                  } else if (post.category === 'ACTUALITE') {
                    categoryBadgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
                  } else if (post.category === 'CULTE') {
                    categoryBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  }

                  return (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {post.media_url ? (
                          <div className="h-48 overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                            <img
                              src={post.media_url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            <div className="absolute top-3 left-3">
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shadow-xs backdrop-blur-md bg-white/95 dark:bg-slate-900/95 ${categoryBadgeClass}`}
                              >
                                {post.category || 'ACTUALITE'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-28 bg-gradient-to-br from-[#4A0E17] via-[#6E1325] to-[#4A0E17] p-4 flex items-between justify-between text-white relative">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-white/10 text-amber-300 border-white/20">
                              {post.category || 'ACTUALITE'}
                            </span>
                            <Church className="w-5 h-5 text-amber-300/80" />
                          </div>
                        )}

                        <div className="p-6 space-y-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                              <UserIcon className="w-3 h-3 text-[#C99B2E]" />
                              <span>{post.author || 'Bureau Pastoral'}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {post.created_at
                                  ? new Date(post.created_at).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : ''}
                              </span>
                            </span>
                          </div>

                          <h4 className="text-base font-black text-[#4A0E17] dark:text-rose-100 group-hover:text-[#6E1325] transition line-clamp-2">
                            {post.title}
                          </h4>

                          {post.body && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                              {post.body}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-3">
                        <button
                          onClick={() => setSelectedPostModal(post)}
                          className="text-xs font-bold text-[#6E1325] dark:text-amber-300 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Lire la suite</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#C99B2E]" />
                        </button>

                        <div className="flex items-center space-x-1">
                          {isPastorOrAdmin && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-red-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                              title="Supprimer définitivement cette publication"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
                              const text = `*${post.title}*\n${post.body ? post.body.substring(0, 140) + '...' : ''}\nRetrouvez cette publication sur EMF SMART :\n${shareUrl}`;
                              window.open(
                                `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
                                '_blank'
                              );
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                            title="Partager sur WhatsApp"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                navigator.clipboard.writeText(window.location.href);
                                showToast('✓ Lien copié dans le presse-papier !');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#4A0E17] dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Copier le lien"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modal: Read Full Post */}
      {selectedPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setSelectedPostModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedPostModal.media_url && (
              <div className="w-full h-64 rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={selectedPostModal.media_url}
                  alt={selectedPostModal.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {selectedPostModal.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#4A0E17] dark:text-rose-100">
                {selectedPostModal.title}
              </h3>
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span>Par {selectedPostModal.author || 'Bureau Pastoral'}</span>
                <span>•</span>
                <span>
                  {selectedPostModal.created_at
                    ? new Date(selectedPostModal.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : ''}
                </span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-slate-800 pt-4">
              {selectedPostModal.body}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
                    const text = `*${selectedPostModal.title}*\n${selectedPostModal.body?.substring(0, 160)}...\n${shareUrl}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Partager</span>
                </button>
                {isPastorOrAdmin && (
                  <button
                    onClick={() => handleDeletePost(selectedPostModal.id)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedPostModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Event Details */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setSelectedEventModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedEventModal.bannerUrl && (
              <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={selectedEventModal.bannerUrl}
                  alt={selectedEventModal.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#4A0E17] text-white">
                {selectedEventModal.type}
              </span>
              <h3 className="text-xl font-black text-[#4A0E17] dark:text-rose-100">
                {selectedEventModal.title}
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#C99B2E]" />
                <span className="font-bold">
                  Date : {formatDateDouala(selectedEventModal.startDate)}
                  {selectedEventModal.endDate ? ` au ${formatDateDouala(selectedEventModal.endDate)}` : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#C99B2E]" />
                <span>Lieu : {selectedEventModal.location || 'Grand Temple Akon, Sangmelima'}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
              {selectedEventModal.description || 'Grand rassemblement spirituel.'}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-2 bg-[#4A0E17] text-white text-xs font-bold rounded-xl hover:bg-[#6E1325] transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Publish New Dynamic Post (Admin / Pastor) */}
      {isAddPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsAddPostModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#C99B2E] tracking-wider block">
                Diffusion Immédiate • Supabase Realtime
              </span>
              <h3 className="text-xl font-black text-[#4A0E17] dark:text-rose-100">
                Publier un Enseignement ou une Annonce
              </h3>
              <p className="text-xs text-slate-500">
                Cette publication apparaîtra instantanément sur les écrans de tous les fidèles et visiteurs connectés.
              </p>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Titre de la Publication *
                </label>
                <input
                  type="text"
                  required
                  value={newPostData.title}
                  onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
                  placeholder="Ex: Message du Dimanche : La Puissance de la Foi"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#C99B2E] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={newPostData.category}
                    onChange={(e) => setNewPostData({ ...newPostData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#C99B2E] focus:outline-hidden"
                  >
                    <option value="ENSEIGNEMENT">Enseignement & Prédication</option>
                    <option value="ANNONCE">Annonce Officielle</option>
                    <option value="ACTUALITE">Actualité Paroissiale</option>
                    <option value="CULTE">Culte & Rassemblement</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Auteur
                  </label>
                  <input
                    type="text"
                    value={newPostData.author}
                    onChange={(e) => setNewPostData({ ...newPostData, author: e.target.value })}
                    placeholder="Ex: Pasteur Principal / Secrétariat"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#C99B2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Lien Image (Optionnel)
                </label>
                <input
                  type="url"
                  value={newPostData.media_url}
                  onChange={(e) => setNewPostData({ ...newPostData, media_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#C99B2E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Texte & Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={newPostData.body}
                  onChange={(e) => setNewPostData({ ...newPostData, body: e.target.value })}
                  placeholder="Rédigez ici le texte complet de l'enseignement ou de l'annonce..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#C99B2E] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPostModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  className="px-5 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPost ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#C99B2E]" />
                  )}
                  <span>{isSavingPost ? 'Publication en cours...' : 'Publier en Direct'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
