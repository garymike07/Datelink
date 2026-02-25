import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Bell, Phone, Heart, MessageSquare, CreditCard } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";

const TOAST_ICONS: Record<string, any> = {
  match: Heart,
  message: MessageSquare,
  like: Heart,
  call_incoming: Phone,
  payment_success: CreditCard,
};

export default function NotificationToast({ userId }: { userId: string }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Subscribe to real-time notifications
  const notifications = useQuery(api.notifications.getNotifications, {
    userId: userId as any,
    limit: 1,
    unreadOnly: true,
  });

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    
    const latestNotif = notifications[0];
    const isNew = latestNotif && !latestNotif.isRead && 
                  (Date.now() - latestNotif.createdAt) < 5000;
    
    if (isNew && ["critical", "high"].includes(latestNotif.priority)) {
      const Icon = TOAST_ICONS[latestNotif.type] || Bell;
      
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span>{latestNotif.title}</span>
          </div>
        ),
        description: latestNotif.body,
        action: latestNotif.link ? (
          <ToastAction altText="View notification" onClick={() => navigate(latestNotif.link)}>
            View
          </ToastAction>
        ) : undefined,
        duration: latestNotif.priority === "critical" ? 10000 : 5000,
      });
    }
  }, [notifications, toast, navigate]);

  return null;
}
