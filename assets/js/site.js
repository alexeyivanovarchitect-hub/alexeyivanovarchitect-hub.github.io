/* language helper: pages with <html lang="en"> get English UI strings */
var EN_UI = document.documentElement.lang === 'en';
function L(ru, en) { return EN_UI ? en : ru; }
/* Aleksei Ivanov, site scripts. No dependencies. Works in old Safari (no optional chaining). */
(function () {
  var root = document.documentElement;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* --- theme: system / light / dark --- */
  var theme = store('ai-theme');
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  var themeBtn = document.querySelector('[data-toggle-theme]');
  function themeLabel() {
    var t = root.getAttribute('data-theme');
    themeBtn.textContent = t === 'dark' ? L('Тема: тёмная','Theme: dark') : t === 'light' ? L('Тема: светлая','Theme: light') : L('Тема: как в системе','Theme: system');
  }
  if (themeBtn) {
    themeLabel();
    themeBtn.addEventListener('click', function () {
      var t = root.getAttribute('data-theme');
      var next = !t ? 'light' : t === 'light' ? 'dark' : null;
      if (next) root.setAttribute('data-theme', next); else root.removeAttribute('data-theme');
      store('ai-theme', next);
      themeLabel();
    });
  }

  /* --- simplified mode: no motion, quieter images --- */
  if (store('ai-simple') === '1') root.classList.add('simple');
  var simpleBtn = document.querySelector('[data-toggle-simple]');
  function simpleLabel() {
    var on = root.classList.contains('simple');
    simpleBtn.textContent = L('Упрощённый режим: ','Simplified mode: ') + (on ? L('вкл','on') : L('выкл','off'));
    simpleBtn.setAttribute('aria-pressed', String(on));
  }
  if (simpleBtn) {
    simpleLabel();
    simpleBtn.addEventListener('click', function () {
      root.classList.toggle('simple');
      store('ai-simple', root.classList.contains('simple') ? '1' : null);
      simpleLabel();
    });
  }

  /* --- grid overlay for development: open the page with #grid --- */
  if (location.hash === '#grid') root.classList.add('show-grid');

  /* --- mobile menu --- */
  var menuBtn = document.querySelector('.menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      var open = mobileNav.hidden;
      mobileNav.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? L('Закрыть','Close') : L('Меню','Menu');
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { mobileNav.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = L('Меню','Menu'); }
    });
  }

  /* --- copy helper with fallback to text selection --- */
  function selectNode(node) {
    var range = document.createRange(); range.selectNodeContents(node);
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  }
  function copy(text, node, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { selectNode(node); done(false); });
    } else { selectNode(node); done(false); }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function () {
      var node = document.getElementById(btn.getAttribute('data-copy'));
      var label = btn.textContent;
      copy(node.textContent.trim(), node, function (ok) {
        btn.textContent = ok ? L('Скопировано','Copied') : L('Выделено','Selected');
        setTimeout(function () { btn.textContent = label; }, 1800);
      });
    });
  });

  /* --- service buttons preselect the brief --- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-brief-type]'), function (a) {
    a.addEventListener('click', function () {
      var want = a.getAttribute('data-brief-type');
      Array.prototype.forEach.call(document.querySelectorAll('input[name="type"]'), function (r) { r.checked = r.value === want; });
    });
  });

  /* --- brief: builds the request text; delivery is copy or e-mail.
         Later: replace sendRequest() with a Telegram bot or a form service. --- */
  var form = document.getElementById('brief-form');
  if (form) {
    var out = document.getElementById('brief-out');
    var after = document.getElementById('brief-after');
    var mail = document.getElementById('brief-mail');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var text = [
        L('Заявка с сайта aivanovarchitect.com','Request from aivanovarchitect.com'),
        L('Имя: ','Name: ') + f['name'].value,
        L('Контакт: ','Contact: ') + ((form.querySelector('input[name="messenger"]:checked') || {}).value || '') + ' ' + f['contact'].value,
        L('Объект: ','Property: ') + ((form.querySelector('input[name="type"]:checked') || {}).value || L('не указано','not specified')),
        L('Что нужно: ','Needed: ') + (Array.prototype.map.call(form.querySelectorAll('input[name="scope"]:checked'), function (c) { return c.value; }).join(', ') || L('не указано','not specified')),
        L('Площадь: ','Area: ') + (f['area'].value ? f['area'].value + ' м²' : L('не указана','not specified')),
        L('Задача и сроки: ','Task and timeline: ') + (f['task'].value || L('не указано','not specified'))
      ].join('\n');
      out.textContent = text;
      after.hidden = false;
      var wa = document.getElementById('brief-wa');
      if (wa) wa.href = 'https://wa.me/79175704682?text=' + encodeURIComponent(text);
      var tg = document.getElementById('brief-tg');
      if (tg) tg.href = 'https://t.me/Leonardick_on?text=' + encodeURIComponent(text);
      mail.href = 'mailto:alexeyivanovarchitect@gmail.com?subject=' + encodeURIComponent(L('Заявка на проект','Project request')) + '&body=' + encodeURIComponent(text);
      after.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
})();

