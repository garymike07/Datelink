import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Volume2, Vibrate, Moon, Mail, Smartphone, Heart, MessageCircle, Phone, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PushPermissionInline } from "./PushPermissionPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Input } from "@/components/ui/input";

export default function NotificationSettings({ userId }: { userId: string }) {
  const { toast } = useToast();
  const preferences = useQuery(api.notificationPreferences.getPreferences, {
    userId: userId as any,
  });
  
  // Phase 3: Push notification preferences
  const pushPreferences = useQuery(api.pushNotifications.getPreferences);
  const updatePushPreferences = useMutation(api.pushNotifications.updatePreferences);
  const { testNotification } = usePushNotifications();
  
  const updatePreferences = useMutation(api.notificationPreferences.updatePreferences);
  
  const [isSaving, setIsSaving] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");

  const handleToggle = async (field: string, value: boolean) => {
    setIsSaving(true);
    try {
      await updatePreferences({
        userId: userId as any,
        updates: { [field]: value },
      });
      
      toast({
        title: "Preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async (field: string, value: boolean) => {
    setIsSaving(true);
    try {
      await updatePushPreferences({
        [field]: value,
      });
      
      toast({
        title: "Preferences updated",
        description: "Your push notification settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuietHoursUpdate = async () => {
    setIsSaving(true);
    try {
      await updatePushPreferences({
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
      });
      
      toast({
        title: "Quiet hours updated",
        description: `Notifications paused from ${quietStart} to ${quietEnd}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quiet hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!preferences) {
    return 
              <Switch
                checked={preferences.messageEnabled}
                onCheckedChange={(checked) => handleToggle("messageEnabled", checked)}
                disabled={isSaving || !preferences.enabled}
              />
            </div>

            
                <Switch
                  checked={pushPreferences.quietHoursEnabled}
                  onCheckedChange={(checked) => handlePushToggle("quietHoursEnabled", checked)}
                  disabled={isSaving || !pushPreferences.pushEnabled}
                />
              </div>

              {pushPreferences.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">End Time</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      onClick={handleQuietHoursUpdate}
                      disabled={isSaving}
                      variant="outline"
                      className="w-full"
                    >
                      {isSaving ? "Updating..." : "Update Quiet Hours"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Batch Notifications */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Grouping</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Batch Similar Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Group multiple likes/views into one notification
                  </p>
                </div>
                <Switch
                  checked={pushPreferences.batchNotifications}
                  onCheckedChange={(checked) => handlePushToggle("batchNotifications", checked)}
                  disabled={isSaving || !pushPreferences.pushEnabled}
                />
              </div>
            </div>

            <Separator />

            {/* Test Notification */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Test Notifications</h3>
              <Button
                onClick={testNotification}
                variant="outline"
                className="w-full"
                disabled={!pushPreferences.pushEnabled}
              >
                <Bell className="mr-2 h-4 w-4" />
                Send Test Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
