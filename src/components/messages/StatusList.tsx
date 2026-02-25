import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StatusViewer } from "./StatusViewer";
import { CreateStatusDialog } from "./CreateStatusDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function StatusList() {
  const { user } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const matchesStatuses = useQuery(
    api.statusPosts.getMatchesStatusPosts,
    user?._id ? { userId: user._id } : "skip"
  );

  const myStatuses = useQuery(
    api.statusPosts.getMyStatusPosts,
    user?._id ? { userId: user._id } : "skip"
  );

  const handleStatusClick = (userId: Id<"users">) => {
    setSelectedUserId(userId);
    setViewerOpen(true);
  };

  const handleMyStatusClick = () => {
    if (myStatuses && myStatuses.length > 0) {
      setSelectedUserId(user!._id);
      setViewerOpen(true);
    } else {
      setCreateDialogOpen(true);
    }
  };

  if (!matchesStatuses) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Status</h2>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {/* My Status */}
            <div className="flex flex-col items-center gap-2 min-w-fit">
              <button
                onClick={handleMyStatusClick}
                className="relative group"
              >
                <div
                  className={`relative rounded-full p-1 ${
                    myStatuses && myStatuses.length > 0
                      ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <Avatar className="w-16 h-16 border-2 border-white dark:border-gray-900">
                    <AvatarImage src={user?.photo} />
                    <AvatarFallback>{user?.name?.[0] || "M"}</AvatarFallback>
                  </Avatar>
                  {(!myStatuses || myStatuses.length === 0) && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                      <Plus className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
              <p className="text-xs font-medium text-center max-w-[70px] truncate">
                {myStatuses && myStatuses.length > 0 ? "My Status" : "Add Status"}
              </p>
            </div>

            {/* Matches' Statuses */}
            {matchesStatuses.map((status) => (
              <div
                key={status.userId}
                className="flex flex-col items-center gap-2 min-w-fit"
              >
                <button
                  onClick={() => handleStatusClick(status.userId)}
                  className="relative group"
                >
                  <div
                    className={`relative rounded-full p-1 ${
                      status.hasUnviewed
                        ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <Avatar className="w-16 h-16 border-2 border-white dark:border-gray-900">
                      <AvatarImage src={status.userPhoto} />
                      <AvatarFallback>{status.userName[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </button>
                <p className="text-xs font-medium text-center max-w-[70px] truncate">
                  {status.userName}
                </p>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Status Viewer */}
      {selectedUserId && (
        <StatusViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          targetUserId={selectedUserId}
        />
      )}

      {/* Create Status Dialog */}
      <CreateStatusDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
