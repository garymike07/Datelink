import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trash2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { MessageListSkeleton } from "@/components/ui/skeletons/MessageListSkeleton";
import { NoMessagesEmptyState } from "@/components/empty-states/NoMessagesEmptyState";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StatusList } from "@/components/messages/StatusList";
import { TrialBanner } from "@/components/premium/TrialBanner";

const Messages = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?._id;
    const [searchTerm, setSearchTerm] = useState("");

    const conversations = useQuery(api.messages.getConversations, userId ? { userId } : "skip");
    const deleteChat = useMutation(api.messages.deleteChat);

    if (!conversations) {
        return (
            <div className="max-w-3xl mx-auto h-full px-4 pt-6">
                <TrialBanner />
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600 mb-2">
                        Messages
                    </h1>
                    <p className="text-sm text-muted-foreground">Connecting hearts...</p>
                </div>
                <MessageListSkeleton />
            </div>
        );
    }

    const filteredConversations = conversations.filter((c: any) => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="max-w-3xl mx-auto h-full px-2 sm:px-3 md:px-4 pt-3 sm:pt-4 md:pt-6 pb-20 sm:pb-24">
            <div className="glass-panel rounded-3xl p-4 sm:p-5 md:p-6 shadow-glass-sm">
            <div className="mb-4 sm:mb-6 md:mb-8 space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-extrabold text-gradient-love mb-2 sm:mb-3 animate-shimmer bg-[length:200%_100%]" style={{
                            backgroundImage: 'linear-gradient(90deg, hsl(356, 85%, 55%) 0%, hsl(345, 80%, 45%) 25%, hsl(356, 85%, 55%) 50%, hsl(345, 80%, 45%) 75%, hsl(356, 85%, 55%) 100%)'
                        }}>
                            Messages
                        </h1>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse-soft"></div>
                            <p className="text-muted-foreground font-semibold text-xs sm:text-sm md:text-base">
                                {conversations.length} {conversations.length === 1 ? "connection" : "connections"} made
                            </p>
                        </div>
                    </div>
                </div>

                {conversations.length > 0 && (
                    <div className="relative">
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search conversations..." 
                            className="pl-9 sm:pl-12 pr-3 sm:pr-4 h-10 sm:h-11 md:h-12 glass-card border-primary/20 focus:border-primary focus:shadow-glow transition-all rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium placeholder:text-muted-foreground/60"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Status Section */}
            <StatusList />

            {conversations.length === 0 ? (
                <NoMessagesEmptyState />
            ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No conversations found matching "{searchTerm}"</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-2 sm:space-y-3"
                >
                    <AnimatePresence>
                        {filteredConversations.map((conversation: any) => (
                            <motion.div 
                                key={conversation.matchId} 
                                variants={item}
                                layout
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <Card
                                    className="cursor-pointer border border-white/40 bg-white/60 dark:bg-black/30 backdrop-blur-xl shadow-soft hover:shadow-glow hover:bg-white/75 dark:hover:bg-white/5 transition-all duration-300 group rounded-2xl overflow-hidden"
                                    onClick={() => navigate(`/chat/${conversation.matchId}`)}
                                >
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4">
                                            {/* Profile Photo */}
                                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full p-[2px] bg-gradient-to-br from-primary via-rose-400 to-amber-400 group-hover:scale-105 transition-transform duration-300 shadow-md">
                                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-black relative bg-white">
                                                    {conversation.primaryPhoto ? (
                                                        <img
                                                            src={conversation.primaryPhoto}
                                                            alt={conversation.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                                                            <Heart className="w-5 h-5 text-primary/30" />
                                                        </div>
                                                    )}
                                                </div>
                                                {conversation.unreadCount > 0 && (
                                                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-10 animate-pulse"></span>
                                                )}
                                            </div>

                                            {/* Conversation Info */}
                                            <div className="flex-1 min-w-0 py-0.5 sm:py-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-heading font-bold truncate text-sm sm:text-base group-hover:text-primary transition-colors">
                                                        {conversation.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                        {(conversation.lastMessage?.createdAt || conversation.matchedAt) && (
                                                            <span className="text-xs font-medium text-muted-foreground/70 bg-secondary/20 px-2 py-0.5 rounded-full">
                                                                {formatDistanceToNow(conversation.lastMessage?.createdAt || conversation.matchedAt, { addSuffix: true })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <p className={`text-xs truncate flex-1 ${conversation.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                                        {conversation.lastMessage?.body ? (
                                                            conversation.lastMessage.body
                                                        ) : (
                                                            <span className="italic text-primary/70 flex items-center gap-1">
                                                                <MessageCircle className="w-3 h-3" /> Start the conversation...
                                                            </span>
                                                        )}
                                                    </p>

                                                    <div className="flex items-center gap-3">
                                                        {conversation.unreadCount > 0 && (
                                                            <div className="bg-gradient-to-br from-primary via-rose-500 to-pink-500 text-white rounded-full px-2.5 py-1 min-w-[24px] h-6 flex items-center justify-center text-xs font-extrabold shadow-glow animate-pulse-soft border border-white/20">
                                                                {conversation.unreadCount}
                                                            </div>
                                                        )}
                                                        
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (!userId) return;
                                                                if (!confirm("Are you sure you want to delete this conversation? This cannot be undone.")) return;
                                                                await deleteChat({ matchId: conversation.matchId as any, userId });
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
            </div>
        </div>
    );
};

export default Messages;

