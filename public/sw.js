// Enables mobile notification display; scheduling still runs only in the open app.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const client = clients.find(c => new URL(c.url).origin === self.location.origin);
    if (client) return client.focus();
    return self.clients.openWindow('/');
  })());
});
