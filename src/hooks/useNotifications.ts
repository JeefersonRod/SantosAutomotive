import { useState, useEffect } from 'react';
import { getToken, onMessage, isSupported, getMessaging, Messaging } from 'firebase/messaging';
import { app } from '../lib/firebase';

export const useNotifications = (userId: string | undefined) => {
  const [messaging, setMessaging] = useState<Messaging | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(
    (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'default'
  );

  useEffect(() => {
    const initMessaging = async () => {
      if (!app || typeof window === 'undefined') return;
      
      try {
        const supported = await isSupported();
        if (supported) {
          const m = getMessaging(app);
          setMessaging(m);
        }
      } catch (err) {
        console.warn('Firebase Messaging not supported:', err);
      }
    };

    initMessaging();
  }, []);

  const requestPermission = async () => {
    if (!messaging || !('Notification' in window)) return;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      
      if (status === 'granted') {
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        
        if (currentToken) {
          setToken(currentToken);
          if (userId) {
            await saveTokenToServer(userId, currentToken);
          }
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
    }
  };

  const saveTokenToServer = async (uid: string, fcmToken: string) => {
    try {
      await fetch('/api/notifications/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: uid, token: fcmToken }),
      });
    } catch (err) {
      console.error('Error saving token to server:', err);
    }
  };

  useEffect(() => {
    if (userId && permission === 'granted' && messaging) {
      requestPermission();
    }
  }, [userId, permission, messaging]);

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // You can customize how to show the notification when the app is in foreground
      if (payload.notification && 'Notification' in window) {
        new Notification(payload.notification.title || 'Nova Notificação', {
          body: payload.notification.body,
          icon: '/logo.jpg'
        });
      }
    });

    return () => unsubscribe();
  }, [messaging]);

  return { token, permission, requestPermission };
};
