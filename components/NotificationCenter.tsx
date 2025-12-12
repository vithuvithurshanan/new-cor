import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Package, Truck, AlertCircle, CheckCircle, Clock, Settings, Info } from 'lucide-react';
import { AppNotification, User } from '../types';

interface NotificationCenterProps {
  currentUser: User | null;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Get button position for portal positioning
  const updateButtonPosition = () => {
    const button = document.querySelector('.notification-bell-button');
    if (button) {
      setButtonRect(button.getBoundingClientRect());
    }
  };

  // Close notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('.notification-container') && !target.closest('.notification-portal')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      updateButtonPosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updateButtonPosition);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', updateButtonPosition);
      };
    }
  }, [isOpen]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      try {
        const { firebaseService } = await import('../services/firebaseService');
        const data = await firebaseService.getUserNotifications(currentUser.id);
        // Sort by date desc
        const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(sorted);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const { firebaseService } = await import('../services/firebaseService');
      await firebaseService.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { firebaseService } = await import('../services/firebaseService');
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => firebaseService.markNotificationAsRead(n.id)));

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'text-emerald-600 bg-emerald-50';
      case 'WARNING': return 'text-amber-600 bg-amber-50';
      case 'ERROR': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle size={16} />;
      case 'WARNING': return <AlertCircle size={16} />;
      case 'ERROR': return <AlertCircle size={16} />;
      default: return <Info size={16} />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} minutes ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative notification-container">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-bell-button relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Portal */}
      {isOpen && createPortal(
        <div className="notification-portal">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/10"
            style={{ zIndex: 99998 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div
            className="fixed w-80 bg-white/98 backdrop-blur-xl rounded-2xl notification-panel max-h-96 overflow-hidden animate-in slide-in-from-top-2 duration-200 shadow-2xl"
            style={{
              zIndex: 99999,
              top: buttonRect ? buttonRect.bottom + 8 : 60,
              right: buttonRect ? window.innerWidth - buttonRect.right : 20,
              maxWidth: 'calc(100vw - 2rem)'
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <div>
                <h3 className="font-bold text-slate-800">Notifications</h3>
                <p className="text-xs text-slate-500">{unreadCount} unread messages</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification: AppNotification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/30' : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-800 text-sm truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-2">
                <Settings size={14} />
                Notification Settings
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationCenter;