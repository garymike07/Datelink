import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentFilters?: any;
  existingSearch?: any;
}

const SaveSearchModal: React.FC<SaveSearchModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentFilters,
  existingSearch,
}) => {
  const { toast } = useToast();
  const [searchName, setSearchName] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const saveSearch = useMutation(api.discovery.saveSearch);
  const updateSearch = useMutation(api.discovery.updateSavedSearch);

  // Get user preferences for default filters
  const preferences = useQuery(api.matching.getUserPreferences, { userId });

  useEffect(() => {
    if (existingSearch) {
      setSearchName(existingSearch.name);
      setNotificationsEnabled(existingSearch.notificationsEnabled);
    } else {
      setSearchName("");
      setNotificationsEnabled(false);
    }
  }, [existingSearch]);

  const handleSave = async () => {
    if (!searchName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this search.",
        variant: "destructive",
      });
      return;
    }

    try {
      const filters = currentFilters || (preferences ? {
        minAge: preferences.minAge,
        maxAge: preferences.maxAge,
        maxDistance: preferences.maxDistance,
        genderPreference: preferences.genderPreference,
        minHeight: preferences.minHeight,
        maxHeight: preferences.maxHeight,
        relationshipGoals: preferences.relationshipGoals,
        religions: preferences.religions,
        education: preferences.education,
        verified: preferences.mustBeVerified,
      } : {
        minAge: 18,
        maxAge: 50,
        maxDistance: 50,
        genderPreference: ["woman"],
      });

      if (existingSearch) {
        await updateSearch({
          userId,
          searchId: existingSearch._id,
          name: searchName,
          notificationsEnabled,
        });
        toast({
          title: "Search updated",
          description: "Your search has been updated successfully.",
        });
      } else {
        await saveSearch({
          userId,
          name: searchName,
          filters,
          notificationsEnabled,
        });
        toast({
          title: "Search saved",
          description: "Your search has been saved successfully.",
        });
      }
      
      onClose();
      setSearchName("");
      setNotificationsEnabled(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingSearch ? "Edit Saved Search" : "Save Search"}
          </DialogTitle>
          <DialogDescription>
            {existingSearch
              ? "Update your saved search details"
              : "Save your current filters for quick access later"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="searchName">Search Name</Label>
            <Input
              id="searchName"
              placeholder="e.g., Active professionals nearby"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new profiles match this search
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {existingSearch ? "Update" : "Save"} Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSearchModal;
