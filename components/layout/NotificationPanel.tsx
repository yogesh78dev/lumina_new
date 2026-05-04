
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../../hooks/useCrm';
import { Notification } from '../../types';

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount } = useCrm();
  const navigate = useNavigate();
  const unreadCount = getUnreadNotificationCount();

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    if (notification.linkTo) {
      navigate(notification.linkTo);
    }
    onClose();
  };
  
  const handleMarkAllRead = (e: React.MouseEvent) => {
      e.preventDefault();
      markAllNotificationsAsRead();
  };

  const handleViewAll = () => {
    navigate('/reminders');
    onClose();
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(Math.max(0, seconds))}s ago`;
  }

  const getIconBgClass = (iconColor?: string) => {
      if (!iconColor) return 'bg-gray-100';
      if (iconColor.includes('blue')) return 'bg-blue-100';
      if (iconColor.includes('yellow')) return 'bg-yellow-100';
      if (iconColor.includes('purple')) return 'bg-purple-100';
      if (iconColor.includes('green')) return 'bg-green-100';
      if (iconColor.includes('red')) return 'bg-red-100';
      return 'bg-gray-100';
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border z-50 flex flex-col max-h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b flex-shrink-0 bg-white">
        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        {unreadCount > 0 && (
            <button 
                onClick={handleMarkAllRead} 
                className="text-xs font-bold text-primary hover:text-red-700 transition-colors uppercase tracking-tight"
            >
                Mark all read
            </button>
        )}
      </div>
      
      <div className="overflow-y-auto thin-scrollbar flex-grow bg-white">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left p-4 flex items-start gap-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors relative ${!notification.isRead ? 'bg-primary/5' : ''}`}
            >
              <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${getIconBgClass(notification.iconColor)}`}>
                <i className={`${notification.icon || 'ri-notification-3-line'} text-lg ${notification.iconColor || 'text-gray-500'}`}></i>
              </div>
              <div className="flex-grow min-w-0">
                <p className={`text-sm truncate ${!notification.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {notification.title}
                </p>
                <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{notification.content}</p>
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium flex items-center gap-1">
                    <i className="ri-time-line"></i> {formatTimeAgo(notification.createdAt)}
                </p>
              </div>
              {!notification.isRead && (
                 <div className="flex-shrink-0 w-2.5 h-2.5 bg-primary rounded-full mt-1.5" title="Unread"></div>
              )}
            </button>
          ))
        ) : (
          <div className="text-center p-12 text-gray-500 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <i className="ri-notification-off-line text-4xl"></i>
            </div>
            <p className="font-bold text-gray-700">No Notifications</p>
            <p className="text-xs text-gray-400 mt-1">We'll alert you here when tasks are assigned to you.</p>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t text-center flex-shrink-0 bg-gray-50/50">
        <button 
            onClick={handleViewAll}
            className="text-xs font-bold text-gray-500 hover:text-primary transition-colors uppercase tracking-widest"
        >
            View All Tasks
        </button>
      </div>
      <style>{`
        .thin-scrollbar::-webkit-scrollbar { width: 4px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default NotificationPanel;
