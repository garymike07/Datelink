// Service Worker for Push Notifications
/* eslint-disable no-restricted-globals */

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('Error parsing push data:', e);
    data = {
      title: 'New Notification',
      body: event.data.text(),
    };
  }

  const notificationType = data.type || 'default';
  const title = data.title || 'DateLink';
  
  // Configure notification options based on type
  let options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/logo.svg',
    badge: data.badge || '/favicon.svg',
    image: data.image,
    data: {
      ...data.data,
      type: notificationType,
      timestamp: Date.now(),
    },
    tag: data.tag || notificationType,
    vibrate: data.vibrate || [200, 100, 200],
    silent: data.silent || false,
  };

  // Special handling for different notification types
  if (notificationType === 'call_incoming') {
    // Incoming call - high priority with actions
    options.requireInteraction = true;
    options.vibrate = [500, 200, 500, 200, 500]; // Longer vibration for calls
    options.tag = 'incoming-call';
    options.actions = [
      { action: 'answer', title: '📞 Answer', icon: '/logo.svg' },
      { action: 'decline', title: '❌ Decline', icon: '/logo.svg' }
    ];
    // Play sound by sending message to client
    sendMessageToAllClients({ type: 'PLAY_RINGTONE', callId: data.data?.callId });
  } else if (notificationType === 'message') {
    // New message notification
    options.requireInteraction = false;
    options.tag = 'message-' + (data.data?.senderId || 'default');
    options.actions = [
      { action: 'reply', title: '💬 Reply', icon: '/logo.svg' },
      { action: 'view', title: '👁️ View', icon: '/logo.svg' }
    ];
    options.vibrate = [200, 100, 200];
  } else if (notificationType === 'match') {
    // New match notification
    options.requireInteraction = false;
    options.vibrate = [300, 100, 300];
    options.actions = [
      { action: 'view', title: '👋 Say Hi', icon: '/logo.svg' }
    ];
  } else if (data.priority === 'high') {
    options.requireInteraction = true;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Helper function to send messages to all clients
function sendMessageToAllClients(message) {
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  const notificationType = notificationData.type;
  
  event.notification.close();

  // Handle action buttons
  if (action) {
    handleNotificationAction(event, action, notificationData, notificationType);
    return;
  }

  // Default click behavior - open the app
  const urlToOpen = notificationData.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        
        // If we find a matching window, focus it
        if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
          return client.focus().then(() => {
            // Navigate to the URL if it's different
            if (client.url !== targetUrl.href) {
              return client.navigate(targetUrl.href);
            }
          });
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification action buttons
function handleNotificationAction(event, action, data, notificationType) {
  console.log('Notification action:', action, 'type:', notificationType);

  if (notificationType === 'call_incoming') {
    if (action === 'answer') {
      // Answer the call
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
          const url = data.url || `/chat/${data.matchId || data.callId}`;
          
          // Try to find existing window
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if ('focus' in client) {
              return client.focus().then(() => {
                client.postMessage({
                  type: 'ANSWER_CALL',
                  callId: data.callId,
                  matchId: data.matchId
                });
                return client.navigate(url);
              });
            }
          }
          
          // Open new window
          return clients.openWindow(url);
        })
      );
    } else if (action === 'decline') {
      // Decline the call
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
          clientList.forEach(client => {
            client.postMessage({
              type: 'DECLINE_CALL',
              callId: data.callId
            });
          });
        })
      );
    }
  } else if (notificationType === 'message') {
    if (action === 'reply' || action === 'view') {
      // Open chat/messages
      const url = data.url || `/messages`;
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if ('focus' in client) {
              return client.focus().then(() => client.navigate(url));
            }
          }
          return clients.openWindow(url);
        })
      );
    }
  } else {
    // Default action - open the URL
    const url = data.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
}

// Notification close event
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  
  const notificationData = event.notification.data || {};
  
  // If it's an incoming call that was dismissed, notify the app
  if (notificationData.type === 'call_incoming') {
    sendMessageToAllClients({
      type: 'CALL_NOTIFICATION_DISMISSED',
      callId: notificationData.callId
    });
  }
});

// Background sync (for offline support)
self.addEventListener('sync', function(event) {
  console.log('Background sync:', event);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Sync any pending notifications when back online
  console.log('Syncing notifications...');
  // Implementation would depend on your backend
}

// Message event - for communication with the main app
self.addEventListener('message', function(event) {
  console.log('Message received in SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});
