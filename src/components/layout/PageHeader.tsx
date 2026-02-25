import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import { PlanBadge } from "@/components/premium/PlanBadge";

function titleFromPathname(pathname: string) {
  const cleaned = pathname.replace(/^\//, "");
  if (!cleaned) return "Home";

  const segment = cleaned.split("/")[0];
  return segment
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function PageHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const updateLastSeen = useMutation(api.auth.updateLastSeen);
  const updatePresence = useMutation(api.presence.updatePresence);

  const { user } = useAuth();
  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;

    updateLastSeen({ userId });
    updatePresence({ userId, status: "online" } as any);
    const id = window.setInterval(() => {
      updateLastSeen({ userId });
      updatePresence({ userId, status: "online" } as any);
    }, 30000);

    return () => window.clearInterval(id);
  }, [userId, updateLastSeen, updatePresence]);

  const title = useMemo(() => titleFromPathname(location.pathname), [location.pathname]);

  return (
    <header className="flex h-12 md:h-14 shrink-0 items-center gap-2 border-b border-white/40 dark:border-white/10 bg-white/80 dark:bg-black/45 backdrop-blur-2xl px-2.5 md:px-4 sticky top-0 z-10 shadow-glass-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/dashboard");
          }
        }}
        className="h-8 w-8"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <SidebarTrigger className="-ml-1" />

      <div className="h-3 w-px bg-border mx-1.5" />

      <h1 className="text-sm md:text-base font-heading font-semibold text-foreground/90 tracking-tight truncate">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-1.5">
        {userId ? <PlanBadge userId={String(userId)} /> : null}
        {userId ? <NotificationCenter userId={userId} /> : null}
      </div>
    </header>
  );
}
