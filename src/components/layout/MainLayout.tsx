import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PageHeader from "./PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

const PushNotificationManager = lazy(async () => {
    const mod = await import("@/components/notifications/PushNotificationManager");
    return { default: mod.PushNotificationManager };
});
const NotificationToast = lazy(() => import("@/components/notifications/NotificationToast"));
const PushPermissionPrompt = lazy(async () => {
    const mod = await import("@/components/notifications/PushPermissionPrompt");
    return { default: mod.PushPermissionPrompt };
});

export default function MainLayout() {
    const location = useLocation();
    const hideHeader = location.pathname.startsWith("/chat/");
    const { user } = useAuth();
    const userId = user?._id ?? null;
    const [enableRealtimeUI, setEnableRealtimeUI] = useState(false);

    useEffect(() => {
        if (!userId) {
            setEnableRealtimeUI(false);
            return;
        }

        const handleInteraction = () => {
            setEnableRealtimeUI(true);
            window.removeEventListener("pointerdown", handleInteraction);
            window.removeEventListener("keydown", handleInteraction);
            window.removeEventListener("touchstart", handleInteraction);
            window.removeEventListener("visibilitychange", handleInteraction);
        };

        window.addEventListener("pointerdown", handleInteraction, { once: true });
        window.addEventListener("keydown", handleInteraction, { once: true });
        window.addEventListener("touchstart", handleInteraction, { once: true });
        window.addEventListener("visibilitychange", handleInteraction, { once: true });

        return () => {
            window.removeEventListener("pointerdown", handleInteraction);
            window.removeEventListener("keydown", handleInteraction);
            window.removeEventListener("touchstart", handleInteraction);
            window.removeEventListener("visibilitychange", handleInteraction);
        };
    }, [userId]);

    const realtimeFallback = useMemo(() => null, []);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background overflow-hidden flex flex-col">
                {!hideHeader && <PageHeader />}

                <div className="flex-1 overflow-y-auto overflow-x-hidden relative w-full h-full">
                    {/* Background Gradient */}
                    {/* Background Gradient - Premium Subtle Glow */}
                    <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
                    <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-love-mist/30 to-transparent pointer-events-none -z-10 opacity-60" />

                    <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 pb-20 md:pb-6 animate-fade-in">
                        <div className="glass-surface rounded-3xl p-3 sm:p-4 md:p-6 shadow-glass-sm">
                            <Outlet />
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <div className="md:hidden">
                    <BottomNav />
                </div>

                {userId && enableRealtimeUI && (
                    <Suspense fallback={realtimeFallback}>
                        <PushNotificationManager />
                        {/* Real-time Toast Notifications */}
                        <NotificationToast userId={userId} />
                        {/* Phase 3: Push Notification Permission Prompt */}
                        <PushPermissionPrompt autoShow={true} showOnlyIfNotGranted={true} />
                    </Suspense>
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
