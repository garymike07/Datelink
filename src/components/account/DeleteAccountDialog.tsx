import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const DELETION_REASONS = [
  { value: "found_match", label: "I found someone" },
  { value: "not_using", label: "Not using the app anymore" },
  { value: "privacy", label: "Privacy concerns" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "technical_issues", label: "Technical issues" },
  { value: "other", label: "Other" },
];

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();

  const deletionStatus = useQuery(api.accountManagement.getDeletionStatus, token ? { token } : "skip");
  const requestDeletion = useMutation(api.accountManagement.requestAccountDeletion);
  const cancelDeletion = useMutation(api.accountManagement.cancelAccountDeletion);

  const hasPendingDeletion = deletionStatus?.status === "pending";

  const handleRequestDeletion = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }
    if (!token) {
      toast.error("You must be logged in to delete your account");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await requestDeletion({ reason, feedback, token });
      toast.success(result.message);
      setOpen(false);
      setReason("");
      setFeedback("");
    } catch (error: any) {
      toast.error(error.message || "Failed to request account deletion");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!token) {
      toast.error("You must be logged in to cancel deletion");
      return;
    }
    try {
      const result = await cancelDeletion({ token });
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel deletion");
    }
  };

  if (hasPendingDeletion && deletionStatus) {
    const daysRemaining = Math.ceil(
      (deletionStatus.scheduledFor - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Account Deletion Scheduled</p>
              <p>
                Your account will be permanently deleted in{" "}
                <span className="font-bold">{daysRemaining} days</span>.
              </p>
              <p className="text-sm">
                Deletion date:{" "}
                {new Date(deletionStatus.scheduledFor).toLocaleDateString()}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Button
          variant="outline"
          onClick={handleCancelDeletion}
          className="w-full"
        >
          <Clock className="mr-2 h-4 w-4" />
          Cancel Account Deletion
        </Button>
      </div>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <p>
              We're sorry to see you go. Deleting your account is permanent and
              will:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Remove your profile from the platform</li>
              <li>Delete all your photos and personal information</li>
              <li>Remove all your matches and conversations</li>
              <li>Cancel any active subscriptions</li>
            </ul>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-1">30-Day Grace Period</p>
                <p className="text-sm">
                  Your account will be deactivated immediately, but you'll have
                  30 days to change your mind. After that, all data will be
                  permanently deleted.
                </p>
              </AlertDescription>
            </Alert>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Why are you leaving? <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {DELETION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">
              Additional feedback (optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Tell us more about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRequestDeletion}
            disabled={isDeleting || !reason}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Processing..." : "Delete My Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
