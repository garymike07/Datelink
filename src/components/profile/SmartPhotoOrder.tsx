import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function SmartPhotoOrder({ userId }: { userId: string }) {
  const items = useQuery(api.analytics.getPhotoAnalyticsForUser, userId ? { userId } : "skip");
  const reorderPhotos = useMutation(api.profiles.reorderPhotos);
  const setPrimary = useMutation(api.profiles.setPrimaryPhoto);
  const [saving, setSaving] = useState(false);

  const ordered = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a: any, b: any) => (a.photo.order ?? 0) - (b.photo.order ?? 0));
  }, [items]);

  const best = useMemo(() => {
    if (!ordered.length) return null;
    return [...ordered].sort((a: any, b: any) => (b.analytics.likeRate ?? 0) - (a.analytics.likeRate ?? 0))[0];
  }, [ordered]);

  const move = async (from: number, to: number) => {
    if (to < 0 || to >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const orderedPhotoIds = next.map((x: any) => x.photo._id);

    setSaving(true);
    try {
      await reorderPhotos({ userId: userId as any, orderedPhotoIds });
      toast.success("Photo order updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reorder photos");
    } finally {
      setSaving(false);
    }
  };

  const makePrimary = async (photoId: string) => {
    setSaving(true);
    try {
      await setPrimary({ userId: userId as any, photoId: photoId as any });
      toast.success("Primary photo updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to set primary photo");
    } finally {
      setSaving(false);
    }
  };

  if (!items || ordered.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Smart Photo Order</h4>
        {best?.photo?._id && best.photo._id !== ordered[0]?.photo?._id && (
          <Badge variant="secondary">Suggestion: make your best photo primary</Badge>
        )}
      </div>

      <div className="space-y-2">
        {ordered.map((item: any, idx: number) => (
          <div key={item.photo._id} className="flex items-center gap-3 rounded-lg border p-2">
            <img src={item.photo.url} className="h-14 w-14 rounded-md object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Photo {idx + 1}</span>
                {item.photo.isPrimary && <Badge>Primary</Badge>}
                {best?.photo?._id === item.photo._id && <Badge variant="secondary">Best performing</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.analytics.impressions} views · {item.analytics.likes} likes · {Math.round((item.analytics.likeRate || 0) * 100)}% like rate
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="outline" onClick={() => move(idx, idx - 1)} disabled={saving || idx === 0}>
                Up
              </Button>
              <Button size="sm" variant="outline" onClick={() => move(idx, idx + 1)} disabled={saving || idx === ordered.length - 1}>
                Down
              </Button>
              <Button size="sm" onClick={() => makePrimary(item.photo._id)} disabled={saving || item.photo.isPrimary}>
                Primary
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
