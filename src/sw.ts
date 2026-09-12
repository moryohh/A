/// <reference lib="webworker" />

import {cleanupOutdatedCaches, precacheAndRoute} from 'workbox-precaching';
import {CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import {registerRoute} from 'workbox-routing';

const serviceWorker = self as unknown as ServiceWorkerGlobalScope;
const appBaseUrl = new URL('./', serviceWorker.registration.scope || serviceWorker.location.href);
const appAsset = (name: string) => new URL(name, appBaseUrl).toString();
const appRelease = 'map-scroll-return-20260912';

precacheAndRoute((self as unknown as {__WB_MANIFEST: Array<{revision: string | null; url: string}>}).__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({url}) => /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname),
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({statuses: [0, 200]}),
      new ExpirationPlugin({maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365}),
    ],
  }),
);

registerRoute(
  ({request, url}) =>
    request.method === 'GET' &&
    url.origin === serviceWorker.location.origin &&
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'image-assets',
    plugins: [
      new CacheableResponsePlugin({statuses: [0, 200]}),
      new ExpirationPlugin({maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30}),
    ],
  }),
);

serviceWorker.addEventListener('install', () => {
  serviceWorker.skipWaiting();
});

serviceWorker.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      serviceWorker.clients.claim(),
      serviceWorker.registration.update(),
      Promise.resolve(appRelease),
    ]),
  );
});

serviceWorker.addEventListener('push', (event) => {
  let data: {title?: string; body?: string; icon?: string; url?: string} = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = {body: event.data?.text() ?? ''};
  }

  const title = data.title || 'منصة نحن معك';
  const options: NotificationOptions = {
    body: data.body || 'لديك إشعار جديد',
    icon: data.icon || appAsset('pwa-192x192.png'),
    badge: appAsset('pwa-192x192.png'),
    dir: 'rtl',
    lang: 'ar',
    data: {url: data.url || appBaseUrl.toString()},
  };

  event.waitUntil(serviceWorker.registration.showNotification(title, options));
});

serviceWorker.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = String(event.notification.data?.url || appBaseUrl.toString());
  event.waitUntil(
    serviceWorker.clients.matchAll({type: 'window', includeUncontrolled: true}).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (existing && 'focus' in existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      }
      return serviceWorker.clients.openWindow(targetUrl);
    }),
  );
});
