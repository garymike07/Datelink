import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

type AdvancedFiltersState = {
  age: [number, number];
  distanceMax: number;
  height: [number, number];
  mustBeVerified: boolean;
  mustHavePhotos: boolean;
  mustHaveBio: boolean;
  activeInLast7Days: boolean;
};

export function AdvancedFilters({ userId, isOpen, onClose }: { userId: string; isOpen: boolean; onClose: () => void }) {
  const me = useQuery(api.profiles.getMyProfile, userId ? { userId } : "skip");
  const updatePreferences = useMutation(api.profiles.updatePreferences);

  const defaults = useMemo<AdvancedFiltersState>(() => {
    const prefs: any = me?.preferences;
    return {
      age: [prefs?.minAge ?? 18, prefs?.maxAge ?? 50],
      distanceMax: prefs?.maxDistance ?? 50,
      height: [prefs?.minHeight ?? 140, prefs?.maxHeight ?? 220],
      mustBeVerified: !!prefs?.mustBeVerified,
      mustHavePhotos: !!prefs?.mustHavePhotos,
      mustHaveBio: !!prefs?.mustHaveBio,
      activeInLast7Days: !!prefs?.activeInLast7Days,
    };
  }, [me?.preferences]);

  const [state, setState] = useState<AdvancedFiltersState>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setState(defaults);
  }, [defaults, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        userId: userId as any,
        minAge: state.age[0],
        maxAge: state.age[1],
        maxDistance: state.distanceMax,
        minHeight: state.height[0],
        maxHeight: state.height[1],
        mustBeVerified: state.mustBeVerified,
        mustHavePhotos: state.mustHavePhotos,
        mustHaveBio: state.mustHaveBio,
        activeInLast7Days: state.activeInLast7Days,
      });
      toast.success("Filters saved");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save filters");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setState({ ...defaults });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Customize your discovery preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="demographics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demographics">Basics</TabsTrigger>
            <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
            <TabsTrigger value="dealbreakers">Dealbreakers</TabsTrigger>
          </TabsList>

          <TabsContent value="demographics" className="space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Age range</Label>
                <span className="text-sm text-muted-foreground">
                  {state.age[0]}–{state.age[1]}
                </span>
              </div>
              <Slider
                value={state.age}
                min={18}
                max={80}
                step={1}
                onValueChange={(v) => setState((s) => ({ ...s, age: v as any }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Distance max</Label>
                <span className="text-sm text-muted-foreground">{state.distanceMax} km</span>
              </div>
              <Slider
                value={[state.distanceMax]}
                min={5}
                max={500}
                step={5}
                onValueChange={(v) => setState((s) => ({ ...s, distanceMax: v[0] }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Height range</Label>
                <span className="text-sm text-muted-foreground">
                  {state.height[0]}–{state.height[1]} cm
                </span>
              </div>
              <Slider
                value={state.height}
                min={140}
                max={220}
                step={1}
                onValueChange={(v) => setState((s) => ({ ...s, height: v as any }))}
              />
            </div>
          </TabsContent>

          <TabsContent value="lifestyle" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Verified only</Label>
                <p className="text-sm text-muted-foreground">Only show verified profiles</p>
              </div>
              <Switch checked={state.mustBeVerified} onCheckedChange={(v) => setState((s) => ({ ...s, mustBeVerified: v }))} />
            </div>
          </TabsContent>

          <TabsContent value="dealbreakers" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Must have photos</Label>
                <p className="text-sm text-muted-foreground">Hide profiles without photos</p>
              </div>
              <Switch checked={state.mustHavePhotos} onCheckedChange={(v) => setState((s) => ({ ...s, mustHavePhotos: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Must have bio</Label>
                <p className="text-sm text-muted-foreground">Hide profiles with empty bio</p>
              </div>
              <Switch checked={state.mustHaveBio} onCheckedChange={(v) => setState((s) => ({ ...s, mustHaveBio: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Active in last 7 days</Label>
                <p className="text-sm text-muted-foreground">Prioritize active profiles</p>
              </div>
              <Switch
                checked={state.activeInLast7Days}
                onCheckedChange={(v) => setState((s) => ({ ...s, activeInLast7Days: v }))}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
