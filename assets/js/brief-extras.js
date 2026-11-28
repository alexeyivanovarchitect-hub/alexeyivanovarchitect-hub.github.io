/* Brief forms: keep answers while filling, send in one tap, count where people stop */
(function () {
  var EN = document.documentElement.lang === 'en';
  function each(l, f) { Array.prototype.forEach.call(l, f); }
  function ev(path, title) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: (EN ? 'en-' : '') + path, title: title || path, event: true }); } catch (e) {} }
  [{ id: 'brief-form', key: 'aiBriefMain', after: 'brief-after', wa: 'brief-wa', tg: 'brief-tg', tag: 'form' },
   { id: 'bf-form', key: 'aiBriefFull', after: 'bf-after', wa: 'bf-wa', tg: 'bf-tg', tag: 'brief' }].forEach(function (c) {
    var form = document.getElementById(c.id); if (!form) return;
    var KEY = c.key + (EN ? '-en' : '');
    /* 1. autosave: answers survive a reload of the in-app browser until the request is sent */
    function save() {
      var d = {};
      each(form.querySelectorAll('input, textarea'), function (el) {
        if (!el.name || el.type === 'hidden' || el.type === 'button' || el.type === 'submit') return;
        if (el.type === 'radio' || el.type === 'checkbox') { if (el.checked) (d[el.name] = d[el.name] || []).push(el.value); else if (!(el.name in d)) d[el.name] = []; }
        else if (el.value) d[el.name] = el.value;
      });
      var more = form.querySelector('details'); if (more) d.__more = more.open;
      try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
    }
    var carried = false; try { carried = !!sessionStorage.getItem('briefCarry'); } catch (e) {}
    var saved = null; try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (saved && !carried && !/[?&]t=/.test(location.search) && Date.now() - saved.t < 30 * 864e5) {
      var d = saved.d || {};
      each(form.querySelectorAll('input, textarea'), function (el) {
        if (!el.name || !(el.name in d)) return;
        if (el.type === 'radio' || el.type === 'checkbox') el.checked = d[el.name].indexOf(el.value) > -1;
        else if (!el.value) el.value = d[el.name];
      });
      var more = form.querySelector('details'); if (more && d.__more) more.open = true;
      each(form.querySelectorAll('.bf-other'), function (o) { var oc = form.querySelector('input[name="' + o.name.replace(/-other$/, '') + '"][value="__other"]'); if (oc) o.hidden = !oc.checked; });
      /* let the page scripts re-apply their logic (package or scope, detailed questions, counters) */
      var any = form.querySelector('input[type="radio"]:checked, input[type="checkbox"]:checked');
      if (any) any.dispatchEvent(new Event('change', { bubbles: true }));
      var txt = form.querySelector('textarea, input:not([type])'); if (txt) txt.dispatchEvent(new Event('input', { bubbles: true }));
      if (window.briefSync) window.briefSync();
    }
    form.addEventListener('input', save); form.addEventListener('change', save);
    /* 3. where people stop: started, opened details, opened a section, sent */
    var started = false;
    form.addEventListener('input', function () { if (!started) { started = true; ev(c.tag + '-start', 'Started filling'); } });
    form.addEventListener('change', function () { if (!started) { started = true; ev(c.tag + '-start', 'Started filling'); } });
    each(form.querySelectorAll('.bf-fold-btn'), function (b) {
      b.addEventListener('click', function () { var t = b.querySelector('.bf-fold-title'); if (b.getAttribute('aria-expanded') === 'true') ev(c.tag + '-open-' + (t ? t.textContent.trim() : 'section'), 'Section opened'); });
    });
    /* 2. one tap: the button itself sends to WhatsApp or Telegram */
    var after = document.getElementById(c.after);
    var msgName = c.id === 'brief-form' ? 'messenger' : 'bf-msg';
    form.addEventListener('submit', function (e) {
      if (after) after.hidden = true;
      /* the button pressed tells which channel the visitor uses, the message says so */
      var how = e.submitter && e.submitter.getAttribute('data-send');
      var v = how === 'tg' ? 'Telegram' : how === 'mail' ? (EN ? 'Email' : 'Почта') : how === 'wa' ? 'WhatsApp' : null;
      if (v) each(form.querySelectorAll('input[name="' + msgName + '"]'), function (r) { r.checked = r.value === v; });
    }, true);
    form.addEventListener('submit', function (e) {
      var how = e.submitter && e.submitter.getAttribute('data-send'); if (!how) return;
      setTimeout(function () {
        if (!after || after.hidden) return;
        ev(c.tag + '-send-' + how, 'Sent');
        try { localStorage.removeItem(KEY); } catch (err) {}
        if (how === 'mail') {
          /* mail app opens with the request; the ready text, copy button and address stay on screen in case it does not */
          var m = document.getElementById(c.id === 'brief-form' ? 'brief-mail' : 'bf-mail');
          after.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (m && m.href && !/#$/.test(m.href)) location.href = m.href;
          return;
        }
        var a = document.getElementById(how === 'tg' ? c.tg : c.wa); if (!a || !a.href || /#$/.test(a.href)) return;
        /* same tab, like an ordinary link: in-app browsers hand wa.me and t.me to the app reliably this way */
        location.href = a.href;
      }, 0);
    });
  });
})();
