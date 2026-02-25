import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

/**
 * PushNotificationManager
 * 
 * Manages push notifications for the app:
 * - Automatically prompts user for permission on first login
 * - Registers service worker
 * - Listens for service worker messages (for call actions, ringtones, etc.)
 * - Handles notification clicks
 */
export function PushNotificationManager() {
  const { user } = useAuth();
  const { subscribe, isSupported, isSubscribed, permission } = usePushNotifications();
  const [hasPromptedThisSession, setHasPromptedThisSession] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-prompt for push notifications on first authenticated session
  useEffect(() => {
    if (!user || !isSupported || hasPromptedThisSession) return;
    
    // Check if user has already been prompted before
    const hasBeenPrompted = localStorage.getItem('push_notification_prompted');
    
    if (!hasBeenPrompted && permission === 'default') {
      // Wait a bit before prompting (don't be too aggressive)
      const timer = setTimeout(() => {
        setHasPromptedThisSession(true);
        localStorage.setItem('push_notification_prompted', 'true');
        
        // Show a friendly toast asking for permission
        toast.info("Enable notifications to get instant updates on messages and calls", {
          duration: 8000,
          action: {
            label: "Enable",
            onClick: async () => {
              const success = await subscribe();
              if (success) {
                toast.success("Push notifications enabled! 🔔");
              } else {
                // Even if push subscription fails, we can still use browser notifications
                toast.info("Browser notifications are still available for this session", {
                  duration: 5000,
                });
              }
            },
          },
          cancel: {
            label: "Not now",
            onClick: () => {
              // User declined, don't ask again this session
            }
          }
        });
      }, 3000); // Wait 3 seconds after login

      return () => clearTimeout(timer);
    }
    
    // Don't auto-subscribe even if permission is granted
    // The user should explicitly click "Enable" to subscribe
    // This prevents the "Only request notification permission in response to a user gesture" warning
  }, [user, isSupported, permission, isSubscribed, hasPromptedThisSession, subscribe]);

  // Listen for service worker messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, callId } = event.data;

      switch (type) {
        case 'PLAY_RINGTONE':
          // Play ringtone for incoming call
          playRingtone();
          break;

        case 'ANSWER_CALL':
          // Stop ringtone when call is answered
          stopRingtone();
          // The navigation is handled by the service worker
          break;

        case 'DECLINE_CALL':
          // Stop ringtone when call is declined
          stopRingtone();
          // Optionally, call a mutation to decline the call
          console.log('Call declined from notification:', callId);
          break;

        case 'CALL_NOTIFICATION_DISMISSED':
          // Stop ringtone if notification is dismissed
          stopRingtone();
          break;

        default:
          console.log('Unknown service worker message:', event.data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Play ringtone
  const playRingtone = () => {
    if (!audioRef.current) {
      // Create audio element for ringtone
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.loop = true;
    }

    audioRef.current.play().catch(err => {
      console.error('Failed to play ringtone:', err);
      // Fallback: use system notification sound (already played by browser)
    });
  };

  // Stop ringtone
  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}
