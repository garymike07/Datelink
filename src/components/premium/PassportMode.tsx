import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

const CITIES: Record<string, { lat: number; lon: number }> = {
  "New York": { lat: 40.7128, lon: -74.0060 },
  "London": { lat: 51.5074, lon: -0.1278 },
  "Paris": { lat: 48.8566, lon: 2.3522 },
  "Tokyo": { lat: 35.6762, lon: 139.6503 },
  "Sydney": { lat: -33.8688, lon: 151.2093 },
  "Dubai": { lat: 25.2048, lon: 55.2708 },
};

export function PassportMode({ userId, isOpen, onClose }: { userId: string; isOpen: boolean; onClose: () => void }) {
  const me = useQuery(api.profiles.getMyProfile, userId ? { userId } : "skip");
  const setPassport = useMutation(api.profiles.setPassportLocation);
  const clearPassport = useMutation(api.profiles.clearPassportLocation);

  const current = useMemo(() => {
    const p: any = me;
    return {
      city: p?.passportCity || "",
      expiresAt: p?.passportExpiresAt || null,
    };
  }, [me]);

  const [city, setCity] = useState<string>(current.city || "New York");
  const [saving, setSaving] = useState(false);

  const active = current.expiresAt && current.expiresAt > Date.now();

  const handleSet = async () => {
    const coords = CITIES[city];
    if (!coords) return;
    setSaving(true);
    try {
      await setPassport({
        userId: userId as any,
        latitude: coords.lat,
        longitude: coords.lon,
        city,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
      toast.success("Passport location set");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to set passport location");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await clearPassport({ userId: userId as any });
      toast.success("Passport cleared");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear passport");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passport Mode</DialogTitle>
          <DialogDescription>
            {active ? `Active: ${current.city} (expires in ~24h)` : "Set a temporary location for discovery."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          <Select value={city} onValueChange={setCity}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a city" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CITIES).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-2">
            {active && (
              <Button variant="outline" onClick={handleClear} disabled={saving}>
                Use actual location
              </Button>
            )}
            <Button onClick={handleSet} disabled={saving}>
              Set for 24 hours
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
