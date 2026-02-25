import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReportCategory =
  | "inappropriate_messages"
  | "profile_issues"
  | "offline_behavior"
  | "other";

const subcategoriesByCategory: Record<ReportCategory, { value: string; label: string }[]> = {
  inappropriate_messages: [
    { value: "sexual_content", label: "Sexual content" },
    { value: "harassment", label: "Harassment" },
    { value: "hate_speech", label: "Hate speech" },
    { value: "spam", label: "Spam" },
  ],
  profile_issues: [
    { value: "fake_profile", label: "Fake profile" },
    { value: "stolen_photos", label: "Stolen photos" },
    { value: "underage_user", label: "Underage user" },
    { value: "scam_fraud", label: "Scam / fraud" },
  ],
  offline_behavior: [
    { value: "felt_unsafe", label: "Felt unsafe in person" },
    { value: "didnt_match_photos", label: "Didn’t match photos" },
    { value: "threatening_behavior", label: "Threatening behavior" },
    { value: "stood_me_up", label: "Stood me up" },
  ],
  other: [{ value: "other", label: "Other" }],
};

export function ReportModal(props: {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  reportedUserId: string;
}) {
  const submitReport = useMutation(api.safety.submitReport);
  const blockUser = useMutation(api.safety.blockUser);

  const [category, setCategory] = useState<ReportCategory>("inappropriate_messages");
  const [subcategory, setSubcategory] = useState<string>("sexual_content");
  const [description, setDescription] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [autoBlock, setAutoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const subcategories = useMemo(() => subcategoriesByCategory[category], [category]);

  const reset = () => {
    setCategory("inappropriate_messages");
    setSubcategory("sexual_content");
    setDescription("");
    setScreenshots([]);
    setAutoBlock(true);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    props.onClose();
  };

  const handleScreenshotsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 3);

    Promise.all(
      selected.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.onload = () => resolve(String(reader.result || ""));
            reader.readAsDataURL(file);
          })
      )
    )
      .then((dataUrls) => setScreenshots((prev) => [...prev, ...dataUrls].slice(0, 3)))
      .catch(() => toast.error("Failed to attach screenshots"));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReport({
        reporterId: props.reporterId as any,
        reportedUserId: props.reportedUserId as any,
        category,
        subcategory,
        description: description.trim() ? description.trim() : undefined,
        screenshots: screenshots.length ? screenshots : undefined,
        autoBlock,
      } as any);

      if (autoBlock) {
        await blockUser({
          blockerId: props.reporterId as any,
          blockedUserId: props.reportedUserId as any,
        });
      }

      toast.success("Thanks for keeping our community safe");
      handleClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report user</DialogTitle>
          <DialogDescription>
            Tell us what happened. Reports are confidential.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                const next = v as ReportCategory;
                setCategory(next);
                setSubcategory(subcategoriesByCategory[next][0]?.value || "other");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inappropriate_messages">Inappropriate Messages</SelectItem>
                <SelectItem value="profile_issues">Profile Issues</SelectItem>
                <SelectItem value="offline_behavior">Offline Behavior</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subcategory</Label>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Details (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context to help our team review…"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Attach screenshots (optional)</Label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleScreenshotsUpload}
            />
            {screenshots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {screenshots.map((s, idx) => (
                  <div key={idx} className="aspect-square overflow-hidden rounded-md border">
                    <img src={s} alt={`Screenshot ${idx + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-block"
              checked={autoBlock}
              onCheckedChange={(v) => setAutoBlock(Boolean(v))}
            />
            <Label htmlFor="auto-block">Block user after submitting (recommended)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
