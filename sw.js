/* Studio La Griff: funcionamento como aplicativo e sem internet.
   A página e os arquivos ficam guardados no aparelho; os dados vêm do Supabase. */
const VERSAO = '6f9455a252';
const CACHE = 'lagriff-' + VERSAO;
const SUPA = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const BASE = ['./', './index.html', './config.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', SUPA];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('lagriff-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.hostname.endsWith('supabase.co') || u.hostname.endsWith('supabase.in')) return;   // dados: sempre direto do banco
  // página e configuração: primeiro a internet (versão nova), sem internet a cópia guardada
  if (r.mode === 'navigate' || (u.origin === location.origin && /\/(index\.html|config\.js)?$/.test(u.pathname) && !u.pathname.endsWith('/sw.js'))) {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(r.mode === 'navigate' ? './' : r, c)); } return res; })
      .catch(() => caches.match(r).then(x => x || caches.match('./'))));
    return;
  }
  // demais arquivos (ícones, biblioteca, fontes): a cópia guardada, atualizada em segundo plano
  if (u.origin === location.origin || u.href === SUPA || u.hostname.endsWith('fonts.googleapis.com') || u.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(r).then(x => {
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); } return res; }).catch(() => x);
      return x || net;
    }));
  }
});
