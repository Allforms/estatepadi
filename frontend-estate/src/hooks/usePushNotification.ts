// src/hooks/usePushNotifications.ts
// Fixed version for Vite PWA
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      // Wait for service worker to be ready (Vite PWA handles registration)
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription.toJSON() as PushSubscription);
        setIsSubscribed(true);
      }
    } catch (err) {
      //console.error('Error checking subscription:', err);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Wait for service worker to be ready (Vite PWA registers it automatically)
      //console.log('Waiting for service worker...');
      const registration = await navigator.serviceWorker.ready;
      //console.log('Service worker ready:', registration);

      // Get VAPID public key from backend
      const { data } = await api.get('/api/push/vapid-key/');
      const vapidPublicKey = data.public_key;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found. Please check backend configuration.');
      }

      //console.log('Subscribing to push...');
      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      //console.log('Push subscription successful:', pushSubscription);

      // Send subscription to backend
      await api.post('/api/push/subscribe/', {
        subscription: pushSubscription.toJSON(),
        device_type: 'web'
      });

      setSubscription(pushSubscription.toJSON() as PushSubscription);
      setIsSubscribed(true);
      setIsLoading(false);

      return pushSubscription;
    } catch (err: any) {
      //console.error('Failed to subscribe:', err);
      setError(err.message || 'Failed to subscribe to push notifications');
      setIsLoading(false);
      throw err;
    }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (subscription) {
        const registration = await navigator.serviceWorker.ready;
        const pushSubscription = await registration.pushManager.getSubscription();
        
        if (pushSubscription) {
          await pushSubscription.unsubscribe();
        }

        // Notify backend
        await api.post('/api/push/unsubscribe/', {
          endpoint: subscription.endpoint
        });

        setSubscription(null);
        setIsSubscribed(false);
      }
      setIsLoading(false);
    } catch (err: any) {
      //console.error('Failed to unsubscribe:', err);
      setError(err.message || 'Failed to unsubscribe from push notifications');
      setIsLoading(false);
      throw err;
    }
  }, [subscription]);

  return {
    isSupported,
    isSubscribed,
    subscription,
    isLoading,
    error,
    subscribeToPush,
    unsubscribeFromPush
  };
};