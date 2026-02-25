import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format } from "date-fns";

export default function OnlineStatus({
  targetUserId,
  viewerUserId,
  showExactTime = false,
}: {
  targetUserId: string;
  viewerUserId?: string;
  showExactTime?: boolean;
}) {
  const presence = useQuery(api.presence.getPresenceStatus, {
    targetUserId: targetUserId as any,
    viewerUserId: viewerUserId as any,
  });

  if (!presence || presence.status === "hidden") return null;

  const color =
    presence.status === "online"
      ? "bg-emerald-500"
      : presence.status === "away"
        ? "bg-amber-400"
        : "bg-muted-foreground/40";

  let label = presence.status === "online" ? "Online" : presence.status === "away" ? "Active" : "Offline";
  
  // Show exact time for offline users when requested
  if (showExactTime && presence.status === "offline" && presence.lastActiveAt) {
    const lastSeenDate = new Date(presence.lastActiveAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastSeenDate >= today) {
      // Today: show "Last seen at HH:MM AM/PM"
      label = `Last seen at ${format(lastSeenDate, "h:mm a")}`;
    } else if (lastSeenDate >= yesterday) {
      // Yesterday: show "Last seen yesterday at HH:MM AM/PM"
      label = `Last seen yesterday at ${format(lastSeenDate, "h:mm a")}`;
    } else {
      // Older: show "Last seen on MMM DD at HH:MM AM/PM"
      label = `Last seen on ${format(lastSeenDate, "MMM dd")} at ${format(lastSeenDate, "h:mm a")}`;
    }
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
