// src/hooks/usePushNotifications.ts
// Fixed version for Vite PWA with WebView detection
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

/**
 * Detects if the app is running in a WebView/mobile app environment
 * WebViews typically don't support Web Push API
 */
const detectWebView = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Check for common WebView indicators
  const isWebView =
    // Android WebView
    /wv|WebView/.test(userAgent) ||
    // iOS WebView (Safari not in user agent)
    /(iPhone|iPod|iPad)(?!.*Safari\/)/i.test(userAgent) ||
    // Appilix or other converters
    /Appilix|WebViewApp|ConverterApp/.test(userAgent) ||
    // Facebook/Instagram in-app browser
    /FBAN|FBAV|Instagram/.test(userAgent);

  return isWebView;
};

/**
 * Get detailed platform information for debugging
 */
const getPlatformInfo = (): string => {
  const isWebView = detectWebView();
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  const hasNotification = 'Notification' in window;

  return `WebView: ${isWebView}, ServiceWorker: ${hasServiceWorker}, PushManager: ${hasPushManager}, Notification: ${hasNotification}`;
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebView, setIsWebView] = useState(false);
  const [platformInfo, setPlatformInfo] = useState('');

  useEffect(() => {
    const webViewDetected = detectWebView();
    setIsWebView(webViewDetected);
    setPlatformInfo(getPlatformInfo());

    // Check if push notifications are supported
    // Web Push API is NOT supported in WebView environments
    if ('serviceWorker' in navigator && 'PushManager' in window && !webViewDetected) {
      setIsSupported(true);
      checkSubscription();
    } else {
      if (webViewDetected) {
        setError('Push notifications are not supported in mobile app containers. Please use the web version at estatepadi.com in your browser for push notification features.');
      } else if (!('PushManager' in window)) {
        setError('Push notifications are not supported in this browser.');
      }
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
    isWebView,
    platformInfo,
    subscribeToPush,
    unsubscribeFromPush
  };
};