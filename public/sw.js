importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Obtener parámetros de configuración pasados al registrar el service worker
const urlParams = new URL(location).searchParams;
const apiKey = urlParams.get('apiKey');
const projectId = urlParams.get('projectId');
const messagingSenderId = urlParams.get('messagingSenderId');
const appId = urlParams.get('appId');

const firebaseConfig = {
  apiKey: apiKey || '',
  projectId: projectId || '',
  messagingSenderId: messagingSenderId || '',
  appId: appId || '',
};

if (firebase.apps.length === 0 && firebaseConfig.apiKey) {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.warn('[SW] Error al inicializar firebase compat:', err);
  }
}

let messaging = null;
try {
  if (firebase.messaging && firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
} catch (e) {
  console.warn('[SW] Firebase messaging no soportado:', e);
}

// Handler de mensajes en segundo plano
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Mensaje push recibido en background:', payload);

    // Si viene solo data (sin notification), mostramos la notificación manualmente
    if (!payload.notification && payload.data) {
      const title = payload.data.title || 'Puros Mates';
      const options = {
        body: payload.data.body || '',
        icon: payload.data.icon || '/favicon.ico',
        badge: '/favicon.ico',
        data: payload.data,
      };
      self.registration.showNotification(title, options);
    }
  });
}

// Click en la notificación: hace foco en la pestaña o abre la URL correspondiente
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || event.notification.data?.link || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
