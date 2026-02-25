import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotificationDebug() {
  const { user } = useAuth();
  const userId = user?._id;

  // Get all notifications (no filters)
  const allNotifications = useQuery(
    api.notifications.getNotifications,
    userId ? { userId: userId as any, limit: 100 } : "skip"
  );

  // Get unread only
  const unreadNotifications = useQuery(
    api.notifications.getNotifications,
    userId ? { userId: userId as any, limit: 100, unreadOnly: true } : "skip"
  );

  // Get by category
  const socialNotifications = useQuery(
    api.notifications.getNotifications,
    userId ? { userId: userId as any, limit: 100, category: "social" } : "skip"
  );

  const callNotifications = useQuery(
    api.notifications.getNotifications,
    userId ? { userId: userId as any, limit: 100, category: "call" } : "skip"
  );

  // Get unread counts
  const unreadCounts = useQuery(
    api.notifications.getUnreadCountByCategory,
    userId ? { userId: userId as any } : "skip"
  );

  // Create test notification
  const createNotification = useMutation(api.notifications.createNotification);

  const handleCreateTest = async () => {
    if (!userId) return;
    await createNotification({
      userId: userId as any,
      type: "message",
      title: "Test Notification " + Date.now(),
      body: "This is a test notification created at " + new Date().toLocaleTimeString(),
      priority: "high",
      category: "social",
    });
  };

  if (!userId) {
    return <div className="p-8">Please log in to debug notifications</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold">Notification Debug Panel</h1>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>User ID:</span>
            <code className="bg-muted px-2 py-1 rounded text-xs">{userId}</code>
          </div>
          <div className="flex justify-between">
            <span>Total Notifications:</span>
            <Badge>{allNotifications?.length ?? 0}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Unread Notifications:</span>
            <Badge variant="destructive">{unreadNotifications?.length ?? 0}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Social:</span>
            <Badge>{socialNotifications?.length ?? 0}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Calls:</span>
            <Badge>{callNotifications?.length ?? 0}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unread Counts by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{unreadCounts?.total ?? 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{unreadCounts?.social ?? 0}</div>
              <div className="text-sm text-muted-foreground">Social</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{unreadCounts?.call ?? 0}</div>
              <div className="text-sm text-muted-foreground">Call</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{unreadCounts?.payment ?? 0}</div>
              <div className="text-sm text-muted-foreground">Payment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{unreadCounts?.engagement ?? 0}</div>
              <div className="text-sm text-muted-foreground">Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{unreadCounts?.system ?? 0}</div>
              <div className="text-sm text-muted-foreground">System</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleCreateTest}>Create Test Notification</Button>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({allNotifications?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadNotifications?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="social">Social ({socialNotifications?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="call">Call ({callNotifications?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2">
          {allNotifications?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No notifications found. Click "Create Test Notification" to add one.
              </CardContent>
            </Card>
          ) : (
            allNotifications?.map((notif: any) => (
              <Card key={notif._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{notif.title}</div>
                    <Badge variant={notif.isRead ? "outline" : "default"}>
                      {notif.isRead ? "Read" : "Unread"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{notif.body}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{notif.type}</Badge>
                    <Badge variant="secondary">{notif.category}</Badge>
                    <Badge variant="secondary">{notif.priority}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-2">
          {unreadNotifications?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No unread notifications.
              </CardContent>
            </Card>
          ) : (
            unreadNotifications?.map((notif: any) => (
              <Card key={notif._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{notif.title}</div>
                    <Badge variant="default">Unread</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{notif.body}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{notif.type}</Badge>
                    <Badge variant="secondary">{notif.category}</Badge>
                    <Badge variant="secondary">{notif.priority}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="social" className="space-y-2">
          {socialNotifications?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No social notifications.
              </CardContent>
            </Card>
          ) : (
            socialNotifications?.map((notif: any) => (
              <Card key={notif._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{notif.title}</div>
                    <Badge variant={notif.isRead ? "outline" : "default"}>
                      {notif.isRead ? "Read" : "Unread"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{notif.body}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{notif.type}</Badge>
                    <Badge variant="secondary">{notif.priority}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="call" className="space-y-2">
          {callNotifications?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No call notifications.
              </CardContent>
            </Card>
          ) : (
            callNotifications?.map((notif: any) => (
              <Card key={notif._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{notif.title}</div>
                    <Badge variant={notif.isRead ? "outline" : "default"}>
                      {notif.isRead ? "Read" : "Unread"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{notif.body}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{notif.type}</Badge>
                    <Badge variant="secondary">{notif.priority}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
