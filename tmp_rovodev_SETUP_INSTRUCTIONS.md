# Push Notifications Setup Instructions

## What Has Been Implemented

### 1. Enhanced Service Worker (`public/sw.js`)
✅ Handles push notifications with different types:
- **Call notifications**: Shows Answer/Decline buttons with persistent notification
- **Message notifications**: Shows Reply/View buttons
- **Match notifications**: Shows Say Hi button
- Custom vibration patterns for each type
- Automatic notification click handling

### 2. Push Notification Backend (`convex/`)
✅ **pushNotifications.ts**: Core notification logic
- Checks user preferences before sending
- Respects quiet hours (except for calls)
- Manages push subscriptions
- Integrates with existing notification system

✅ **pushNotificationsActions.ts**: External API integration (scaffold)
- Ready for web-push library integration
- Handles subscription validation
- Manages failed notifications

✅ **Integration with messages and calls**:
- Messages automatically trigger push notifications
- Video/audio calls trigger high-priority notifications
- Proper metadata passed to notifications

### 3. Frontend Components
✅ **PushNotificationManager**: Auto-prompt and listener
- Automatically prompts for permission after 3 seconds of login
- Handles service worker messages (ringtone, call actions)
- Plays ringtone for incoming calls

✅ **usePushNotifications hook**: Already existed
- Subscribe/unsubscribe functionality
- Permission management

### 4. Test Page
✅ **tmp_rovodev_test_push_notifications.html**
- Test all notification types
- Check browser support
- Debug subscription status

## Setup Steps

### Step 1: Generate VAPID Keys (For Production)

To send actual push notifications, you need VAPID keys:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

This will output:
```
=======================================
Public Key:
BGx...your-public-key...
Private Key:
abc...your-private-key...
=======================================
```

### Step 2: Configure Environment Variables

Add to `.env.local` (create if not exists):

```env
# VAPID Keys for Push Notifications
VITE_VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_EMAIL=mailto:your-email@example.com
```

⚠️ **Important**: 
- Only `VITE_` prefixed variables are exposed to the browser
- Private key should NEVER be in VITE_ variables
- The private key will be used in Convex actions (server-side)

### Step 3: Install web-push in Convex (For Production)

Currently, the action is a scaffold. To make it work:

1. Add to your Convex project:
```bash
# In your convex directory
npm install web-push
```

2. Update `convex/pushNotificationsActions.ts` to uncomment the web-push code

### Step 4: Test the Implementation

1. **Start your dev server**:
```bash
npm run dev
```

2. **Open the test page**:
```
http://localhost:5173/tmp_rovodev_test_push_notifications.html
```

3. **Test steps**:
   - Click "Request Permission" → Allow notifications
   - Click "Register Service Worker"
   - Test each notification type
   - Check mobile behavior

### Step 5: Test on Mobile

**Android (Chrome):**
1. Deploy to Vercel or use ngrok for HTTPS
2. Open on mobile Chrome
3. Add to Home Screen for PWA experience
4. Lock screen and send test notifications

**iOS (Safari 16.4+):**
1. Requires HTTPS
2. Requires Add to Home Screen
3. Works in standalone mode only

## How It Works

### Message Flow:
1. User A sends message to User B
2. Backend: `convex/messages.ts` creates message
3. Backend: Calls `notifyNewMessage` mutation
4. Backend: Schedules `sendWebPushNotification` action
5. Action sends to all User B's devices
6. Service Worker receives push event
7. Shows notification with actions
8. User clicks → navigates to chat

### Call Flow:
1. User A initiates call to User B
2. Backend: `convex/videoCalls.ts` creates call
3. Backend: Calls `notifyIncomingCall` mutation
4. Backend: Sends high-priority push notification
5. Service Worker shows persistent notification
6. Service Worker sends PLAY_RINGTONE message to app
7. App plays ringtone
8. User clicks Answer/Decline
9. Service worker handles action and navigates

## Testing Without VAPID Keys

The current implementation will:
- ✅ Show browser notifications when app is open
- ✅ Register service worker
- ✅ Show test notifications
- ❌ Cannot send push when app is closed (needs VAPID)

## Mobile Testing Tips

### Test Scenarios:
1. **App open, focused**: Should see in-app notification + push
2. **App open, background tab**: Should see push notification
3. **App closed**: Should see push notification (with VAPID keys)
4. **Locked screen**: Should see notification on lock screen
5. **Do Not Disturb**: iOS respects DND, Android shows silently

### Notification Behavior:
- **Messages**: Regular priority, can be batched
- **Calls**: High priority, persistent, bypasses quiet hours
- **Matches**: Regular priority with celebration vibration

## Production Checklist

- [ ] Generate VAPID keys
- [ ] Add environment variables
- [ ] Install web-push in Convex
- [ ] Update pushNotificationsActions.ts
- [ ] Test on staging with HTTPS
- [ ] Test on real mobile devices
- [ ] Set up error monitoring for failed notifications
- [ ] Configure notification icons (high-res for Android)
- [ ] Add analytics for notification engagement

## Troubleshooting

### Notifications not showing:
1. Check permission: Should be "granted"
2. Check service worker: Should be "activated"
3. Check console for errors
4. Try test page to isolate issue

### Ringtone not playing:
1. Check browser autoplay policy
2. Ensure user has interacted with page first
3. Check audio file exists at `/notification.mp3`

### Mobile not working:
1. Ensure HTTPS (required for service workers)
2. Check mobile browser support
3. iOS: Must be added to home screen
4. Android: Should work in browser

## Next Steps

1. **Audio Files**: Replace `/notification.mp3` and `/ringtone.mp3` with actual audio
2. **Icons**: Create high-resolution notification icons
3. **Analytics**: Track notification open rates
4. **Rich Notifications**: Add images for profile pictures
5. **Notification Grouping**: Batch multiple messages from same person

