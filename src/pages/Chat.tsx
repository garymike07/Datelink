import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, CheckCheck, Clock, Heart, Image as ImageIcon, MoreVertical, Send, Trash2, Smile, Paperclip, Download } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TypingIndicator from "@/components/messages/TypingIndicator";
import MessageReactions from "@/components/messages/MessageReactions";
import IcebreakerSuggestions from "@/components/messages/IcebreakerSuggestions";
import { GifPicker } from "@/components/messages/GifPicker";
import { VoiceMessage } from "@/components/messages/VoiceMessage";
import { ScheduleMessage } from "@/components/messages/ScheduleMessage";
import { SafetyBanner } from "@/components/messages/SafetyBanner";
import { ReportModal } from "@/components/safety/ReportModal";
import { ChatSkeleton } from "@/components/ui/skeletons/ChatSkeleton";

const Chat = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [gifOpen, setGifOpen] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [safetyDismissed, setSafetyDismissed] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<Array<{
        id: string;
        name: string;
        type: string;
        size: number;
        previewUrl?: string;
    }>>([]);
    const [isDragging, setIsDragging] = useState(false);

    const { user, isLoading: authLoading } = useAuth();
    
    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    const userId = user?._id;

    const match = useQuery(api.matching.getMatchById, matchId && userId ? { matchId: matchId as any, userId } : "skip");
    const messages = useQuery(api.messages.getConversation, matchId && userId ? { matchId: matchId as any, userId } : "skip");
    const sendMessage = useMutation(api.messages.sendMessage);
    const generateUploadUrl = useMutation(api.attachments.generateAttachmentUploadUrl);
    const markAsRead = useMutation(api.messages.markAsRead);
    const setTypingStatus = useMutation(api.messages.setTypingStatus);
    const deleteChat = useMutation(api.messages.deleteChat);
    const deleteMessage = useMutation(api.messages.deleteMessage);    const blockUser = useMutation(api.safety.blockUser);
    const updateLastSeen = useMutation(api.auth.updateLastSeen);
    const sendDueScheduledMessages = useMutation(api.scheduledMessages.sendDueScheduledMessages);
    const reactionsByMessage = useQuery(api.messages.getMessageReactions, matchId ? { matchId: matchId as any } : "skip");

    // Get receiver's presence status for tick logic
    const receiverPresence = useQuery(api.presence.getPresenceStatus, 
        match?.userId && userId ? { targetUserId: match.userId, viewerUserId: userId } : "skip"
    );

    const uniqueMessages = useMemo(() => {
        if (!messages) return [] as any[];
        const seen = new Set<string>();
        const ordered: any[] = [];
        for (const msg of messages as any[]) {
            if (seen.has(msg._id)) continue;
            seen.add(msg._id);
            ordered.push(msg);
        }
        return ordered;
    }, [messages]);
    const entitlements = useQuery(api.subscriptions.getMyEntitlements, userId ? { userId } : "skip");
    const readReceipts = useQuery(
        api.messages.getReadReceipts,
        matchId && userId && entitlements?.isPremium ? { matchId: matchId as any, userId } : "skip"
    );

    const smartReplies = useMemo(() => {
        if (!messages || messages.length === 0) return [];
        const last = (messages as any[])[messages.length - 1];
        if (!last || last.senderId === userId) return [];
        const text = typeof last.body === "string" ? last.body.toLowerCase() : "";
        if (text.includes("when") || text.includes("time")) return ["What time works for you?", "I’m free later today", "Tomorrow works for me", "Let’s plan it"]; 
        if (text.includes("where") || text.includes("location")) return ["Where should we meet?", "Any place you prefer?", "I’m open", "Sounds good"]; 
        if (text.includes("haha") || text.includes("lol")) return ["Haha 😂", "You’re funny", "😂", "Tell me more!"]; 
        return ["Sounds great!", "Tell me more!", "What about you?", "😊"]; 
    }, [messages, userId]);

    useEffect(() => {
        if (!matchId) return;
        const key = `safety_banner_dismissed_${matchId}`;
        setSafetyDismissed(localStorage.getItem(key) === "1");
    }, [matchId]);

    const dismissSafety = () => {
        if (!matchId) return;
        const key = `safety_banner_dismissed_${matchId}`;
        localStorage.setItem(key, "1");
        setSafetyDismissed(true);
    };

    useEffect(() => {
        if (messages && messages.length > 0) {
            markAsRead({ matchId: matchId as any, userId });
        }
    }, [messages, markAsRead, matchId, userId]);

    useEffect(() => {
        if (!matchId || !userId) return;
        const t = window.setTimeout(() => {
            setTypingStatus({ matchId: matchId as any, userId, isTyping: message.trim().length > 0 } as any).catch(() => {
                // ignore
            });
        }, 250);
        return () => window.clearTimeout(t);
    }, [message, matchId, userId, setTypingStatus]);

    useEffect(() => {
        if (!userId) return;

        updateLastSeen({ userId });
        const id = window.setInterval(() => {
            updateLastSeen({ userId });
        }, 30000);

        return () => window.clearInterval(id);
    }, [userId, updateLastSeen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!matchId || !userId || !entitlements?.isPremium) return;
        const id = window.setInterval(() => {
            sendDueScheduledMessages({ userId } as any).catch(() => {
                // ignore
            });
        }, 10000);
        return () => window.clearInterval(id);
    }, [matchId, userId, entitlements?.isPremium, sendDueScheduledMessages]);

    const emojiGroups = [
        { label: "Smileys", items: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😍", "😘", "🥰", "😎", "🤩", "😇", "🤗", "😋", "😜"] },
        { label: "Gestures", items: ["👍", "👎", "👏", "🙌", "🤝", "🙏", "👋", "👌", "✌️", "🤞", "🤟", "🤘", "💪", "🫶"] },
        { label: "Hearts", items: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💖", "💗", "💓", "💞", "💕", "💘"] },
        { label: "Faces", items: ["😮", "😲", "😳", "🥺", "😢", "😭", "😡", "🤬", "😴", "😬", "🤔", "🙃", "🤐", "😷"] },
        { label: "Fun", items: ["🎉", "🎊", "✨", "🔥", "💯", "🎈", "🎁", "🍀", "🌟", "💎", "⚡", "🌈"] },
    ];

    const insertEmoji = (emoji: string) => {
        const target = inputRef.current;
        if (!target) {
            setMessage((prev) => prev + emoji);
            return;
        }

        const start = target.selectionStart ?? message.length;
        const end = target.selectionEnd ?? message.length;
        const next = `${message.slice(0, start)}${emoji}${message.slice(end)}`;
        setMessage(next);

        window.requestAnimationFrame(() => {
            target.focus();
            const cursor = start + emoji.length;
            target.setSelectionRange(cursor, cursor);
        });
    };

    const handleEmojiSelect = (emoji: string) => {
        insertEmoji(emoji);
        setEmojiOpen(false);
    };

    const handleSend = async () => {
        if (!message.trim() || !userId || !matchId) return;

        try {
            await sendMessage({
                matchId: matchId as any,
                senderId: userId,
                body: message.trim(),
            });

            setMessage("");
        } catch (error: any) {
            const errMsg: string = error.message || "";
            if (errMsg.startsWith("DAILY_MESSAGE_LIMIT_REACHED")) {
                const parts = errMsg.split(":");
                const limit = parts[2] || "20";
                toast.error(
                    `Daily message limit reached (${limit}/day). Upgrade to Premium or pay KES 10 for 24h unlimited access.`,
                    {
                        duration: 7000,
                        action: { label: "Upgrade Now", onClick: () => navigate("/subscription") },
                    }
                );
            } else {
                toast.error(errMsg || "Failed to send message");
            }
        }
    };

    const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

    const sendPhoto = async (file: File) => {
        if (!userId || !matchId) return;
        
        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(new Error("Failed to read file"));
                reader.onload = () => resolve(String(reader.result || ""));
                reader.readAsDataURL(file);
            });

            await sendMessage({
                matchId: matchId as any,
                senderId: userId,
                body: "[Photo]",
                type: "photo",
                metadata: { photoUrl: dataUrl },
            } as any);
        } catch (error: any) {
            toast.error(error.message || "Failed to send photo");
        }
    };

    const uploadAttachment = async (file: File) => {
        if (!userId || !matchId) return;
        if (file.size > MAX_ATTACHMENT_SIZE) {
            toast.error("File exceeds 50MB limit");
            return;
        }

        const pendingId = crypto.randomUUID();
        const previewUrl = file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : undefined;

        setPendingAttachments((prev) => [
            {
                id: pendingId,
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size,
                previewUrl,
            },
            ...prev,
        ]);

        setUploadingAttachment(true);
        try {
            const uploadUrl = await generateUploadUrl({ userId });
            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    "Content-Type": file.type || "application/octet-stream",
                },
                body: file,
            });

            if (!response.ok) {
                throw new Error("Failed to upload attachment");
            }

            const { storageId } = await response.json();
            if (!storageId) {
                throw new Error("Upload did not return a storage id");
            }

            await sendMessage({
                matchId: matchId as any,
                senderId: userId,
                body: `Sent a file: ${file.name}`,
                type: "attachment",
                metadata: {
                    attachmentId: storageId,
                    attachmentName: file.name,
                    attachmentType: file.type || "application/octet-stream",
                    attachmentSize: file.size,
                },
            } as any);
        } catch (error: any) {
            toast.error(error?.message || "Failed to upload attachment");
        } finally {
            setPendingAttachments((prev) => prev.filter((item) => item.id !== pendingId));
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setUploadingAttachment(false);
        }
    };

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach((file) => uploadAttachment(file));
    };

    const sendGif = async (gifUrl: string) => {
        if (!userId || !matchId) return;
        
        try {
            await sendMessage({
                matchId: matchId as any,
                senderId: userId,
                body: "[GIF]",
                type: "gif",
                metadata: { gifUrl },
            } as any);
        } catch (error: any) {
            toast.error(error.message || "Failed to send GIF");
        }
    };

    const sendVoice = async ({ voiceUrl, duration }: { voiceUrl: string; duration: number }) => {
        if (!userId || !matchId) return;
        
        try {
            await sendMessage({
                matchId: matchId as any,
                senderId: userId,
                body: "[Voice message]",
                type: "voice",
                metadata: { voiceUrl, voiceDuration: duration },
            } as any);
        } catch (error: any) {
            toast.error(error.message || "Failed to send voice message");
        }
    };

    const handleDeleteChat = async () => {
        if (!matchId || !userId) return;

        if (confirm("Are you sure you want to delete this chat?")) {
            try {
                await deleteChat({ matchId: matchId as any, userId });
                toast.success("Chat deleted");
                navigate("/messages");
            } catch (error: any) {
                toast.error(error.message || "Failed to delete chat");
            }
        }
    };

    const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
        if (!userId) return;

        try {
            await deleteMessage({ messageId: messageId as any, userId, deleteForEveryone });
            toast.success(deleteForEveryone ? "Message deleted for everyone" : "Message deleted locally");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete message");
        }
    };

    const handleBlock = async () => {
        if (!match || !userId) return;

        if (confirm(`Are you sure you want to block ${match.profile.name || "this user"}?`)) {
            try {
                await blockUser({
                    blockerId: userId,
                    blockedUserId: match.userId,
                });

                toast.success("User blocked");
                navigate("/messages");
            } catch (error: any) {
                toast.error(error.message || "Failed to block user");
            }
        }
    };

    // Show loading state while authenticating or fetching data
    if (authLoading || !userId) {
        return <ChatSkeleton />;
    }

    if (!match || !messages) {
        return <ChatSkeleton />;
    }

    const otherUserId = match.userId;

    const primaryPhoto = match.profile.photos.find((p: any) => p.isPrimary) || match.profile.photos[0];

    const lastSeenAt = (match as any).lastSeenAt as number | null | undefined;
    const showOnlineStatus = (match as any).showOnlineStatus as boolean | undefined;
    const isOnline = typeof lastSeenAt === "number" ? Date.now() - lastSeenAt < 60000 : false;
    
    // Format exact time for last seen
    const getLastSeenText = () => {
        if (showOnlineStatus === false) return null;
        if (isOnline) return "Online";
        if (typeof lastSeenAt !== "number") return null;
        
        const lastSeenDate = new Date(lastSeenAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastSeenDate >= today) {
            // Today: show "Last seen at HH:MM AM/PM"
            return `Last seen at ${format(lastSeenDate, "h:mm a")}`;
        } else if (lastSeenDate >= yesterday) {
            // Yesterday: show "Last seen yesterday at HH:MM AM/PM"
            return `Last seen yesterday at ${format(lastSeenDate, "h:mm a")}`;
        } else {
            // Older: show "Last seen on MMM DD at HH:MM AM/PM"
            return `Last seen on ${format(lastSeenDate, "MMM dd")} at ${format(lastSeenDate, "h:mm a")}`;
        }
    };
    
    const lastSeenText = getLastSeenText();


    return (
        <div
            className={`min-h-screen bg-background flex flex-col overflow-hidden ${isDragging ? "ring-2 ring-primary/60" : ""}`}
            onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
            }}
            onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleFiles(event.dataTransfer.files);
            }}
        >
            {isDragging && (
                <div className="absolute inset-0 z-20 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Paperclip className="w-10 h-10 text-primary" />
                        <p className="text-lg font-semibold">Drop files to send</p>
                        <p className="text-sm text-muted-foreground">Up to 50MB per file</p>
                    </div>
                </div>
            )}
            {/* Trial Banner */}
            <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-2">
                <TrialBanner />
            </div>
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                    {primaryPhoto ? (
                                        <img
                                            src={primaryPhoto.url}
                                            alt={match.profile.userId}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                            <Heart className="w-5 h-5 text-primary/30" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="font-semibold">
                                        {(match.profile.name || (match as any).name || "Unknown")}, {match.profile.age}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {lastSeenText || match.profile.location}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                                    Report
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/profile/${match.userId}`)}>
                                    View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDeleteChat}>
                                    Delete Chat
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                                    Block User
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>


            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 max-w-2xl space-y-3 sm:space-y-4">
                    {uniqueMessages.length === 0 ? (
                        <div className="text-center py-12">
                            <Heart className="w-16 h-16 mx-auto text-primary mb-4" />
                            <h3 className="text-lg font-semibold mb-2">You matched!</h3>
                            <p className="text-muted-foreground">Send a message to start the conversation</p>

                            {!safetyDismissed && matchId && (
                                <div className="mt-6">
                                    <SafetyBanner
                                        onDismiss={dismissSafety}
                                        onLearnMore={() => navigate("/safety")}
                                        onReport={() => setReportOpen(true)}
                                    />
                                </div>
                            )}

                            {matchId && otherUserId && (
                                <div className="mt-6 text-left">
                                    <IcebreakerSuggestions
                                        matchId={matchId as any}
                                        otherUserId={otherUserId as any}
                                        viewerId={userId}
                                        onSelect={(m) => setMessage(m)}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        messages.map((msg: any) => {
                            const isMine = msg.senderId === userId;
                            const messageReactions = reactionsByMessage?.[msg._id] || [];
                            
                            // WhatsApp-style tick logic
                            let tickStatus = null;
                            if (isMine) {
                                const receipt = (readReceipts as any)?.[msg._id];
                                const receiverIsOnline = receiverPresence?.status === "online";
                                
                                if (msg.isRead || receipt?.readAt) {
                                    tickStatus = "read";
                                } else if (msg.deliveredAt && receiverIsOnline) {
                                    tickStatus = "delivered";
                                } else if (msg.deliveredAt) {
                                    tickStatus = "sent";
                                } else {
                                    tickStatus = "pending";
                                }
                            }

                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[70%] ${isMine ? "order-2" : "order-1"}`}>
                                        <div className={`flex items-start gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                                            {!isMine && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-muted-foreground"
                                                        >
                                                            <MoreVertical className="w-3 h-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteMessage(msg._id, false)}
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-2" />
                                                            Delete for me
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                            <div
                                                className={`relative px-4 py-2.5 max-w-full break-words ${
                                                    isMine 
                                                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-[20px] rounded-br-sm shadow-lg shadow-primary/20" 
                                                        : "bg-card text-card-foreground border border-border/50 rounded-[20px] rounded-bl-sm shadow-md"
                                                } backdrop-blur-sm transition-all duration-200 hover:shadow-xl`}
                                            >
                                                {msg.isDeleted ? (
                                                    <p className="text-sm italic opacity-70">This message was deleted</p>
                                                ) : msg.type === "gif" && msg.metadata?.gifUrl ? (
                                                    <div className="space-y-2">
                                                        <img src={msg.metadata.gifUrl} alt="gif" className="rounded-md max-h-64 w-full object-cover" />
                                                    </div>
                                                ) : msg.type === "photo" && msg.metadata?.photoUrl ? (
                                                    <div className="space-y-2">
                                                        <img src={msg.metadata.photoUrl} alt="photo" className="rounded-md max-h-80 w-full object-cover" />
                                                    </div>
                                                ) : msg.type === "voice" && msg.metadata?.voiceUrl ? (
                                                    <audio controls src={msg.metadata.voiceUrl} className="w-full" />
                                                ) : msg.type === "attachment" && msg.metadata?.attachmentId ? (
                                                    <div className="space-y-2">
                                                        {msg.metadata?.attachmentType?.startsWith("image/") && msg.metadata?.attachmentUrl ? (
                                                            <img
                                                                src={msg.metadata.attachmentUrl}
                                                                alt={msg.metadata.attachmentName || "Attachment"}
                                                                className="rounded-md max-h-80 w-full object-cover"
                                                            />
                                                        ) : msg.metadata?.attachmentType?.startsWith("video/") && msg.metadata?.attachmentUrl ? (
                                                            <video
                                                                src={msg.metadata.attachmentUrl}
                                                                controls
                                                                className="rounded-md max-h-80 w-full"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Paperclip className="w-4 h-4" />
                                                                <span className="text-sm font-medium">
                                                                    {msg.metadata?.attachmentName || "Attachment"}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {msg.metadata?.attachmentUrl && (
                                                            <a
                                                                href={msg.metadata.attachmentUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs font-semibold underline"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                Download
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm">{msg.body}</p>
                                                )}

                                                {!msg.isDeleted && (
                                                    <MessageReactions
                                                        messageId={msg._id}
                                                        userId={userId as any}
                                                        reactions={messageReactions}
                                                        showPicker={false}
                                                    />
                                                )}
                                            </div>
                                            {isMine && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-muted-foreground"
                                                        >
                                                            <MoreVertical className="w-3 h-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteMessage(msg._id, false)}
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-2" />
                                                            Delete for me
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteMessage(msg._id, true)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-2" />
                                                            Delete for everyone
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                        <div className={`mt-1 flex items-center gap-2 text-xs text-muted-foreground ${isMine ? "justify-end" : "justify-start"}`}>
                                            <span>{format(new Date(msg.createdAt), "PP p")}</span>
                                            {isMine && (
                                                <span className="inline-flex items-center gap-1">
                                                    {tickStatus === "read" ? (
                                                        <CheckCheck className="w-3 h-3 text-blue-500" />
                                                    ) : tickStatus === "delivered" ? (
                                                        <CheckCheck className="w-3 h-3 text-muted-foreground" />
                                                    ) : tickStatus === "sent" ? (
                                                        <Check className="w-3 h-3 text-muted-foreground" />
                                                    ) : (
                                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-card border-t border-border sticky bottom-0">
                <div className="container mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 max-w-2xl">
                    {matchId && userId && (
                        <TypingIndicator
                            matchId={matchId as any}
                            userId={userId as any}
                            otherName={match.profile.name || (match as any).name}
                            otherPhotoUrl={primaryPhoto?.url}
                        />
                    )}

                    {smartReplies.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {smartReplies.map((r) => (
                                <Button key={r} type="button" variant="outline" size="sm" onClick={() => setMessage(r)}>
                                    {r}
                                </Button>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) sendPhoto(f);
                                e.currentTarget.value = "";
                            }}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadAttachment(f);
                                e.currentTarget.value = "";
                            }}
                        />

                        <Button type="button" variant="outline" size="icon" onClick={() => setGifOpen(true)} title="Send GIF">
                            <ImageIcon className="w-5 h-5" />
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => photoInputRef.current?.click()}
                            title="Send photo"
                        >
                            Photo
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAttachment}
                            title="Attach file"
                        >
                            <Paperclip className="w-5 h-5" />
                        </Button>

                        {entitlements?.isPremium && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setScheduleOpen(true)}
                                disabled={!message.trim()}
                                title="Schedule message"
                            >
                                <Clock className="w-5 h-5" />
                            </Button>
                        )}

                        <VoiceMessage onSend={sendVoice} disabled={!entitlements} />

                        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    title="Add emoji"
                                >
                                    <Smile className="w-5 h-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-3 w-72" align="start" side="top">
                                <div className="space-y-3">
                                    {emojiGroups.map((group) => (
                                        <div key={group.label} className="space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground">{group.label}</p>
                                            <div className="grid grid-cols-8 gap-1">
                                                {group.items.map((emoji) => (
                                                    <button
                                                        key={`${group.label}-${emoji}`}
                                                        type="button"
                                                        className="text-lg hover:scale-110 transition-transform rounded"
                                                        onClick={() => handleEmojiSelect(emoji)}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Textarea
                            ref={inputRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 min-h-[44px] resize-none"
                            rows={1}
                        />
                        <Button onClick={handleSend} size="icon" disabled={!message.trim()}>
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            <ReportModal
                isOpen={reportOpen}
                onClose={() => setReportOpen(false)}
                reporterId={userId}
                reportedUserId={otherUserId}
            />

            <GifPicker isOpen={gifOpen} onClose={() => setGifOpen(false)} onPick={sendGif} />

            {matchId && userId && entitlements?.isPremium && (
                <ScheduleMessage
                    isOpen={scheduleOpen}
                    onClose={() => setScheduleOpen(false)}
                    matchId={matchId as any}
                    userId={userId as any}
                    initialBody={message}
                />
            )}
        </div>
    );
};

export default Chat;

