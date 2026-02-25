import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Viewer {
  userId: string;
  userName: string;
  userPhoto?: string;
  viewedAt: number;
}

interface Liker {
  userId: string;
  userName: string;
  userPhoto?: string;
  likedAt: number;
}

interface StatusViewersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewers: Viewer[];
  likers: Liker[];
  viewCount: number;
  likeCount: number;
}

export function StatusViewersDialog({
  open,
  onOpenChange,
  viewers,
  likers,
  viewCount,
  likeCount,
}: StatusViewersDialogProps) {
  const [activeTab, setActiveTab] = useState<"viewers" | "likers">("viewers");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Status Engagement</DialogTitle>
          <DialogDescription>
            View who has seen and liked your status
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "viewers" | "likers")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="viewers" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>Views ({viewCount})</span>
            </TabsTrigger>
            <TabsTrigger value="likers" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Likes ({likeCount})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="viewers" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {viewers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Eye className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No views yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewers.map((viewer) => (
                    <div
                      key={viewer.userId}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={viewer.userPhoto} />
                        <AvatarFallback>{viewer.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {viewer.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(viewer.viewedAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="likers" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {likers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Heart className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No likes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {likers.map((liker) => (
                    <div
                      key={liker.userId}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={liker.userPhoto} />
                        <AvatarFallback>{liker.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {liker.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(liker.likedAt, { addSuffix: true })}
                        </p>
                      </div>
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
