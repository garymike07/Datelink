import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Bell, BellOff, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SaveSearchModal from "./SaveSearchModal";
import { useNavigate } from "react-router-dom";

interface SavedSearchesProps {
  userId: string;
}

const SavedSearches: React.FC<SavedSearchesProps> = ({ userId }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editingSearch, setEditingSearch] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const savedSearches = useQuery(api.discovery.getSavedSearches, { userId });
  const deleteSearch = useMutation(api.discovery.deleteSavedSearch);
  const updateSearch = useMutation(api.discovery.updateSavedSearch);

  const handleDeleteSearch = async (searchId: string) => {
    try {
      await deleteSearch({ userId, searchId });
      toast({
        title: "Search deleted",
        description: "Your saved search has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleNotifications = async (search: any) => {
    try {
      await updateSearch({
        userId,
        searchId: search._id,
        notificationsEnabled: !search.notificationsEnabled,
      });
      toast({
        title: search.notificationsEnabled ? "Notifications disabled" : "Notifications enabled",
        description: search.notificationsEnabled
          ? "You won't receive alerts for new matches"
          : "You'll receive alerts when new profiles match this search",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRunSearch = (searchId: string) => {
    navigate(`/discover?savedSearchId=${searchId}`);
  };

  const handleEditSearch = (search: any) => {
    setEditingSearch(search);
    setIsModalOpen(true);
  };

  if (!savedSearches) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saved Searches</h2>
          <p className="text-sm text-muted-foreground">
            Quick access to your favorite search filters
          </p>
        </div>
        <Button onClick={() => {
          setEditingSearch(null);
          setIsModalOpen(true);
        }}>
          Save Current Search
        </Button>
      </div>

      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              You haven't saved any searches yet.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Save your favorite search filters for quick access later!
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              Create Your First Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedSearches.map((search) => (
            <Card key={search._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{search.name}</CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">
                          Age {search.filters.minAge}-{search.filters.maxAge}
                        </Badge>
                        <Badge variant="secondary">
                          {search.filters.maxDistance}km
                        </Badge>
                        <Badge variant="secondary">
                          {search.filters.genderPreference.join(", ")}
                        </Badge>
                      </div>
                      {search.newMatchesCount > 0 && (
                        <Badge variant="default" className="mt-2">
                          {search.newMatchesCount} new matches
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleNotifications(search)}
                    className="ml-2"
                  >
                    {search.notificationsEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleRunSearch(search._id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Search
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditSearch(search)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteSearch(search._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SaveSearchModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSearch(null);
        }}
        userId={userId}
        existingSearch={editingSearch}
      />
    </div>
  );
};

export default SavedSearches;
