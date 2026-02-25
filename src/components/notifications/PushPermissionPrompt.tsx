import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushPermissionPromptProps {
  onDismiss?: () => void;
  autoShow?: boolean;
  showOnlyIfNotGranted?: boolean;
}

export function PushPermissionPrompt({
  onDismiss,
  autoShow = true,
  showOnlyIfNotGranted = true,
}: PushPermissionPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
  } = usePushNotifications();

  useEffect(() => {
    // Check if user has dismissed this before
    const dismissed = localStorage.getItem('push-prompt-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show prompt if conditions are met
    if (autoShow && isSupported) {
      if (showOnlyIfNotGranted && permission === 'granted' && isSubscribed) {
        return;
      }

      // Show after a short delay to not be intrusive
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [autoShow, isSupported, permission, isSubscribed, showOnlyIfNotGranted]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setIsVisible(false);
      onDismiss?.();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('push-prompt-dismissed', 'true');
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleLater = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isSupported || isDismissed || !isVisible) {
    return null;
  }

  // Don't show if already granted and subscribed
  if (showOnlyIfNotGranted && permission === 'granted' && isSubscribed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Enable Notifications</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="mt-2">
            Get notified about new matches, messages, and likes instantly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Never miss a match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Respond to messages faster</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Get alerted about incoming calls</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleEnable}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>Enabling...</>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Enable
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleLater}
              disabled={isLoading}
            >
              Later
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can change this anytime in settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline compact version for settings page
export function PushPermissionInline() {
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-4">
        <BellOff className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Push notifications not supported</p>
          <p className="text-xs text-muted-foreground">
            Your browser doesn't support push notifications
          </p>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <BellOff className="h-5 w-5 text-destructive" />
        <div className="flex-1">
          <p className="text-sm font-medium">Notifications blocked</p>
          <p className="text-xs text-muted-foreground">
            You've blocked notifications. Please enable them in your browser settings.
          </p>
        </div>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/5 p-4">
        <Bell className="h-5 w-5 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium">Push notifications enabled</p>
          <p className="text-xs text-muted-foreground">
            You'll receive notifications for new activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribe}
          disabled={isLoading}
        >
          {isLoading ? 'Disabling...' : 'Disable'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border p-4">
      <Bell className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium">Enable push notifications</p>
        <p className="text-xs text-muted-foreground">
          Get notified about matches, messages, and more
        </p>
      </div>
      <Button
        onClick={subscribe}
        disabled={isLoading}
        size="sm"
      >
        {isLoading ? 'Enabling...' : 'Enable'}
      </Button>
    </div>
  );
}
