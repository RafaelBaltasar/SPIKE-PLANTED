import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/axios';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications from localStorage on mount/user change
  useEffect(() => {
    if (!user) return;

    const stored = localStorage.getItem(`notifications_${user.email}`);
    let loadedNotifs = stored ? JSON.parse(stored) : [];

    // If it's a new login and there are no notifications yet, add a Welcome message
    if (loadedNotifs.length === 0) {
      const welcome = {
        id: Date.now(),
        text: `Welcome back, ${user.fullName.split(' ')[0]}!`,
        type: 'info',
        time: new Date().toISOString(),
        read: false
      };
      loadedNotifs = [welcome];
    }

    setNotifications(loadedNotifs);
    updateUnreadCount(loadedNotifs);

    // If student, fetch pending documents to show alerts
    if (user.role === 'student') {
      api.get('/documents/my-documents').then(res => {
        const pendingDocs = res.data.documents.filter(d => d.status === 'Pending');
        if (pendingDocs.length > 0) {
          addNotification(`You have ${pendingDocs.length} document(s) pending admin review.`, 'warning');
        }
      }).catch(console.error);
    }
  }, [user]);

  const updateUnreadCount = (notifs) => {
    setUnreadCount(notifs.filter(n => !n.read).length);
  };

  const saveNotifications = (notifs) => {
    setNotifications(notifs);
    updateUnreadCount(notifs);
    if (user) {
      localStorage.setItem(`notifications_${user.email}`, JSON.stringify(notifs));
    }
  };

  const addNotification = (text, type = 'info') => {
    if (!user) return;
    const newNotif = {
      id: Date.now(),
      text,
      type,
      time: new Date().toISOString(),
      read: false
    };
    
    // Use functional state update to ensure we have the latest list
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      localStorage.setItem(`notifications_${user.email}`, JSON.stringify(updated));
      updateUnreadCount(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearNotifications = () => {
    saveNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      isOpen, 
      setIsOpen, 
      addNotification, 
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);