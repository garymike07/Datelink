export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported" as const;
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export function showLocalNotification(args: { title: string; body?: string; icon?: string }) {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;
  return new Notification(args.title, { body: args.body, icon: args.icon });
}
