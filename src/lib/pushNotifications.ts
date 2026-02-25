import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";

// Request push notification permission
export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Show browser notification
export function showBrowserNotification(
  title: string,
  options: {
    body?: string;
    icon?: string;
    image?: string;
    badge?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
  } = {}
) {
  if (!("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;

  const notification = new Notification(title, {
    ...options,
    badge: options.badge || "/logo.svg",
    icon: options.icon || "/logo.svg",
  });

  // Handle notification click
  notification.onclick = (event) => {
    event.preventDefault();
    window.focus();
    
    if (options.data?.link) {
      window.location.href = options.data.link;
    }
    
    notification.close();
  };

  return notification;
}

// Service worker registration for push (optional PWA feature)
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered:", registration);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}
