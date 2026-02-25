import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';

// VAPID public key - In production, this should come from environment variables
// For now, this is a placeholder. You'll need to generate VAPID keys using:
// npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'PLACEHOLDER_VAPID_KEY';

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushNotificationPermission {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const savePushSubscription = useMutation(api.pushNotifications.savePushSubscription);
  const removePushSubscription = useMutation(api.pushNotifications.removePushSubscription);
  const userSubscriptions = useQuery(api.pushNotifications.getUserPushSubscriptions);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setIsSupported(supported);
      
      if (supported && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Check if already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [isSupported, userSubscriptions]);

  /**
   * Register service worker
   */
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration> => {
    try {
      // Check for existing registration first
      const existingRegistration = await navigator.serviceWorker.getRegistration('/');
      
      if (existingRegistration) {
        console.log('Using existing Service Worker registration');
        await navigator.serviceWorker.ready;
        return existingRegistration;
      }

      // Register new service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Don't cache the service worker file
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }, []);

  /**
   * Request notification permission
   * Note: This must be called in response to a user gesture (e.g., button click)
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    // Check if already granted to avoid unnecessary prompts
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }, [isSupported]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in your browser');
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permissionResult = await requestPermission();
      
      if (permissionResult !== 'granted') {
        toast.error('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        if (VAPID_PUBLIC_KEY === 'PLACEHOLDER_VAPID_KEY') {
          console.warn('VAPID key not configured. Push notifications will not work in production.');
          toast.error('Push notifications are not configured');
          setIsLoading(false);
          return false;
        }

        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        } catch (subscribeError: any) {
          console.error('Push subscription error:', subscribeError);
          
          // Handle specific error types
          if (subscribeError.name === 'AbortError') {
            toast.error('Push service temporarily unavailable. Please try again later.');
            console.warn('Push service error - this can happen if the browser push service is down or network is unstable');
          } else if (subscribeError.name === 'NotAllowedError') {
            toast.error('Push notification permission was denied');
          } else if (subscribeError.name === 'NotSupportedError') {
            toast.error('Push notifications are not supported in this browser');
          } else {
            toast.error('Failed to subscribe to push notifications');
          }
          
          setIsLoading(false);
          return false;
        }
      }

      // Save subscription to backend
      const subscriptionJSON = subscription.toJSON();
      
      await savePushSubscription({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys?.p256dh || '',
          auth: subscriptionJSON.keys?.auth || '',
        },
        platform: 'web',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                 navigator.userAgent.includes('Firefox') ? 'Firefox' :
                 navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
      });

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      
      // More specific error message
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to enable push notifications: ${errorMessage}`);
      
      setIsLoading(false);
      return false;
    }
  }, [isSupported, requestPermission, registerServiceWorker, savePushSubscription]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from backend
        await removePushSubscription({
          endpoint: subscription.endpoint,
        });

        setIsSubscribed(false);
        toast.success('Push notifications disabled');
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to disable push notifications');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, removePushSubscription]);

  /**
   * Test push notification (shows a local notification)
   */
  const testNotification = useCallback(async () => {
    if (!isSupported) {
      toast.error('Notifications are not supported');
      return;
    }

    if (permission !== 'granted') {
      toast.error('Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('Test Notification', {
        body: 'This is a test notification from DateLink',
        icon: '/logo.svg',
        badge: '/favicon.svg',
        tag: 'test-notification',
        vibrate: [200, 100, 200],
        data: {
          url: '/',
        },
      });

      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error showing test notification:', error);
      toast.error('Failed to show test notification');
    }
  }, [isSupported, permission]);

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    testNotification,
  };
}
