'use strict';

const CACHE_PREFIX = 'vitrineverse-';
const CACHE_NAME = `${CACHE_PREFIX}shell-v2-20260830`;
const OFFLINE_DOCUMENT = './index.html';

const SHELL_URLS = [
  './',
  './index.html',
  './styles.css',
  './js/game-data.js',
  './js/app.js',
  './manifest.webmanifest',
  './preview/vitrineverse.png',
  './assets/items/alien_plush.svg',
  './assets/items/arcade_cart.svg',
  './assets/items/comic_stack.svg',
  './assets/items/crypt_keeper.svg',
  './assets/items/cryptic_portrait.svg',
  './assets/items/holo_crystal.svg',
  './assets/items/kage_mask.svg',
  './assets/items/mecha_pit_drone.svg',
  './assets/items/mecha_scout.svg',
  './assets/items/moon_diorama.svg',
  './assets/items/multiverse_issue_zero.svg',
  './assets/items/neon_ronin.svg',
  './assets/items/night_13_ticket.svg',
  './assets/items/nova_controller.svg',
  './assets/items/orbit_guardian.svg',
  './assets/items/perigee_probe.svg',
  './assets/items/pinboard.svg',
  './assets/items/pixel_knight.svg',
  './assets/items/pixel_mage.svg',
  './assets/items/plasma_blaster.svg',
  './assets/items/plasma_scanner.svg',
  './assets/items/portal_badge.svg',
  './assets/items/retro_console.svg',
  './assets/items/robot_dog.svg',
  './assets/items/spellbook.svg',
  './assets/items/star_helmet.svg',
  './assets/items/synth_orb.svg',
  './assets/items/vhs_night.svg',
  './assets/items/void_cat.svg',
  './assets/items/void_moth.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.searchParams.has('__network_probe')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (
          await caches.match(request, { ignoreSearch: true })
          || await caches.match(OFFLINE_DOCUMENT)
          || await caches.match('./')
          || new Response('VITRINE//VERSE est indisponible hors ligne.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          })
        ))
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
