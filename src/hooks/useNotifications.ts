import { useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { showBrowserNotification } from "@/lib/pushNotifications";
import { useToast } from "./use-toast";

export function useNotifications(userId: string | null) {
  const { toast } = useToast();
  const lastNotificationId = useRef<string | null>(null);
  
  // Subscribe to notifications
  const notifications = useQuery(
    api.notifications.getNotifications,
    userId ? { userId: userId as any, limit: 1, unreadOnly: true } : "skip"
  );
  
  const unreadCounts = useQuery(
    api.notifications.getUnreadCountByCategory,
    userId ? { userId: userId as any } : "skip"
  );

  // Handle new notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    
    const latestNotif = notifications[0];
    
    // Check if this is a new notification
    if (lastNotificationId.current === latestNotif._id) return;
    
    const isNew = (Date.now() - latestNotif.createdAt) < 10000; // Last 10 seconds
    
    if (isNew && !latestNotif.isRead) {
      lastNotificationId.current = latestNotif._id;
      
      // Show browser notification if page is not focused
      if (document.hidden && Notification.permission === "granted") {
        showBrowserNotification(latestNotif.title, {
          body: latestNotif.body,
          icon: latestNotif.imageUrl,
          tag: latestNotif.type,
          data: { link: latestNotif.link },
          requireInteraction: latestNotif.priority === "critical",
        });
      }
      
      // Play sound for critical notifications
      if (latestNotif.priority === "critical") {
        playNotificationSound();
      }
    }
  }, [notifications, toast]);

  const playNotificationSound = useCallback(() => {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, []);

  return {
    unreadCount: unreadCounts?.total ?? 0,
    unreadCounts: unreadCounts ?? { total: 0, social: 0, call: 0, payment: 0, engagement: 0, system: 0 },
    latestNotification: notifications?.[0] ?? null,
  };
}
