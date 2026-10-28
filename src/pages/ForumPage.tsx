import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Pin,
  Lock,
  Unlock,
  Flag,
  ArrowLeft,
  Send,
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  BookOpen,
  Church,
  HelpCircle,
  HeartHandshake,
  Shield,
  Trash2,
  Sparkles,
  Quote,
  Clock,
  Filter,
  Check,
  Info,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { ForumCategory, ForumTopic, ForumPost, ForumReport } from '../types';
import { formatDateDouala } from '../utils/formatters';
import { subscribeToAppContent } from '../services/supabase';
import { churchSyncService } from '../services/churchSyncService';

interface ForumPageProps {
  onNavigate?: (page: string) => void;
}

export const ForumPage: React.FC<ForumPageProps> = ({ onNavigate }) => {
  const { currentUser, isSupabaseConfigured } = useAuth();
  const isPastorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const selectedTopicRef = React.useRef<ForumTopic | null>(null);
  selectedTopicRef.current = selectedTopic;

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | 'recent'>('all');

  // New topic modal (only for Pastor or Admin)
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicCategoryId, setNewTopicCategoryId] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newTopicIsPinned, setNewTopicIsPinned] = useState(false);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  // Reply form
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Moderation & Reports
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [showReportsTab, setShowReportsTab] = useState(false);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  useEffect(() => {
    loadCategoriesAndTopics();

    // 1. Souscription temps réel Supabase app_content pour les échanges du forum
    let unsubApp = () => {};
    try {
      unsubApp = subscribeToAppContent(({ sectionKey, contentData }) => {
        if (sectionKey === 'forum_topics' && Array.isArray(contentData)) {
          setTopics(contentData);
        } else if (sectionKey === 'forum_posts' && Array.isArray(contentData)) {
          if (selectedTopicRef.current) {
            const filtered = contentData.filter((p: any) => p.topicId === selectedTopicRef.current?.id);
            setPosts(filtered);
          }
        }
      });
    } catch (e) {
      console.warn('Realtime forum non disponible:', e);
    }

    // 2. Événements réseau local / sockets
    let unsubSync = () => {};
    try {
      unsubSync = churchSyncService.subscribe((event) => {
        if (event.payload?.type?.startsWith('forum:')) {
          loadCategoriesAndTopics();
          if (selectedTopicRef.current) {
            apiClient.getForumPosts(selectedTopicRef.current.id).then((pList) => {
              setPosts(pList || []);
            });
          }
        }
      });
    } catch {}

    return () => {
      unsubApp();
      unsubSync();
    };
  }, []);

  const loadCategoriesAndTopics = async () => {
    try {
      const [cats, tops] = await Promise.all([
        apiClient.getForumCategories(),
        apiClient.getForumTopics(),
      ]);
      setCategories(cats || []);
      setTopics(tops || []);
      if (cats && cats.length > 0 && !newTopicCategoryId) {
        setNewTopicCategoryId(cats[0].id);
      }
      if (isPastorOrAdmin) {
        const reps = await apiClient.getForumReports();
        setReports(reps || []);
      }
    } catch (err) {
      console.error('Erreur chargement forum:', err);
    }
  };

  const handleSelectTopic = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    setIsLoadingPosts(true);
    try {
      const pList = await apiClient.getForumPosts(topic.id);
      setPosts(pList || []);
    } catch (err) {
      console.error('Erreur chargement réponses:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isPastorOrAdmin) {
      showToast('Action réservée au Pasteur et à l’Administrateur.');
      return;
    }
    if (!newTopicCategoryId || !newTopicTitle.trim() || !newTopicContent.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmittingTopic(true);
    try {
      const res = await apiClient.createForumTopic(
        newTopicCategoryId,
        newTopicTitle.trim(),
        newTopicContent.trim(),
        currentUser,
        newTopicIsPinned
      );

      setShowNewTopicModal(false);
      setNewTopicTitle('');
      setNewTopicContent('');
      setNewTopicIsPinned(false);
      showToast('Sujet pastoral initié avec succès !');

      const updatedTopics = await apiClient.getForumTopics();
      setTopics(updatedTopics);
      if (res?.topic) {
        handleSelectTopic(res.topic);
      }
    } catch (err) {
      console.error('Erreur création sujet:', err);
      showToast('Erreur lors de la création du sujet.');
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;
    if (selectedTopic.isLocked) {
      showToast('Ce sujet a été clôturé par le pasteur. Réponses suspendues.');
      return;
    }
    if (!currentUser) {
      showToast('Vous devez être connecté pour participer au forum.');
      return;
    }
    if (!replyContent.trim()) return;

    setIsSubmittingReply(true);
    try {
      await apiClient.createForumPost(selectedTopic.id, replyContent.trim(), currentUser);
      setReplyContent('');
      showToast('Votre contribution fraternelle a été publiée.');

      const pList = await apiClient.getForumPosts(selectedTopic.id);
      setPosts(pList || []);

      // Refresh topic counts
      const tops = await apiClient.getForumTopics();
      setTopics(tops);
      const updatedCurrent = tops.find((t) => t.id === selectedTopic.id);
      if (updatedCurrent) setSelectedTopic(updatedCurrent);
    } catch (err) {
      console.error('Erreur réponse:', err);
      showToast('Erreur lors de l’envoi de votre message.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleTogglePin = async () => {
    if (!selectedTopic || !currentUser || !isPastorOrAdmin) return;
    try {
      await apiClient.toggleTopicPin(selectedTopic.id, currentUser);
      const updatedTopics = await apiClient.getForumTopics();
      setTopics(updatedTopics);
      const updated = updatedTopics.find((t) => t.id === selectedTopic.id);
      if (updated) setSelectedTopic(updated);
      showToast(updated?.isPinned ? 'Sujet épinglé en tête du forum.' : 'Sujet désépinglé.');
    } catch (err) {
      console.error('Erreur pin:', err);
    }
  };

  const handleToggleLock = async () => {
    if (!selectedTopic || !currentUser || !isPastorOrAdmin) return;
    try {
      await apiClient.toggleTopicLock(selectedTopic.id, currentUser);
      const updatedTopics = await apiClient.getForumTopics();
      setTopics(updatedTopics);
      const updated = updatedTopics.find((t) => t.id === selectedTopic.id);
      if (updated) setSelectedTopic(updated);
      showToast(updated?.isLocked ? 'Discussion clôturée par la direction.' : 'Discussion réouverte.');
    } catch (err) {
      console.error('Erreur lock:', err);
    }
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic || !currentUser || !isPastorOrAdmin) return;
    if (!window.confirm(`Supprimer définitivement la discussion "${selectedTopic.title}" et tous ses messages ?`)) {
      return;
    }
    try {
      await apiClient.deleteForumTopic(selectedTopic.id, currentUser);
      setSelectedTopic(null);
      const updatedTopics = await apiClient.getForumTopics();
      setTopics(updatedTopics);
      showToast('Discussion supprimée du forum.');
    } catch (err) {
      console.error('Erreur suppression sujet:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser || !isPastorOrAdmin) return;
    if (!window.confirm('Supprimer ce message du fil de discussion ?')) return;
    try {
      await apiClient.deleteForumPost(postId, currentUser);
      if (selectedTopic) {
        const pList = await apiClient.getForumPosts(selectedTopic.id);
        setPosts(pList || []);
      }
      showToast('Message supprimé.');
    } catch (err) {
      console.error('Erreur suppression post:', err);
    }
  };

  const handleReportPost = async (postId: string) => {
    if (!currentUser || !reportReason.trim()) return;
    try {
      await apiClient.reportForumPost(postId, reportReason.trim(), currentUser);
      setReportingPostId(null);
      setReportReason('');
      showToast('Signalement transmis à la modération pastorale.');
      if (isPastorOrAdmin) {
        const reps = await apiClient.getForumReports();
        setReports(reps || []);
      }
    } catch (err) {
      console.error('Erreur report:', err);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'TRAITÉ' | 'REJETÉ') => {
    if (!currentUser || !isPastorOrAdmin) return;
    try {
      await apiClient.resolveForumReport(reportId, action, currentUser);
      const reps = await apiClient.getForumReports();
      setReports(reps || []);
      showToast(`Signalement marqué ${action.toLowerCase()}.`);
    } catch (err) {
      console.error('Erreur résolution report:', err);
    }
  };

  const insertQuickText = (text: string) => {
    setReplyContent((prev) => (prev ? `${prev} ${text}` : text));
  };

  // Helper icons for categories
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-[#C99B2E]" />;
      case 'Church':
        return <Church className="w-4 h-4 text-[#C99B2E]" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4 text-[#C99B2E]" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-4 h-4 text-[#C99B2E]" />;
      default:
        return <MessageSquare className="w-4 h-4 text-[#C99B2E]" />;
    }
  };

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return topics
      .filter((t) => {
        if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchAuthor = t.authorName.toLowerCase().includes(q);
          if (!matchTitle && !matchAuthor) return false;
        }
        if (activeFilter === 'pinned' && !t.isPinned) return false;
        return true;
      })
      .sort((a, b) => {
        // Pinned topics first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [topics, selectedCategoryId, searchQuery, activeFilter]);

  const pendingReportsCount = reports.filter((r) => r.status === 'EN_ATTENTE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2.5 animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-[#C99B2E]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Forum Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#C99B2E]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#4A0E17]/10 text-[#6E1325] border border-[#6E1325]/20 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                <MessageSquare className="w-3 h-3 text-[#C99B2E]" />
                <span>Communion Fraternelle & Édification</span>
              </span>
              <span className="text-xs text-[#C99B2E] font-bold">EMF Sangmelima</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#4A0E17] tracking-tight">
              Forum Chrétien & Partage Biblique
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Espace d'échange spirituel, de réflexion doctrinale et d'intercession fraternelle.
              Les sujets de discussion sont initiés par le Pasteur et l'Administration paroissiale pour guider notre marche dans la foi. Tous les fidèles et visiteurs sont chaleureusement invités à participer.
            </p>

            {/* Biblical verse banner */}
            <div className="pt-2 flex items-center space-x-2 text-xs text-amber-900 bg-amber-50/80 px-3.5 py-2 rounded-xl border border-amber-200/60 italic">
              <Quote className="w-3.5 h-3.5 text-[#C99B2E] flex-shrink-0" />
              <span>
                « Comme le fer aiguise le fer, ainsi un homme aiguise la face de son ami. » — Proverbes 27:17
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
            {isPastorOrAdmin ? (
              <button
                onClick={() => setShowNewTopicModal(true)}
                className="px-5 py-3 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 border border-[#C99B2E]/40 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#C99B2E]" />
                <span>Initier un Sujet Pastoral</span>
              </button>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center max-w-xs">
                <p className="text-[11px] text-slate-500 font-medium">
                  📖 Sujets définis par la direction pastorale. Vous pouvez lire et apporter vos contributions ci-dessous !
                </p>
              </div>
            )}

            {isPastorOrAdmin && reports.length > 0 && (
              <button
                onClick={() => setShowReportsTab(!showReportsTab)}
                className={`px-3 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer border ${
                  showReportsTab
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
                title="Modération des signalements"
              >
                <Flag className="w-4 h-4 text-rose-600" />
                <span>Signalements</span>
                {pendingReportsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {pendingReportsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Panel (Admin & Pastor only) */}
      {showReportsTab && isPastorOrAdmin && (
        <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm text-[#4A0E17]">
                Centre de Modération Pastorale ({reports.length} signalement(s))
              </h3>
            </div>
            <button
              onClick={() => setShowReportsTab(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Fermer
            </button>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">
              Aucun message n'a été signalé par les fidèles. Gloire à Dieu pour la paix fraternelle !
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.status === 'EN_ATTENTE'
                            ? 'bg-amber-100 text-amber-800'
                            : rep.status === 'TRAITÉ'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {rep.status}
                      </span>
                      <span className="font-semibold text-slate-700">
                        Signalé par {rep.reporterName} • {formatDateDouala(rep.createdAt, true)}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Motif :</strong> {rep.reason}
                    </p>
                    {rep.postSnippet && (
                      <p className="text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                        « {rep.postSnippet}... »
                      </p>
                    )}
                  </div>

                  {rep.status === 'EN_ATTENTE' && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'TRAITÉ')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs"
                      >
                        Marquer Traité
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'REJETÉ')}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300"
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: Specific Topic Thread */}
      {selectedTopic ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-xs text-[#6E1325] hover:text-[#4A0E17] flex items-center space-x-1.5 font-bold cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
              <span>Retour à la liste des discussions</span>
            </button>

            {/* Moderation Controls for Pastor/Admin */}
            {isPastorOrAdmin && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTogglePin}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center space-x-1 transition cursor-pointer ${
                    selectedTopic.isPinned
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={selectedTopic.isPinned ? 'Désépingler ce sujet' : 'Épingler ce sujet en tête'}
                >
                  <Pin className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>{selectedTopic.isPinned ? 'Épinglé' : 'Épingler'}</span>
                </button>

                <button
                  onClick={handleToggleLock}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center space-x-1 transition cursor-pointer ${
                    selectedTopic.isLocked
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={selectedTopic.isLocked ? 'Réouvrir le sujet' : 'Clôturer ce sujet'}
                >
                  {selectedTopic.isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-red-600" />
                      <span>Clôturé</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ouvert</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDeleteTopic}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white text-red-600 border border-red-200 hover:bg-red-50 transition cursor-pointer"
                  title="Supprimer définitivement la discussion"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Topic Title & Pastoral Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {selectedTopic.isPinned && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase flex items-center space-x-1">
                  <Pin className="w-3 h-3 text-[#C99B2E]" />
                  <span>Épinglé en Priorité</span>
                </span>
              )}
              {selectedTopic.isLocked && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Discussion Clôturée</span>
                </span>
              )}
              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Initié le {formatDateDouala(selectedTopic.createdAt, true)}</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#4A0E17] tracking-tight leading-snug">
              {selectedTopic.title}
            </h2>

            <div className="flex items-center space-x-3 text-xs text-slate-600 pt-1">
              <span className="inline-flex items-center space-x-1 font-bold text-[#6E1325]">
                <Shield className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>Sujet Pastoral défini par {selectedTopic.authorName} ({selectedTopic.authorRole})</span>
              </span>
              <span>•</span>
              <span className="text-slate-400">{selectedTopic.viewCount} consultations</span>
              <span>•</span>
              <span className="text-[#C99B2E] font-bold">{posts.length} message(s)</span>
            </div>
          </div>

          {/* Locked Notice */}
          {selectedTopic.isLocked && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
              <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Cette discussion a été clôturée par le pasteur.</p>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  Les réponses sont suspendues pour clore ce thème. Vous pouvez consulter l'ensemble des enseignements et partages apportés ci-dessous.
                </p>
              </div>
            </div>
          )}

          {/* Posts Thread List */}
          <div className="space-y-4 pt-2">
            {isLoadingPosts ? (
              <div className="text-center py-12 space-y-2">
                <div className="w-8 h-8 border-3 border-[#6E1325] border-t-[#C99B2E] rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Chargement des échanges fraternels...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Aucune réponse pour le moment.</p>
                <p className="text-[11px] text-slate-400">Soyez le premier à partager votre réflexion chrétienne !</p>
              </div>
            ) : (
              posts.map((post, idx) => {
                const isFirstPost = idx === 0;
                const isPastorPost = post.authorRole === 'PASTEUR';
                const isAdminPost = post.authorRole === 'ADMIN';

                return (
                  <div
                    key={post.id}
                    className={`rounded-2xl p-5 sm:p-6 transition border ${
                      isFirstPost
                        ? 'bg-gradient-to-br from-amber-50/70 to-rose-50/40 border-amber-200/90 shadow-xs'
                        : isPastorPost
                        ? 'bg-amber-50/30 border-amber-200/50'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-xs border ${
                            isPastorPost
                              ? 'bg-[#4A0E17] text-white border-[#C99B2E]'
                              : isAdminPost
                              ? 'bg-[#6E1325] text-white border-[#C99B2E]/60'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {post.authorName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-xs text-slate-900">
                              {post.authorName}
                            </span>
                            {isFirstPost && (
                              <span className="px-2 py-0.5 rounded-full bg-[#4A0E17] text-[#C99B2E] text-[9px] font-black uppercase tracking-wider">
                                Sujet Pastoral Lancé
                              </span>
                            )}
                            {(isPastorPost || isAdminPost) && !isFirstPost && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold">
                                {post.authorRole}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatDateDouala(post.createdAt, true)}
                          </span>
                        </div>
                      </div>

                      {/* Post actions: report or delete */}
                      <div className="flex items-center space-x-2">
                        {isPastorOrAdmin && !isFirstPost && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 text-slate-300 hover:text-red-600 rounded-lg transition"
                            title="Supprimer ce message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setReportingPostId(post.id)}
                          className="p-1.5 text-slate-300 hover:text-amber-700 rounded-lg transition"
                          title="Signaler ce message au pasteur"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </div>

                    {/* Footer for first pastoral post */}
                    {isFirstPost && (
                      <div className="mt-4 pt-3 border-t border-amber-200/50 flex items-center justify-between text-[11px] text-amber-900/80">
                        <span className="flex items-center space-x-1 font-bold">
                          <Church className="w-3.5 h-3.5 text-[#C99B2E]" />
                          <span>Méditation d'ouverture pour l'assemblée d'Akon & Sangmelima</span>
                        </span>
                        <button
                          onClick={() => {
                            const el = document.getElementById('reply-box');
                            el?.scrollIntoView({ behavior: 'smooth' });
                            el?.focus();
                          }}
                          className="text-[#6E1325] hover:underline font-bold text-xs"
                        >
                          Participer à l'échange ↓
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Reply Form */}
          {!selectedTopic.isLocked && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#4A0E17] flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>Votre Contribution Fraternelle à ce sujet :</span>
                </label>
                <span className="text-[11px] text-slate-400">Échangez dans l'amour et la vérité</span>
              </div>

              {/* Quick inspiration shortcuts */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => insertQuickText('Amen ! Gloire à Jésus pour cette parole.')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] rounded-xl border border-amber-200 transition cursor-pointer font-medium"
                >
                  Amen ! 🙏
                </button>
                <button
                  type="button"
                  onClick={() => insertQuickText('Je rends grâce à Dieu pour cette réflexion.')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] rounded-xl border border-amber-200 transition cursor-pointer font-medium"
                >
                  Action de Grâce ✨
                </button>
                <button
                  type="button"
                  onClick={() => insertQuickText('Je prie pour que le Seigneur nous éclaire tous sur ce point.')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] rounded-xl border border-amber-200 transition cursor-pointer font-medium"
                >
                  Soutien de Prière 🕊️
                </button>
              </div>

              {currentUser ? (
                <form onSubmit={handleSendReply} className="space-y-3">
                  <textarea
                    id="reply-box"
                    rows={4}
                    required
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Écrivez votre message, réflexion biblique ou témoignage ici avec respect et bienveillance..."
                    className="w-full px-4 py-3 text-xs sm:text-sm border border-slate-300 rounded-2xl focus:ring-2 focus:ring-[#6E1325] focus:border-[#6E1325] transition outline-hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-400">
                      Vous publiez sous le nom : <strong className="text-slate-700">{currentUser.firstName} {currentUser.lastName}</strong> ({currentUser.role})
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmittingReply || !replyContent.trim()}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-[#C99B2E]" />
                      <span>{isSubmittingReply ? 'Publication...' : 'Publier ma réponse'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-600 font-bold">
                    Vous devez être connecté avec votre compte pour répondre à cette discussion.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Connectez-vous ou inscrivez-vous gratuitement pour édifier la communauté paroissiale.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: Categories & Topics List */
        <div className="space-y-6">
          {/* Category Filter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center space-x-3 ${
                selectedCategoryId === 'all'
                  ? 'bg-[#4A0E17] text-white border-[#C99B2E] shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                  selectedCategoryId === 'all' ? 'bg-[#6E1325] text-[#C99B2E]' : 'bg-slate-100 text-[#6E1325]'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">Toutes les discussions</span>
                <span className={`text-[10px] ${selectedCategoryId === 'all' ? 'text-amber-200' : 'text-slate-400'}`}>
                  {topics.length} sujet(s)
                </span>
              </div>
            </button>

            {categories.map((cat) => {
              const count = topics.filter((t) => t.categoryId === cat.id).length;
              const isSelected = selectedCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center space-x-3 ${
                    isSelected
                      ? 'bg-[#4A0E17] text-white border-[#C99B2E] shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                      isSelected ? 'bg-[#6E1325] text-[#C99B2E]' : 'bg-amber-50 text-[#6E1325]'
                    }`}
                  >
                    {getCategoryIcon(cat.iconName)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black block truncate">{cat.title}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-slate-400'}`}>
                      {count} sujet(s)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un sujet pastoral ou un mot-clé biblique..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6E1325] outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-bold hidden sm:inline">Filtrer :</span>
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#6E1325] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setActiveFilter('pinned')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1 ${
                  activeFilter === 'pinned'
                    ? 'bg-[#6E1325] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Pin className="w-3 h-3 text-[#C99B2E]" />
                <span>Épinglés</span>
              </button>
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-3">
            {filteredTopics.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-[#4A0E17]">Aucun sujet trouvé</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery
                    ? `Aucun résultat ne correspond à la recherche « ${searchQuery} ». Essayez un autre terme.`
                    : 'Aucune discussion pastorale n’a encore été publiée dans cette catégorie.'}
                </p>
                {isPastorOrAdmin && (
                  <button
                    onClick={() => setShowNewTopicModal(true)}
                    className="mt-3 px-4 py-2 bg-[#6E1325] text-white text-xs font-bold rounded-xl shadow cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4 text-[#C99B2E]" />
                    <span>Créer le Premier Sujet Pastoral</span>
                  </button>
                )}
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const category = categories.find((c) => c.id === topic.categoryId);

                return (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    className={`bg-white rounded-2xl p-5 border transition cursor-pointer hover:shadow-md hover:border-[#6E1325] group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      topic.isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      {/* Topic Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        {topic.isPinned && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase flex items-center space-x-1 border border-amber-200">
                            <Pin className="w-3 h-3 text-[#C99B2E]" />
                            <span>Épinglé</span>
                          </span>
                        )}
                        {topic.isLocked && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase flex items-center space-x-1 border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Clôturé</span>
                          </span>
                        )}
                        {category && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {category.title}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {formatDateDouala(topic.createdAt)}
                        </span>
                      </div>

                      {/* Topic Title */}
                      <h3 className="text-base font-bold text-[#4A0E17] group-hover:text-[#6E1325] transition leading-snug">
                        {topic.title}
                      </h3>

                      {/* Author Info */}
                      <p className="text-xs text-slate-500 flex items-center space-x-1.5">
                        <span className="text-slate-400">Initié par</span>
                        <strong className="text-slate-700 font-bold">{topic.authorName}</strong>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          {topic.authorRole}
                        </span>
                      </p>
                    </div>

                    {/* Stats & Open Arrow */}
                    <div className="flex items-center space-x-5 text-xs text-slate-500 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                      <div className="flex items-center space-x-1.5" title="Nombre de réponses">
                        <MessageSquare className="w-4 h-4 text-[#6E1325]" />
                        <span className="font-bold text-slate-700">{topic.replyCount || 0}</span>
                        <span className="hidden sm:inline text-slate-400">rép.</span>
                      </div>
                      <div className="flex items-center space-x-1.5" title="Nombre de vues">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span>{topic.viewCount}</span>
                      </div>
                      <span className="text-xs font-bold text-[#6E1325] group-hover:translate-x-1 transition flex items-center">
                        Participer →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: Initier un Nouveau Sujet Pastoral (Admin & Pasteur Uniquement) */}
      {showNewTopicModal && isPastorOrAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            {/* Modal Header in Bordeaux */}
            <div className="bg-[#4A0E17] px-6 py-5 text-white flex items-center justify-between border-b border-[#C99B2E]/40">
              <div className="flex items-center space-x-2.5">
                <Church className="w-5 h-5 text-[#C99B2E]" />
                <div>
                  <h3 className="font-black text-sm text-white">
                    Initier un Nouveau Sujet Pastoral
                  </h3>
                  <p className="text-[10px] text-amber-200">
                    Réservé au Pasteur et à l'Administration paroissiale
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTopic} className="p-6 space-y-4 text-xs">
              {/* Category selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Catégorie de la discussion *
                </label>
                <select
                  required
                  value={newTopicCategoryId}
                  onChange={(e) => setNewTopicCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Titre du sujet de réflexion *
                </label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="Ex : Comment concilier vie professionnelle active et culte personnel quotidien ?"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] outline-hidden text-slate-800"
                />
              </div>

              {/* Opening reflection message */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Message d'ouverture pastoral & Méditation biblique *
                </label>
                <textarea
                  rows={6}
                  required
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  placeholder="Écrivez le message introductif, la réflexion biblique, les versets d'appui et les questions orientées pour guider les échanges des fidèles..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] outline-hidden text-slate-800 leading-relaxed"
                />
              </div>

              {/* Pin option */}
              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTopicIsPinned}
                  onChange={(e) => setNewTopicIsPinned(e.target.checked)}
                  className="w-4 h-4 text-[#6E1325] rounded-sm focus:ring-[#6E1325]"
                />
                <span className="text-xs font-bold text-amber-950 flex items-center space-x-1">
                  <Pin className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>Épingler ce sujet en priorité en haut du forum chrétien</span>
                </span>
              </label>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTopic}
                  className="px-6 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 text-[#C99B2E]" />
                  <span>{isSubmittingTopic ? 'Lancement...' : 'Lancer le Sujet Pastoral'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Signalement abusif */}
      {reportingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-red-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">Signaler ce message aux pasteurs</h3>
              </div>
              <button onClick={() => setReportingPostId(null)} className="p-1 text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Pourquoi souhaitez-vous signaler cette publication à la modération pastorale ?
              </p>
              <textarea
                rows={3}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Ex : Propos offensants, doctrine non conforme, non respect de la charte chrétienne..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 outline-hidden"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setReportingPostId(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleReportPost(reportingPostId)}
                  disabled={!reportReason.trim()}
                  className="px-5 py-2 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 shadow transition disabled:opacity-50"
                >
                  Transmettre au Pasteur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
