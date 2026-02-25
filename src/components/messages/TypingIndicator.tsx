import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface TypingIndicatorProps {
    matchId: Id<"matches">;
    userId: Id<"users">;
    otherName?: string;
    otherPhotoUrl?: string;
}

const TypingIndicator = ({ matchId, userId, otherName, otherPhotoUrl }: TypingIndicatorProps) => {
    const typingStatus = useQuery(api.messages.getTypingStatus, { matchId, userId });

    if (!typingStatus?.isTyping) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            {otherPhotoUrl ? (
                <img
                    src={otherPhotoUrl}
                    alt={otherName || "Typing"}
                    className="h-6 w-6 rounded-full object-cover"
                />
            ) : null}
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>{otherName ? `${otherName} is typing...` : "typing..."}</span>
        </div>
    );
};

export default TypingIndicator;