/* --- full-screen viewer for photos and drawings --- */
(function () {
  var imgs = Array.prototype.filter.call(document.querySelectorAll('main figure img'), function (i) { return !i.closest('.index-row'); });
  if (!imgs.length) return;
  var box = document.createElement('div');
  box.className = 'lb'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.innerHTML = '<img class="lb-img" alt=""><p class="lb-cap label"></p>' +
    '<button class="lb-btn lb-close" type="button" aria-label="' + L('Закрыть','Close') + '">×</button>' +
    '<button class="lb-btn lb-prev" type="button" aria-label="' + L('Предыдущее','Previous') + '">‹</button>' +
    '<button class="lb-btn lb-next" type="button" aria-label="' + L('Следующее','Next') + '">›</button>';
  document.body.appendChild(box);
  var big = box.querySelector('.lb-img'), cap = box.querySelector('.lb-cap'), cur = 0, last = null;
  function show(i) {
    cur = (i + imgs.length) % imgs.length;
    var im = imgs[cur], fc = im.closest('figure').querySelector('figcaption');
    big.src = im.currentSrc || im.src; big.alt = im.alt;
    big.className = 'lb-img' + (im.closest('.drawing, .fit') ? ' lb-paper' : '');
    cap.textContent = fc ? fc.textContent : im.alt;
  }
  function open(i) { last = document.activeElement; show(i); box.hidden = false; document.documentElement.style.overflow = 'hidden'; box.querySelector('.lb-close').focus(); }
  function close() { box.hidden = true; document.documentElement.style.overflow = ''; if (last) last.focus(); }
  imgs.forEach(function (im, i) {
    im.style.cursor = 'zoom-in'; im.setAttribute('tabindex', '0');
    im.addEventListener('click', function () { open(i); });
    im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
  });
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(cur - 1); });
  box.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(cur + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
  });
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
})();

(function () {
  Array.prototype.forEach.call(document.querySelectorAll('[data-calc]'), function (box) {
    var inp = box.querySelector('input'), out = box.querySelector('[data-calc-out]'), out2 = box.querySelector('[data-calc-out2]'), out3 = box.querySelector('[data-calc-out3]'), rate3 = parseFloat(box.getAttribute('data-rate3')) || 0;
    var rate = parseFloat(box.getAttribute('data-rate')) || 10, rate2 = parseFloat(box.getAttribute('data-rate2')) || 0, en = box.getAttribute('data-lang') === 'en';
    function fmt(a, r) { var sum = Math.round(a * r).toLocaleString(en ? 'en-US' : 'ru-RU'), rr = r.toLocaleString(en ? 'en-US' : 'ru-RU'); return a ? (en ? 'from $' + sum : 'от ' + sum + ' $') : (en ? 'from $' + rr + '/m²' : 'от ' + rr + ' $/м²'); }
    var rub = 83;
    function rubTxt(a, r) { return a && !en ? '<span class="rub">≈ ' + (Math.round(a * r * rub / 100) * 100).toLocaleString('ru-RU') + ' ₽</span>' : ''; }
    function put(el, a, r) { if (el && r) el.innerHTML = fmt(a, r) + rubTxt(a, r); }
    function upd() {
      var a = Math.max(0, Math.round(parseFloat(inp.value) || 0));
      put(out, a, rate); put(out2, a, rate2); put(out3, a, rate3);
    }
    if (!en && window.fetch) fetch('https://www.cbr-xml-daily.ru/daily_json.js').then(function (r) { return r.json(); }).then(function (d) { if (d && d.Valute && d.Valute.USD) { rub = d.Valute.USD.Value; upd(); } }).catch(function () {});
    inp.addEventListener('input', upd); upd();
  });
})();

