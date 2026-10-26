import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle,
  BookOpen,
  Shield,
  Calendar,
  Heart,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Check,
  Send,
  Sparkles,
  Volume2,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { AppNotification, NotificationCategory } from '../../types';
import { formatDateDouala } from '../../utils/formatters';
import { BroadcastNotificationModal } from './BroadcastNotificationModal';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { currentUser, settings } = useAuth();
  const [notifications, setNotifications] = useState<(AppNotification & { isRead?: boolean })[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | NotificationCategory>('ALL');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const canBroadcast = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const list = await apiClient.getNotifications(currentUser?.id);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    await apiClient.markNotificationAsRead(id, currentUser?.id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await apiClient.markAllNotificationsAsRead(currentUser?.id);
    loadNotifications();
  };

  const handleDelete = async (id: string) => {
    await apiClient.deleteNotification(id, currentUser || undefined);
    loadNotifications();
  };

  const handleActionClick = async (notif: AppNotification) => {
    await apiClient.markNotificationAsRead(notif.id, currentUser?.id);
    onClose();
    if (notif.actionPage) {
      onNavigate(notif.actionPage);
    }
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification("Notifications de l'Église activées", {
          body: "Vous recevrez les alertes des cultes et enseignements de Sangmelima.",
          icon: '/favicon.ico',
        });
      }
    }
  };

  // Filtered List
  const filtered = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.isRead;
    return n.category === filter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getCategoryConfig = (cat: NotificationCategory) => {
    switch (cat) {
      case 'ENSEIGNEMENT':
        return {
          label: 'Enseignement',
          icon: BookOpen,
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600',
          bgHighlight: 'bg-blue-50/50',
        };
      case 'MESSAGE_ADMIN':
        return {
          label: 'Message Admin',
          icon: Shield,
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          iconColor: 'text-amber-600',
          bgHighlight: 'bg-amber-50/50',
        };
      case 'EVENEMENT':
        return {
          label: 'Date Événement',
          icon: Calendar,
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          iconColor: 'text-emerald-600',
          bgHighlight: 'bg-emerald-50/50',
        };
      case 'URGENT':
        return {
          label: 'Alerte Urgente',
          icon: AlertTriangle,
          badgeBg: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600',
          bgHighlight: 'bg-red-50/50',
        };
      case 'PASTORAL':
      default:
        return {
          label: 'Exhortation Pastorale',
          icon: Heart,
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
          iconColor: 'text-purple-600',
          bgHighlight: 'bg-purple-50/50',
        };
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in">
        <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
          {/* Header */}
          <div className="bg-[#4A0E17] text-white p-5 border-b border-[#C99B2E]/40 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C99B2E]/20 border border-[#C99B2E]/40 flex items-center justify-center text-[#C99B2E]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide">
                    Centre de Notifications
                  </h2>
                  <p className="text-[11px] text-amber-200/90 truncate">
                    {settings.churchName}
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

            {/* Quick Actions Row */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-rose-100 text-[11px]">
                  {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Toutes les alertes sont lues'}
                </span>
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>

              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-[#C99B2E] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Tout marquer lu</span>
                  </button>
                )}
                {canBroadcast && (
                  <button
                    onClick={() => setIsBroadcastModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-[#C99B2E] text-[#4A0E17] font-black text-[11px] hover:bg-amber-400 transition flex items-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Diffuser</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="bg-slate-50 p-2.5 border-b border-slate-200 flex-shrink-0 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-[#4A0E17] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-[#4A0E17] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('ENSEIGNEMENT')}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'ENSEIGNEMENT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              📖 Enseignements
            </button>
            <button
              onClick={() => setFilter('MESSAGE_ADMIN')}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'MESSAGE_ADMIN'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🛡️ Admin
            </button>
            <button
              onClick={() => setFilter('EVENEMENT')}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'EVENEMENT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              📅 Événements
            </button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">Aucune notification</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Toutes les alertes paroissiales sont à jour pour cette catégorie.
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const conf = getCategoryConfig(item.category);
                const Icon = conf.icon;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 border transition space-y-2.5 relative ${
                      !item.isRead
                        ? 'bg-white border-[#C99B2E]/60 shadow-sm ring-1 ring-[#C99B2E]/20'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    {/* Unread dot */}
                    {!item.isRead && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#C99B2E]" />
                    )}

                    {/* Top Row: Category Badge & Time */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase border flex items-center space-x-1 ${conf.badgeBg}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{conf.label}</span>
                        </span>
                        {item.priority === 'URGENTE' && (
                          <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black uppercase text-[9px]">
                            Urgent
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-medium">
                        {formatDateDouala(item.createdAt)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-[#4A0E17] leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {/* Footer Row: Action Button & Delete */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      {item.actionPage ? (
                        <button
                          onClick={() => handleActionClick(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold text-[11px] transition flex items-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <span>{item.actionLabel || 'Consulter'}</span>
                          <ArrowRight className="w-3 h-3 text-[#C99B2E]" />
                        </button>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center space-x-1">
                        {!item.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(item.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 transition"
                            title="Marquer comme lu"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canBroadcast && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition"
                            title="Supprimer la notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Permission & Close */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0 space-y-2">
            {notificationPermission !== 'granted' && 'Notification' in window && (
              <button
                onClick={requestBrowserPermission}
                className="w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#4A0E17] font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>Activer les alertes sur ce téléphone / navigateur</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer text-center"
            >
              Fermer le panneau
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast Modal for Leadership */}
      <BroadcastNotificationModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSuccess={() => loadNotifications()}
      />
    </>
  );
};
