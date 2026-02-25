import { MessageCircle } from "lucide-react";

export function NoMessagesEmptyState() {
  return (
    <div className="text-center py-20 glass-card rounded-3xl mx-4">
      <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
      <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
      <p className="text-muted-foreground">Your messages will appear here once you match and start chatting.</p>
    </div>
  );
}