/* --- package chosen on the service page prefills the brief --- */
(function () {
  var form = document.getElementById('brief-form'); if (!form) return;
  var m = /[?&]pkg=([^&#]+)/.exec(location.search); if (!m) return;
  var pkg = decodeURIComponent(m[1]), en = document.documentElement.lang === 'en';
  var t = form.querySelector('input[name="type"][value="' + (en ? 'Apartment' : 'Квартира') + '"]'); if (t) t.checked = true;
  var task = form.elements['task']; if (task && !task.value) task.value = (en ? 'Package ' + pkg + '. ' : 'Пакет «' + pkg + '». ');
})();

/* package cards: tap or click highlights the card */
(function () {
  var cards = document.querySelectorAll('.pkg-card');
  cards.forEach(function (c) {
    c.addEventListener('click', function () {
      cards.forEach(function (o) { o.classList.toggle('is-active', o === c); });
    });
  });
})();

/* --- art catalogue filter --- */
(function () {
  var grid = document.querySelector('[data-art]'); if (!grid) return;
  var btns = document.querySelectorAll('[data-art-filter]');
  Array.prototype.forEach.call(btns, function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-art-filter');
      Array.prototype.forEach.call(btns, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var head = null, seen = false;
      Array.prototype.forEach.call(grid.children, function (li) {
        if (li.classList.contains('art-group')) { if (head) head.hidden = !seen; head = li; seen = false; return; }
        li.hidden = f !== 'all' && li.getAttribute('data-type') !== f; if (!li.hidden) seen = true;
      });
      if (head) head.hidden = !seen;
    });
  });
})();

/* --- art: ruble prices by the Central Bank of Russia rate --- */
(function () {
  var spans = document.querySelectorAll('[data-usd]'); if (!spans.length || !window.fetch) return;
  fetch('https://www.cbr-xml-daily.ru/daily_json.js').then(function (r) { return r.json(); }).then(function (d) {
    var rate = d && d.Valute && d.Valute.USD && d.Valute.USD.Value; if (!rate) return;
    Array.prototype.forEach.call(spans, function (s) {
      var v = Math.round(parseFloat(s.getAttribute('data-usd')) * rate / 100) * 100;
      s.textContent = '≈ ' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
    });
    var dt = new Date(d.Date), el = document.querySelector('[data-rub-date]');
    if (el && !isNaN(dt)) el.textContent = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'][dt.getMonth()] + ' ' + dt.getFullYear();
  }).catch(function () {});
})();

/* --- art: keep the sketchbook badge on the drawing's own bottom right corner --- */
(function () {
  var badges = document.querySelectorAll('.art-sb-badge'); if (!badges.length) return;
  function place() {
    Array.prototype.forEach.call(badges, function (b) {
      var img = b.parentNode.querySelector('img'); if (!img || !img.naturalWidth) return;
      var bw = img.clientWidth, bh = img.clientHeight, r = img.naturalWidth / img.naturalHeight;
      var w = Math.min(bw, bh * r), h = Math.min(bh, bw / r);
      b.style.right = (bw - w + 8) + 'px'; b.style.bottom = '8px';
    });
  }
  Array.prototype.forEach.call(badges, function (b) { var i = b.parentNode.querySelector('img'); if (i) i.addEventListener('load', place); });
  window.addEventListener('resize', place); place();
})();

/* --- art: open the sketchbook video at the moment of the work --- */
(function () {
  var links = document.querySelectorAll('[data-sb]'); if (!links.length) return;
  var box = null, vid = null, last = null;
  function close() { if (!box) return; vid.pause(); vid.removeAttribute('src'); vid.load(); box.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); }
  function open(src, t) {
    if (!box) {
      box = document.createElement('div'); box.className = 'sb-modal'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
      box.innerHTML = '<button class="sb-close" type="button" aria-label="Close">×</button><video controls playsinline preload="metadata"></video>';
      document.body.appendChild(box); vid = box.querySelector('video');
      box.addEventListener('click', function (e) { if (e.target === box) close(); });
      box.querySelector('.sb-close').addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && !box.hidden) close(); });
    }
    box.hidden = false; document.body.style.overflow = 'hidden';
    vid.src = src + '#t=' + t;
    vid.addEventListener('loadedmetadata', function f() { vid.removeEventListener('loadedmetadata', f); try { vid.currentTime = t; } catch (e) {} var p = vid.play(); if (p && p.catch) p.catch(function () {}); });
    box.querySelector('.sb-close').focus();
  }
  Array.prototype.forEach.call(links, function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); last = a; open(a.getAttribute('data-sb'), parseFloat(a.getAttribute('data-t')) || 0); });
  });
})();
