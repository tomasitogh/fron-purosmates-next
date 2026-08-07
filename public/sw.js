self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Puros Mates';
  const options = {
    body: data.body || 'Nueva venta registrada',
    icon: '/logo-purosmates.png',
    badge: '/logo-purosmates.png',
    vibrate: [200, 100, 200],
    tag: 'new-sale',
    renotify: true,
    data: {
      url: data.url || '/admin',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url || '/admin'));
});
