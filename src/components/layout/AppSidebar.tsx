import { Home, Heart, MessageCircle, User, Shield, Settings, LogOut, Sparkles, CreditCard, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItems = [
    { title: "Discover", url: "/discover", icon: Home, color: "text-blue-500", hoverColor: "hover:text-blue-600", bgColor: "bg-blue-500/10" },
    { title: "Matches", url: "/matches", icon: Heart, color: "text-rose-500", hoverColor: "hover:text-rose-600", bgColor: "bg-rose-500/10" },
    { title: "Messages", url: "/messages", icon: MessageCircle, color: "text-emerald-500", hoverColor: "hover:text-emerald-600", bgColor: "bg-emerald-500/10" },
    { title: "Profile", url: "/dashboard", icon: User, color: "text-purple-500", hoverColor: "hover:text-purple-600", bgColor: "bg-purple-500/10" },
    { title: "Safety", url: "/safety", icon: Shield, color: "text-amber-500", hoverColor: "hover:text-amber-600", bgColor: "bg-amber-500/10" },
];

const secondaryItems = [
    { title: "Subscription", url: "/subscription", icon: CreditCard, color: "text-indigo-500", hoverColor: "hover:text-indigo-600", bgColor: "bg-indigo-500/10" },
    { title: "Settings", url: "/settings", icon: Settings, color: "text-slate-500", hoverColor: "hover:text-slate-600", bgColor: "bg-slate-500/10" },
];

export function AppSidebar() {
    const location = useLocation();
    const { user } = useAuth();
    const userId = user?._id;
    const profile = useQuery(api.profiles.getMyProfile, userId ? { userId } : "skip");

    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = "/";
    };

    return (
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-white/40 dark:border-white/5 bg-white/80 dark:bg-black/40 backdrop-blur-2xl shadow-glass-sm">
            <SidebarHeader className="h-20 flex items-center justify-between px-4">
                <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                    <div className="relative group">
                        <div className="bg-gradient-kenya p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                            <img src="/logo.png" alt="DateLink" className="w-6 h-6 object-contain" />
                        </div>
                        <div className="absolute inset-0 bg-white/20 blur-md rounded-xl -z-10" />
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden transition-all duration-300">
                        <span className="font-heading font-extrabold text-lg text-foreground tracking-tight whitespace-nowrap">
                            DateLink
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                            Connect. Love. Unite.
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-2 mb-2 group-data-[collapsible=icon]:hidden">
                        Main Menu
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-2">
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            isActive={isActive}
                                            className={`h-11 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                                                isActive 
                                                    ? `${item.bgColor} ${item.color}` 
                                                    : `hover:bg-white/50 dark:hover:bg-white/10 ${item.color} ${item.hoverColor}`
                                            }`}
                                        >
                                            <Link to={item.url} className="flex items-center gap-3 w-full">
                                                {isActive && (
                                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 ${item.color.replace('text-', 'bg-')} rounded-r-full`} />
                                                )}
                                                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "fill-current" : ""}`} />
                                                <span className="font-medium">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-4 mx-2 bg-border/40" />

                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-2 mb-2 group-data-[collapsible=icon]:hidden">
                        Account
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {secondaryItems.map((item) => {
                                const isActive = location.pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            className={`h-10 rounded-xl transition-all duration-300 ${
                                                isActive
                                                    ? `${item.bgColor} ${item.color}`
                                                    : `hover:bg-white/50 dark:hover:bg-white/10 ${item.color} ${item.hoverColor}`
                                            }`}
                                        >
                                            <Link to={item.url}>
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={handleLogout}
                                    className="h-10 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all duration-300"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Premium Promo - Collapsed Logic Handled via CSS usually, or just hide in code */}
                {!profile?.isPremium && (
                    <div className="mt-auto p-4 mx-1 rounded-2xl gradient-gold shadow-lg relative overflow-hidden group group-data-[collapsible=icon]:hidden transition-all duration-500">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-30 transition-opacity">
                            <Sparkles className="w-16 h-16 animate-pulse-soft" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-white text-lg leading-tight mb-1">Go Premium</h3>
                            <p className="text-xs text-white/90 mb-3 font-medium">Get unlimited likes & see who likes you!</p>
                            <Button
                                size="sm"
                                className="w-full bg-white text-accent hover:bg-white/90 border-0 font-bold shadow-sm"
                                asChild
                            >
                                <Link to="/upgrade">Upgrade Now</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter className="p-4 bg-white/5 dark:bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group group-data-[collapsible=icon]:justify-center">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white/20 shadow-sm transition-transform group-hover:scale-105">
                            <AvatarImage src={profile?.images?.[0] || user?.image} className="object-cover" />
                            <AvatarFallback className="bg-gradient-love text-white font-bold">
                                {user?.name?.[0] || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    </div>
                    <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-bold truncate text-foreground">{user?.name || "Guest"}</span>
                        <span className="text-xs text-muted-foreground truncate opacity-80">{user?.email || "Sign in"}</span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
