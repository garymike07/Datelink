import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface MessageReactionsProps {
    messageId: Id<"messages">;
    userId: Id<"users">;
    reactions?: Array<{ userId: Id<"users">; emoji: string }>;
    showPicker?: boolean;
}

const EMOJI_OPTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍", "👎"];

const MessageReactions = ({ messageId, userId, reactions = [], showPicker = false }: MessageReactionsProps) => {
    const [open, setOpen] = useState(false);
    const addReaction = useMutation(api.messages.addReaction);
    const removeReaction = useMutation(api.messages.removeReaction);

    const userReaction = reactions.find((r) => r.userId === userId);

    const handleReaction = async (emoji: string) => {
        try {
            if (userReaction && userReaction.emoji === emoji) {
                await removeReaction({ messageId, userId });
            } else {
                await addReaction({ messageId, userId, emoji });
            }
            setOpen(false);
        } catch (error) {
            console.error("Failed to react:", error);
        }
    };

    const groupedReactions = reactions.reduce((acc, r) => {
        if (!acc[r.emoji]) {
            acc[r.emoji] = 0;
        }
        acc[r.emoji]++;
        return acc;
    }, {} as Record<string, number>);

    const hasReactions = Object.keys(groupedReactions).length > 0;

    if (!hasReactions && !showPicker) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, count]) => (
                <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`text-xs px-2 py-1 rounded-full border transition-all hover:scale-110 ${userReaction?.emoji === emoji
                            ? "bg-primary/20 border-primary"
                            : "bg-muted border-border hover:bg-muted/80"
                        }`}
                >
                    {emoji} {count > 1 && count}
                </button>
            ))}

            {showPicker && (
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="h-6 w-6 p-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                            <Smile className="w-3 h-3" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <div className="flex gap-1">
                            {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    className="text-2xl hover:scale-125 transition-transform p-1"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
};

export default MessageReactions;
