// Script to create test notifications
// Run this in your Convex dashboard or create a mutation to test

/*
To test, you can manually create notifications in Convex dashboard:

1. Go to Convex dashboard
2. Navigate to your notifications table
3. Create a few test notifications with:
   - userId: <your user ID>
   - type: "message" or "like" or "match"
   - title: "Test Notification"
   - body: "This is a test"
   - priority: "medium"
   - category: "social"
   - isRead: false
   - createdAt: Date.now()
   
4. Then check if they show up in the NotificationCenter
*/

console.log("Create test notifications manually in Convex dashboard");
console.log("Or use the createNotification mutation from your app");
