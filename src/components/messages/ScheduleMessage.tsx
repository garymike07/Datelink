import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

export function ScheduleMessage({
  isOpen,
  onClose,
  matchId,
  userId,
  initialBody,
}: {
  isOpen: boolean;
  onClose: () => void;
  matchId: Id<"matches">;
  userId: Id<"users">;
  initialBody: string;
}) {
  const schedule = useMutation(api.scheduledMessages.scheduleMessage);
  const [body, setBody] = useState(initialBody);
  const [when, setWhen] = useState<string>(() => {
    const d = new Date(Date.now() + 10 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setBody(initialBody);
  }, [isOpen, initialBody]);

  const scheduledFor = useMemo(() => {
    const dt = new Date(when);
    const ms = dt.getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [when]);

  const canSave = body.trim().length > 0 && typeof scheduledFor === "number" && scheduledFor > Date.now();

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await schedule({ matchId, senderId: userId, body: body.trim(), scheduledFor: scheduledFor! } as any);
      toast.success("Message scheduled");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to schedule message");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule message</DialogTitle>
          <DialogDescription>
            Choose when to send your message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" />
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSave || saving}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
