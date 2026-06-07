import { useEffect, useState } from 'react';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export const useNotifications = (userId: string | number | undefined) => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return;
    }

    const status = await Notification.requestPermission();
    setPermission(status);
    if (status !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const keyResponse = await fetch('/api/notifications/public-key', {
        credentials: 'include'
      });

      if (!keyResponse.ok) {
        console.warn('Web Push public key is not configured.');
        return;
      }

      const { publicKey } = await keyResponse.json();
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      setToken(subscription.endpoint);

      await fetch('/api/notifications/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscription: subscription.toJSON() })
      });
    } catch (err) {
      console.error('Error registering push subscription:', err);
    }
  };

  useEffect(() => {
    if (userId && permission === 'granted') {
      requestPermission();
    }
  }, [userId, permission]);

  return { token, permission, requestPermission };
};
