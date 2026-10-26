import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Plus,
  Shield,
  UserX,
  Lock,
  Globe,
  Sparkles,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Trash2,
  X,
  MessageCircle,
  Share2,
  Calendar,
  ThumbsUp,
  AlertCircle,
  Flame,
  User as UserIcon,
  Radio,
  BellRing,
  Volume2,
  VolumeX,
  Bell,
  Eye,
  History,
  TestTube,
  Activity,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { PrayerRequest } from '../types';
import { formatDateDouala } from '../utils/formatters';
import {
  prayerRealtimeService,
  PrayerAlertEvent,
  RealtimeStatus,
} from '../services/prayerRealtimeService';

interface PrayerRequestsPageProps {
  onNavigate?: (page: string) => void;
}

export const PrayerRequestsPage: React.FC<PrayerRequestsPageProps> = () => {
  const { currentUser, hasRole } = useAuth();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TOUS');
  const [onlyAnonymous, setOnlyAnonymous] = useState(false);

  // Real-time Notification System States
  const [activeAlerts, setActiveAlerts] = useState<PrayerAlertEvent[]>([]);
  const [alertsHistory, setAlertsHistory] = useState<PrayerAlertEvent[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>(
    prayerRealtimeService.getStatus()
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    prayerRealtimeService.isSoundEnabled()
  );
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(
    prayerRealtimeService.getNotificationPermission()
  );
  const [highlightedPrayerId, setHighlightedPrayerId] = useState<string | null>(null);

  // Modal State for New Prayer Request
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Santé & Guérison' as PrayerRequest['category'],
    authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
    phone: currentUser?.phone || '',
    isAnonymous: false,
    isConfidentialPastoralOnly: false,
  });

  // Modal State for Testifying an Answered Prayer
  const [testimonyModalOpen, setTestimonyModalOpen] = useState(false);
  const [activePrayerForTestimony, setActivePrayerForTestimony] = useState<PrayerRequest | null>(null);
  const [testimonyText, setTestimonyText] = useState('');

  // Prayed list in session to prevent multi-clicking on same session
  const [prayedIds, setPrayedIds] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isPastorOrAdmin = hasRole(['ADMIN', 'PASTEUR']);

  useEffect(() => {
    loadPrayers();
  }, [currentUser]);

  // Real-time listeners setup
  useEffect(() => {
    // 1. Connection status listener
    const unsubStatus = prayerRealtimeService.onStatusChange((status) => {
      setRealtimeStatus(status);
    });

    // 2. Incoming real-time new prayer request listener
    const unsubNewPrayer = prayerRealtimeService.onNewPrayer((alertEvent) => {
      const p = alertEvent.prayer;

      // Confidential pastoral-only guard
      if (p.isConfidentialPastoralOnly && !isPastorOrAdmin) {
        return;
      }

      // Prepend to prayer state idempotently (avoiding duplicates)
      setPrayers((prev) => {
        if (prev.some((item) => item.id === p.id)) {
          return prev;
        }
        return [p, ...prev];
      });

      // Push to active floating alerts (max 3 visible simultaneously)
      setActiveAlerts((prev) => [alertEvent, ...prev.filter((a) => a.id !== alertEvent.id).slice(0, 2)]);

      // Push to session alerts history (up to 30)
      setAlertsHistory((prev) => [alertEvent, ...prev.filter((a) => a.id !== alertEvent.id).slice(0, 29)]);

      // Spotlight highlight the card for 7 seconds
      setHighlightedPrayerId(p.id);
      setTimeout(() => {
        setHighlightedPrayerId((curr) => (curr === p.id ? null : curr));
      }, 7000);

      // Auto-dismiss floating toast after 10 seconds
      setTimeout(() => {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== alertEvent.id));
      }, 10000);
    });

    // 3. Real-time intercession counter listener
    const unsubIntercession = prayerRealtimeService.onIntercession(({ prayerId, count }) => {
      setPrayers((prev) =>
        prev.map((pr) => (pr.id === prayerId ? { ...pr, prayerCount: count } : pr))
      );
    });

    return () => {
      unsubStatus();
      unsubNewPrayer();
      unsubIntercession();
    };
  }, [isPastorOrAdmin]);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPrayerRequests(isPastorOrAdmin, currentUser?.role);
      setPrayers(data);
    } catch (err) {
      console.error('Failed to load prayer requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Veuillez renseigner le titre et la description de votre requête.');
      return;
    }

    try {
      const created = await apiClient.createPrayerRequest(
        {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          authorName: formData.authorName,
          phone: formData.phone,
          isAnonymous: formData.isAnonymous,
          isConfidentialPastoralOnly: formData.isConfidentialPastoralOnly,
          status: 'EN_PRIERE',
        },
        currentUser || undefined
      );

      // Update local state idempotently
      setPrayers((prev) => {
        if (prev.some((p) => p.id === created.id)) return prev;
        return [created, ...prev];
      });

      // Broadcast in REAL-TIME to all connected church members and open tabs
      prayerRealtimeService.broadcastPrayerCreated(created);

      setModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'Santé & Guérison',
        authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
        phone: currentUser?.phone || '',
        isAnonymous: false,
        isConfidentialPastoralOnly: false,
      });

      setSuccessMessage(
        formData.isAnonymous
          ? 'Votre requête a été soumise avec succès dans le plus strict anonymat.'
          : 'Votre requête de prière a été enregistrée et diffusée en direct.'
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to create prayer request:', err);
      alert('Une erreur est survenue lors de la soumission de la requête.');
    }
  };

  const handleIntercede = async (id: string) => {
    if (prayedIds[id]) return;
    try {
      const updated = await apiClient.incrementPrayerCount(id);
      if (updated) {
        setPrayers((prev) => prev.map((p) => (p.id === id ? updated : p)));
        setPrayedIds((prev) => ({ ...prev, [id]: true }));
        // Broadcast in real-time
        prayerRealtimeService.broadcastIntercession(id, updated.prayerCount);
      }
    } catch (err) {
      console.error('Failed to increment prayer count:', err);
    }
  };

  const dismissAlert = (alertId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleFocusPrayerCard = (prayerId: string) => {
    setHighlightedPrayerId(prayerId);
    setTimeout(() => {
      const elem = document.getElementById(`prayer-card-${prayerId}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    setTimeout(() => {
      setHighlightedPrayerId((curr) => (curr === prayerId ? null : curr));
    }, 7000);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    prayerRealtimeService.setSoundEnabled(next);
    if (next) {
      prayerRealtimeService.playPrayerAlertSound();
    }
  };

  const handleRequestBrowserNotifications = async () => {
    const perm = await prayerRealtimeService.requestNotificationPermission();
    setBrowserPermission(perm);
  };

  const handleTriggerSimulation = () => {
    prayerRealtimeService.triggerTestSimulation();
  };

  const handleOpenTestimonyModal = (prayer: PrayerRequest) => {
    setActivePrayerForTestimony(prayer);
    setTestimonyText(prayer.testimony || '');
    setTestimonyModalOpen(true);
  };

  const handleSubmitTestimony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePrayerForTestimony || !testimonyText.trim()) return;

    try {
      const updated = await apiClient.addPrayerTestimony(
        activePrayerForTestimony.id,
        testimonyText,
        currentUser || undefined
      );
      if (updated) {
        setPrayers(prayers.map((p) => (p.id === updated.id ? updated : p)));
        setTestimonyModalOpen(false);
        setActivePrayerForTestimony(null);
        setTestimonyText('');
        setSuccessMessage('Gloire à Dieu ! Votre témoignage d’exaucement a été publié avec la requête.');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Failed to submit testimony:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette requête de prière ?')) return;
    try {
      const ok = await apiClient.deletePrayerRequest(id, currentUser || undefined);
      if (ok) {
        setPrayers(prayers.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete prayer request:', err);
    }
  };

  // Filtered prayers
  const filteredPrayers = prayers.filter((pr) => {
    if (onlyAnonymous && !pr.isAnonymous) return false;
    if (selectedCategory !== 'TOUS' && pr.category !== selectedCategory) return false;
    if (selectedStatus !== 'TOUS' && pr.status !== selectedStatus) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = pr.title.toLowerCase().includes(term);
      const matchDesc = pr.description.toLowerCase().includes(term);
      const matchAuthor = !pr.isAnonymous && pr.authorName.toLowerCase().includes(term);
      return matchTitle || matchDesc || matchAuthor;
    }
    return true;
  });

  const categories: PrayerRequest['category'][] = [
    'Santé & Guérison',
    'Famille & Foyer',
    'Travail & Finances',
    'Combat Spirituel',
    'Salut & Délivrance',
    'Études & Concours',
    'Autre',
  ];

  // Stats calculation
  const totalCount = prayers.length;
  const activeCount = prayers.filter((p) => p.status === 'EN_PRIERE').length;
  const answeredCount = prayers.filter((p) => p.status === 'EXAUCE').length;
  const anonymousCount = prayers.filter((p) => p.isAnonymous).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C99B2E]/20 border border-[#C99B2E]/40 text-[#C99B2E] text-xs font-semibold">
              <Flame className="w-3.5 h-3.5" />
              <span>Autel d’Intercession & Prières — Sangmelima</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Requêtes & Sujets de Prière
            </h1>
            <p className="text-sm text-rose-100/90 leading-relaxed">
              « Priez les uns pour les autres, afin que vous soyez guéris. La prière fervente du juste a une grande efficace. » — Jacques 5:16.
              Déposez vos besoins en toute confiance, nominativement ou de façon{' '}
              <strong className="text-[#C99B2E] font-bold">100% anonyme</strong>.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2.5 px-5 py-3 rounded-xl bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer self-start md:self-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Déposer une Requête</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-rose-200 font-medium">Total Requêtes</p>
            <p className="text-xl sm:text-2xl font-black text-white">{totalCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-amber-200 font-medium">En Prière Active</p>
            <p className="text-xl sm:text-2xl font-black text-[#C99B2E]">{activeCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-emerald-200 font-medium">Prières Exaucées</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">{answeredCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-amber-100 font-medium">Requêtes Anonymes</p>
            <p className="text-xl sm:text-2xl font-black text-amber-200">{anonymousCount}</p>
          </div>
        </div>
      </div>

      {/* Floating Real-Time Live Notification Toast Stack */}
      {activeAlerts.length > 0 && (
        <div className="fixed top-20 right-4 z-50 flex flex-col space-y-3 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none">
          {activeAlerts.map((alert) => {
            const hasPrayed = !!prayedIds[alert.prayer.id];
            return (
              <div
                key={alert.id}
                className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#C99B2E] shadow-2xl p-4 transition-all duration-300 animate-in slide-in-from-top-4 fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#8C182F] text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>EN DIRECT</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#4A0E17] flex items-center space-x-1">
                      <BellRing className="w-3.5 h-3.5 text-[#C99B2E] animate-bounce" />
                      <span>Nouvelle requête reçue !</span>
                    </span>
                  </div>

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Fermer cette notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-semibold text-slate-800 flex items-center space-x-1">
                      {alert.prayer.isAnonymous ? (
                        <>
                          <Shield className="w-3.5 h-3.5 text-[#6E1325]" />
                          <span>Fidèle Anonyme</span>
                        </>
                      ) : (
                        <>
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{alert.prayer.authorName}</span>
                        </>
                      )}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                      {alert.prayer.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                    {alert.prayer.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {alert.prayer.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      handleFocusPrayerCard(alert.prayer.id);
                      dismissAlert(alert.id);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Consulter la requête</span>
                  </button>

                  <button
                    onClick={() => handleIntercede(alert.prayer.id)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      hasPrayed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17]'
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>{hasPrayed ? '✓ Prié (+1)' : '🙏 Prier maintenant'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Real-Time Live Notification Status & Control Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          {/* Live Status Radar */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  realtimeStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  realtimeStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-xs font-bold text-slate-700">
              {realtimeStatus === 'connected'
                ? 'En Direct • Alertes de prière actives'
                : 'Connexion au serveur en direct...'}
            </span>
          </div>

          {/* Sound Chime Toggle */}
          <button
            onClick={handleToggleSound}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title={
              soundEnabled
                ? 'Carillon céleste activé à chaque nouvelle requête'
                : 'Sonnerie désactivée'
            }
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#C99B2E]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{soundEnabled ? 'Sonnerie active' : 'Son muet'}</span>
          </button>

          {/* Desktop Push Notification Permission */}
          {browserPermission !== 'unsupported' && (
            <button
              onClick={handleRequestBrowserNotifications}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                browserPermission === 'granted'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {browserPermission === 'granted'
                  ? 'Notifications bureau autorisées'
                  : 'Activer alertes bureau'}
              </span>
            </button>
          )}
        </div>

        {/* Right side tools: History & Test Trigger */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Recent live alerts history button */}
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              alertsHistory.length > 0
                ? 'bg-[#FAF0F2] text-[#6E1325] border-rose-200 hover:bg-rose-100'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historique direct ({alertsHistory.length})</span>
          </button>

          {/* Simulation / Test Button */}
          <button
            onClick={handleTriggerSimulation}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-[#C99B2E]/20 hover:from-amber-500/20 hover:to-[#C99B2E]/30 text-[#4A0E17] border border-[#C99B2E]/40 text-xs font-bold transition cursor-pointer"
            title="Simuler l'arrivée d'une requête de membre pour tester le carillon et l'alerte en direct"
          >
            <TestTube className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>Tester l'alerte en direct</span>
          </button>
        </div>
      </div>

      {/* Live Session Alerts History Dropdown / Panel */}
      {isHistoryOpen && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-[#6E1325]" />
              <h3 className="font-bold text-xs text-[#4A0E17] uppercase tracking-wider">
                Requêtes de prière reçues en direct pendant cette session ({alertsHistory.length})
              </h3>
            </div>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Fermer
            </button>
          </div>

          {alertsHistory.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">
              Aucune requête reçue en direct pour le moment. Dès qu'un membre soumet une requête, elle apparaîtra ici en temps réel.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {alertsHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleFocusPrayerCard(item.prayer.id)}
                  className="bg-white p-3 rounded-xl border border-slate-200 hover:border-[#C99B2E] hover:shadow-xs transition cursor-pointer flex flex-col justify-between space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#6E1325]">{item.prayer.category}</span>
                    <span className="text-slate-400">{formatDateDouala(item.timestamp)}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 line-clamp-1">
                    {item.prayer.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    Par {item.prayer.isAnonymous ? 'Fidèle Anonyme' : item.prayer.authorName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par mot-clé, sujet ou fardeau..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white"
            >
              <option value="TOUS">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="EN_PRIERE">En cours de prière</option>
              <option value="EXAUCE">Exaucées / Témoignage</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="ARCHIVE">Archivées</option>
            </select>

            {/* Anonymous Only Filter Button */}
            <button
              onClick={() => setOnlyAnonymous(!onlyAnonymous)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                onlyAnonymous
                  ? 'bg-[#6E1325] text-white border border-[#6E1325]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Anonymes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prayers List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#6E1325] border-t-[#C99B2E] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Chargement des sujets de prière...</p>
        </div>
      ) : filteredPrayers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-[#C99B2E] flex items-center justify-center mx-auto">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-slate-800 text-base">Aucune requête trouvée</h3>
            <p className="text-xs text-slate-500">
              Aucun sujet de prière ne correspond à vos critères de recherche. Soyez le premier à déposer un besoin de prière pour l'assemblée.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold transition inline-flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Déposer une requête maintenant</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrayers.map((prayer) => {
            const hasPrayed = !!prayedIds[prayer.id];
            const isExaucee = prayer.status === 'EXAUCE';
            const isHighlighted = highlightedPrayerId === prayer.id;

            return (
              <div
                key={prayer.id}
                id={`prayer-card-${prayer.id}`}
                className={`bg-white rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between shadow-xs hover:shadow-md relative ${
                  isHighlighted
                    ? 'ring-4 ring-[#C99B2E] ring-offset-2 bg-gradient-to-b from-amber-50/70 to-white shadow-xl scale-[1.01]'
                    : isExaucee
                    ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/20 to-white'
                    : 'border-slate-200'
                }`}
              >
                {/* Live Real-Time Influx Badge */}
                {isHighlighted && (
                  <div className="mb-3 -mt-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#4A0E17] to-[#6E1325] text-white text-xs font-bold flex items-center justify-between shadow-sm animate-pulse">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C99B2E]" />
                      <span>Nouvelle requête reçue en direct !</span>
                    </span>
                    <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
                      À l'instant
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0F2] text-[#6E1325] border border-rose-200">
                        {prayer.category}
                      </span>

                      {prayer.isAnonymous ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF0F2] text-[#6E1325] border border-rose-200">
                          <UserX className="w-3 h-3" />
                          <span>Anonyme</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-slate-600 font-medium">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          <span>{prayer.authorName}</span>
                        </span>
                      )}

                      {prayer.isConfidentialPastoralOnly && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>Collège Pastoral Seul</span>
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    {isExaucee ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Exaucée !</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        En intercession
                      </span>
                    )}
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {prayer.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                      {prayer.description}
                    </p>
                  </div>

                  {/* Testimony Box if answered */}
                  {prayer.testimony && (
                    <div className="bg-amber-50/70 border border-[#C99B2E]/30 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#4A0E17]">
                        <Sparkles className="w-3.5 h-3.5 text-[#C99B2E]" />
                        <span>Témoignage d'exaucement & Reconnaissance :</span>
                      </div>
                      <p className="text-xs text-slate-700 italic">
                        « {prayer.testimony} »
                      </p>
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateDouala(prayer.createdAt)}</span>
                    </span>
                    <span className="font-medium text-slate-500">
                      {prayer.prayerCount} intercession{prayer.prayerCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Card Actions Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleIntercede(prayer.id)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      hasPrayed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#FAF0F2] hover:bg-[#6E1325] hover:text-white text-[#6E1325]'
                    }`}
                  >
                    <HeartHandshake className={`w-3.5 h-3.5 ${hasPrayed ? 'text-emerald-600' : ''}`} />
                    <span>{hasPrayed ? 'J’ai prié pour ce fardeau' : 'Je prie avec vous'}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {!isExaucee && (
                      <button
                        onClick={() => handleOpenTestimonyModal(prayer)}
                        title="Partager un témoignage d'exaucement"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Exaucé ? Témoigner
                      </button>
                    )}

                    {/* Pastoral / Admin Options */}
                    {isPastorOrAdmin && (
                      <button
                        onClick={() => handleDelete(prayer.id)}
                        title="Supprimer la requête"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Déposer une requête */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-[#C99B2E]">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#4A0E17]">
                    Déposer une Requête de Prière
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assemblée Église Missionnaire de la Foi de Sangmelima
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrayer} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catégorie du besoin spirituel *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as PrayerRequest['category'] })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sujet ou Titre de la requête *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Prière pour la guérison de mon fils, Soutien dans les études..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description détaillée du sujet de prière *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Expliquez en quelques lignes votre besoin afin que l'assemblée et les intercesseurs puissent prier de façon ciblée et efficace..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
                />
              </div>

              {/* Anonymous Toggle - Highly Visible */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-[#FAF0F2] space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                    className="w-4 h-4 rounded text-[#6E1325] focus:ring-[#6E1325]"
                  />
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-[#6E1325]" />
                    <span className="font-extrabold text-xs text-[#4A0E17]">
                      Garder l'anonymat (Requête Anonyme)
                    </span>
                  </div>
                </label>
                <p className="text-[11px] text-slate-600 pl-7">
                  Si cette case est cochée, votre nom et votre numéro de téléphone ne seront visibles par personne. La requête sera affichée comme provenant d’un « Fidèle Anonyme ».
                </p>
              </div>

              {/* Author name & phone if not anonymous */}
              {!formData.isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Votre Nom ou Prénom
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : Frère Jean, Sœur Marie..."
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Téléphone (facultatif)
                    </label>
                    <input
                      type="tel"
                      placeholder="+237 6xx xx xx xx"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Confidentiality Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isConfidentialPastoralOnly}
                    onChange={(e) =>
                      setFormData({ ...formData, isConfidentialPastoralOnly: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Confidentiel — Restreint au Pasteur et aux responsables d'intercession</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2 cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4 text-[#C99B2E]" />
                  <span>Soumettre ma Requête</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Partager un témoignage d'exaucement */}
      {testimonyModalOpen && activePrayerForTestimony && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-[#4A0E17]">
                  Témoigner d'une Prière Exaucée
                </h3>
              </div>
              <button
                onClick={() => setTestimonyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
              <span className="font-bold text-slate-900">Requête :</span> {activePrayerForTestimony.title}
            </div>

            <form onSubmit={handleSubmitTestimony} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Votre Témoignage de reconnaissance *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Racontez comment Dieu a opéré ce miracle ou répondu à la prière afin d'édifier et d'encourager toute l'assemblée..."
                  value={testimonyText}
                  onChange={(e) => setTestimonyText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTestimonyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Publier l'Exaucement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
