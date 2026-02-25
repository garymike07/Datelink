import { useLocation } from "react-router-dom";
import { Home, Heart, MessageCircle, User, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { path: "/discover", icon: Home, label: "Discover", color: "text-blue-500", activeColor: "text-blue-600", bgColor: "bg-blue-500/10" },
        { path: "/likes", icon: Sparkles, label: "Likes", color: "text-yellow-500", activeColor: "text-yellow-600", bgColor: "bg-yellow-500/10" },
        { path: "/matches", icon: Heart, label: "Matches", color: "text-rose-500", activeColor: "text-rose-600", bgColor: "bg-rose-500/10" },
        { path: "/messages", icon: MessageCircle, label: "Messages", color: "text-emerald-500", activeColor: "text-emerald-600", bgColor: "bg-emerald-500/10" },
        { path: "/dashboard", icon: User, label: "Profile", color: "text-purple-500", activeColor: "text-purple-600", bgColor: "bg-purple-500/10" },
    ];

    return (
        <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
            <div className="glass-card rounded-2xl shadow-xl shadow-black/10 border-white/20 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                <div className="flex justify-around items-center h-14 px-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-xl transition-all duration-300 w-full active:scale-95",
                                    isActive
                                        ? item.activeColor
                                        : `${item.color} hover:opacity-80`
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className={cn("absolute inset-0 rounded-xl -z-10", item.bgColor)}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <div className="relative">
                                    <Icon className={cn("w-5 h-5 transition-all duration-300", isActive && "fill-current animate-pulse-soft scale-110")} />
                                    {item.label === "Messages" && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-black" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-bold transition-all duration-300", 
                                    isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 hidden"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default BottomNav;
