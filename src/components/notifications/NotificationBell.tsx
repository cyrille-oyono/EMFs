import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationsDrawer } from './NotificationsDrawer';

interface NotificationBellProps {
  onNavigate: (page: string) => void;
  className?: string;
  iconClassName?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigate,
  className = '',
  iconClassName = 'w-5 h-5',
}) => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCount();
    // Poll notifications every 30 seconds for live alert updates
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const loadCount = async () => {
    try {
      const list = await apiClient.getNotifications(currentUser?.id);
      const unread = list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (e) {
      // Ignore
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${className}`}
        aria-label="Centre de notifications"
        title={unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Notifications'}
      >
        <Bell className={iconClassName} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationsDrawer
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          loadCount();
        }}
        onNavigate={onNavigate}
      />
    </>
  );
};
