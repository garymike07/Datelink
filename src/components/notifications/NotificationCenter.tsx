import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Notification icons by type
const NOTIFICATION_ICONS: Record<string, string> = {
  match: "💘",
  message: "💬",
  like: "💖",
  super_like_received: "⭐",
  profile_created: "✅",
  login_success: "✅",
  payment_success: "💳",
  payment_failed: "⚠️",
  subscription_active: "🌟",
  call_incoming: "📞",
  call_missed: "📵",
  call_ended: "✓",
  profile_viewed: "👁️",
  verification_complete: "✓",
  badge_unlock: "🏆",
  quest_complete: "🎯",
  boost_active: "🚀",
};

// Priority badge colors
const PRIORITY_COLORS: Record<string, string> = {
  critical: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

export default function NotificationCenter({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [playSound, setPlaySound] = useState(true);

  const notificationsArgs = useMemo(() => {
    const args: any = {
      userId: userId as any,
      limit: 100,
    };
    if (selectedCategory !== "all") args.category = selectedCategory;
    return args;
  }, [userId, selectedCategory]);

  // Fetch unread counts by category
  const unreadCounts = useQuery(api.notifications.getUnreadCountByCategory, { 
    userId: userId as any 
  });
  
  // Fetch notifications with real-time updates
  const notifications = useQuery(api.notifications.getNotifications, notificationsArgs);

  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const markRead = useMutation(api.notifications.markNotificationRead);
  const markClicked = useMutation(api.notifications.markNotificationClicked);

  const unreadCount = unreadCounts?.total ?? 0;
  const isLoading = notifications === undefined || unreadCounts === undefined;
  const items = useMemo(() => notifications ?? [], [notifications]);

  // Play sound on new notification
  useEffect(() => {
    if (playSound && notifications && notifications.length > 0) {
      const latestNotif = notifications[0];
      const isNew = latestNotif && !latestNotif.isRead && 
                    (Date.now() - latestNotif.createdAt) < 5000; // Within last 5 seconds
      
      if (isNew && latestNotif.priority === "critical") {
        playNotificationSound();
      }
    }
  }, [notifications, playSound]);

  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore errors if sound can't play
    });
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark as read and clicked
      await markRead({ 
        notificationId: notification._id, 
        userId: userId as any 
      });
      
      await markClicked({ 
        notificationId: notification._id, 
        userId: userId as any 
      });

      // Navigate if there's a link
      if (notification.link) {
        navigate(notification.link);
      }
      
      setOpen(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
      // Show error to user
      console.warn("Failed to mark notification as read. Notification:", notification._id);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="relative" 
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-5 text-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead({ userId: userId as any })}
              disabled={unreadCount === 0}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <div className="px-2 pt-2 border-b">
            <TabsList className="w-full grid grid-cols-5 h-8">
              <TabsTrigger value="all" className="text-xs">
                All
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="social" className="text-xs">
                Social
                {(unreadCounts?.social ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {unreadCounts?.social}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="call" className="text-xs">
                Calls
                {(unreadCounts?.call ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {unreadCounts?.call}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payment" className="text-xs">
                Payments
                {(unreadCounts?.payment ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {unreadCounts?.payment}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs">
                System
                {(unreadCounts?.system ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {unreadCounts?.system}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Notification List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 px-4 text-center">
                <p className="text-sm text-muted-foreground">Loading notifications…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div className="py-2">
                {items.map((notification: any) => (
                  <div
                    key={notification._id}
                    className={`
                      px-4 py-3 cursor-pointer transition-colors hover:bg-accent
                      ${!notification.isRead ? "bg-primary/5" : ""}
                      border-b last:border-b-0
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon/Avatar */}
                      <div className="flex-shrink-0">
                        {notification.imageUrl ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notification.imageUrl} alt="" />
                            <AvatarFallback>
                              {NOTIFICATION_ICONS[notification.type] || "📬"}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                            {NOTIFICATION_ICONS[notification.type] || "📬"}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="inline-block w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground leading-snug mb-2">
                          {notification.body}
                          {notification.aggregatedCount > 1 && (
                            <span className="ml-1 font-medium">
                              (+{notification.aggregatedCount - 1} more)
                            </span>
                          )}
                        </p>

                        {/* Action Buttons */}
                        {notification.actionButtons && notification.actionButtons.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {notification.actionButtons.map((btn: any, idx: number) => (
                              <Button
                                key={idx}
                                type="button"
                                size="sm"
                                variant={idx === 0 ? "default" : "outline"}
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (btn.link) navigate(btn.link);
                                }}
                              >
                                {btn.label}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground">
                            {typeof notification.createdAt === "number"
                              ? formatDistanceToNow(notification.createdAt, { addSuffix: true })
                              : ""}
                          </span>
                          {notification.priority && notification.priority !== "medium" && (
                            <Badge 
                              variant={PRIORITY_COLORS[notification.priority] as any} 
                              className="h-4 px-1 text-[9px]"
                            >
                              {notification.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => {
                navigate("/notifications");
                setOpen(false);
              }}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
