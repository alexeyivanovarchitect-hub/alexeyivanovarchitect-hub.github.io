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
