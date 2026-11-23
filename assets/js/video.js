/* High-quality video split into parts, joined seamlessly with Media Source Extensions.
   <video data-parts="a.mp4,b.mp4" data-mime='video/mp4; codecs="..."' data-fallback="lite.mp4">
   Browsers without MSE get the single-file fallback. No dependencies, old-Safari safe. */
(function () {
  var MS = window.ManagedMediaSource || window.MediaSource;
  function base(v) { return v.getAttribute('data-base') || ''; }
  function fallback(v) {
    var f = v.getAttribute('data-fallback');
    if (f) { v.src = base(v) + f; return; }
    var fig = v.parentNode, p = document.createElement('p');
    var ru = (document.documentElement.lang || 'ru').indexOf('en') !== 0;
    p.className = 'label muted';
    p.textContent = ru ? 'Этот браузер не воспроизводит видео. Откройте его по QR-коду ниже.' : 'This browser cannot play the video. Open it via the QR code below.';
    fig.appendChild(p);
  }
  function setup(v) {
    var parts = (v.getAttribute('data-parts') || '').split(',').filter(Boolean);
    var mime = v.getAttribute('data-mime');
    if (!parts.length) { fallback(v); return; }
    if (parts.length === 1 || !MS || !mime || !MS.isTypeSupported || !MS.isTypeSupported(mime)) {
      if (parts.length === 1) { v.src = base(v) + parts[0]; } else { fallback(v); }
      return;
    }
    var ms = new MS();
    var started = false;
    if (window.ManagedMediaSource && MS === window.ManagedMediaSource) { v.disableRemotePlayback = true; }
    v.src = URL.createObjectURL(ms);
    ms.addEventListener('sourceopen', function () {
      var sb;
      try { sb = ms.addSourceBuffer(mime); } catch (e) { fallback(v); return; }
      var i = 0;
      function next() {
        if (i >= parts.length) {
          if (ms.readyState === 'open') { try { ms.endOfStream(); } catch (e) {} }
          return;
        }
        fetch(base(v) + parts[i]).then(function (r) {
          if (!r.ok) { throw new Error('HTTP ' + r.status); }
          return r.arrayBuffer();
        }).then(function (buf) {
          i += 1;
          sb.addEventListener('updateend', function once() { sb.removeEventListener('updateend', once); next(); });
          sb.appendBuffer(buf);
        }).catch(function () { v.removeAttribute('src'); fallback(v); v.load(); });
      }
      function start() { if (started) { return; } started = true; next(); }
      v.addEventListener('play', start);
      if (v.hasAttribute('data-eager')) { start(); }
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('video[data-parts]'), setup);
})();
