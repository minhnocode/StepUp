/* Service Worker — Nhật ký (PWA)
   - Cache "vỏ" app + icon để mở offline.
   - Trang HTML: ưu tiên mạng (để tự cập nhật), offline thì lấy bản đã lưu.
   - KHÔNG đụng tới API Google Sheet (khác origin) — để mạng lo, dữ liệu vẫn ở Sheet của bạn.
*/
const CACHE = 'nhatky-v3';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return; // API Sheet / ảnh Drive: để mạng xử lý

  if (req.mode === 'navigate') {
    // Trang app: mạng trước, lỗi mạng thì lấy bản cache
    e.respondWith(
      fetch(req).then(r => {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match('./')))
    );
    return;
  }
  // Tài nguyên tĩnh: cache trước, thiếu thì tải mạng rồi cache lại
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      const cp = res.clone();
      caches.open(CACHE).then(c => c.put(req, cp));
      return res;
    }))
  );
});
