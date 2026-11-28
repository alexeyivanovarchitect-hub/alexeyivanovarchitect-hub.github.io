/* --- detailed brief: shows one questionnaire, collects answers into one message --- */
(function () {
  var form = document.getElementById('bf-form'); if (!form) return;
  var EN = document.documentElement.lang === 'en';
  var T = function (ru, en) { return EN ? en : ru; };
  var briefs = form.querySelectorAll('.bf-brief');
  function current() { var r = form.querySelector('input[name="bf-type"]:checked'); return r ? r.value : 'flat'; }
  function val(n) { var r = form.querySelector('input[name="' + n + '"]:checked'); return r ? r.value : ''; }
  function vals(n) { return Array.prototype.map.call(form.querySelectorAll('input[name="' + n + '"]:checked'), function (c) { return c.value; }); }
  function isFlat() { return val('e-type') === T('Квартира', 'Apartment'); }
  /* same rule as the home page form: which detailed questions fit this project */
  function kind() {
    if (isFlat()) return 'flat';
    var viz = vals('e-scope').some(function (v) { return v === T('Визуализации', 'Visualisations') || v === T('Анимация', 'Animation'); });
    var other = [T('Офис', 'Office'), T('Общественное пространство', 'Public space'), T('Другое', 'Other')].indexOf(val('e-type')) > -1;
    return viz && other ? 'anim' : 'house';
  }
  function setKind() {
    var k = kind(); each(form.querySelectorAll('input[name="bf-type"]'), function (r) { r.checked = r.value === k; });
    var pf = document.getElementById('e-pkg-field'), sf = document.getElementById('e-scope-field');
    /* the object type chosen above also picks the building type in the details, until the visitor changes it there */
    if (!form._htypeTouched) {
      var map = {}; map[T('Частный дом', 'Private house')] = 0; map[T('Гостиница', 'Hotel')] = 3; map[T('Ресторан или кафе', 'Restaurant or café')] = 5; map[T('Жилой комплекс', 'Residential complex')] = 7; map[T('Офис', 'Office')] = 8; map[T('Общественное пространство', 'Public space')] = 9;
      var idx = map[val('e-type')];
      each(form.querySelectorAll('input[name="house-htype"]'), function (c, i) { c.checked = i === idx; });
    }
    if (pf) pf.hidden = !isFlat(); var pn = document.getElementById('e-pkg-note'); if (pn) pn.hidden = !isFlat(); if (sf) sf.hidden = isFlat();
  }
  function pick(n, v) { each(form.querySelectorAll('input[name="' + n + '"]'), function (r) { r.checked = [].concat(v).indexOf(r.value) > -1; }); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  function sync() {
    var cur = current();
    each(briefs, function (b) { b.hidden = b.getAttribute('data-brief') !== cur; });
    each(form.querySelectorAll('[data-show]'), function (sec) {
      var p = sec.getAttribute('data-show').split(':'), boxes = form.querySelectorAll('input[name="' + p[0] + '"]');
      var want = p[1].split(','), on = false;
      each(boxes, function (c, i) { if (c.checked && want.indexOf(String(i)) > -1) on = true; });
      sec.hidden = !on;
    });
  }
  /* pick the questionnaire from ?t=flat|house|anim */
  var m = /[?&]t=(flat|house|anim)/.exec(location.search);
  if (m) {
    if (m[1] === 'flat') pick('e-type', T('Квартира', 'Apartment'));
    if (m[1] === 'house') pick('e-type', T('Частный дом', 'Private house'));
    if (m[1] === 'anim') { pick('e-type', T('Другое', 'Other')); pick('e-scope', T('Анимация', 'Animation')); }
  }
  /* continue from the 2-minute form on the home page: carry answers, open the details */
  var more = document.getElementById('bf-more');
  try {
    var c = JSON.parse(sessionStorage.getItem('briefCarry') || 'null');
    if (c) {
      sessionStorage.removeItem('briefCarry');
      [['bf-name', c.name], ['bf-contact', c.contact], ['bf-area', c.area], ['bf-task', c.task]].forEach(function (x) { var el = document.getElementById(x[0]); if (el && x[1] && !el.value) el.value = x[1]; });
      if (c.msg) pick('bf-msg', c.msg);
      if (c.type) pick('e-type', c.type);
      if (c.pkg) pick('e-pkg', c.pkg);
      if (c.scope && c.scope.length) pick('e-scope', c.scope);
      if (c.when) pick('e-when', c.when);
      if (more) more.open = true;
    }
  } catch (err) {}
  if (m && more) more.open = true;

  form.addEventListener('change', function (e) {
    var el = e.target;
    if (el.name && el.value === '__other' || (el.type === 'radio' && el.name)) {
      var other = form.querySelector('input[name="' + el.name + '-other"]');
      var oc = form.querySelector('input[name="' + el.name + '"][value="__other"]');
      if (other && oc) { other.hidden = !oc.checked; if (oc.checked && el === oc) other.focus(); }
    }
    var fs = el.closest('[data-max]');
    if (fs) {
      var on = fs.querySelectorAll('input[type="checkbox"]:checked');
      var over = on.length > 5; if (over) el.checked = false;
      var note = fs.querySelector('.bf-max'); if (note) note.hidden = !over && on.length < 5;
    }
    if (el.name === 'house-htype') form._htypeTouched = true;
    if (/^e-(type|scope)$/.test(el.name)) setKind();
    sync();
  });
  form.addEventListener('input', function (e) {
    var box = e.target.closest('[data-rooms]'); if (!box) return;
    var sum = 0; each(box.querySelectorAll('input[data-room]'), function (i) { var v = parseFloat(String(i.value).replace(',', '.')); if (!isNaN(v)) sum += v; });
    box.querySelector('[data-total]').textContent = (Math.round(sum * 10) / 10).toString().replace('.', T(',', '.'));
  });
  setKind(); sync();

  function answer(q) {
    if (q.hasAttribute('data-rooms')) {
      var parts = [];
      each(q.querySelectorAll('input[data-room]'), function (i) { if (i.value) parts.push(i.getAttribute('data-room') + ' ' + i.value); });
      if (!parts.length) return null;
      return parts.join(', ') + '. ' + T('Итого ', 'Total ') + q.querySelector('[data-total]').textContent + T(' м²', ' m²');
    }
    var inputs = q.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    if (inputs.length) {
      var vals = [];
      each(inputs, function (c) {
        if (!c.checked) return;
        if (c.value === '__other') { var o = form.querySelector('input[name="' + c.name + '-other"]'); vals.push(o && o.value ? o.value : T('другое', 'other')); }
        else vals.push(c.value);
      });
      return vals.length ? vals.join(', ') : null;
    }
    var f = q.querySelector('input, textarea');
    return f && f.value.trim() ? f.value.trim() : null;
  }
  function label(q) { var l = q.querySelector('.label'); return l ? l.textContent.trim() : ''; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('bf-name'), contact = document.getElementById('bf-contact');
    if (!name.value.trim() || !contact.value.trim()) { (name.value.trim() ? contact : name).focus(); name.reportValidity(); contact.reportValidity(); return; }
    var b = form.querySelector('.bf-brief[data-brief="' + current() + '"]');
    var area = document.getElementById('bf-area'), task = document.getElementById('bf-task');
    var no = T('не указано', 'not specified');
    var lines = [T('Заявка с сайта aivanovarchitect.com', 'Request from aivanovarchitect.com'),
      T('Имя: ', 'Name: ') + name.value.trim(),
      T('Контакт: ', 'Contact: ') + val('bf-msg') + ' ' + contact.value.trim(),
      T('Объект: ', 'Property: ') + (val('e-type') || no),
      isFlat() ? T('Пакет: ', 'Package: ') + (val('e-pkg') || T('не выбран', 'not chosen')) : T('Что нужно: ', 'Needed: ') + (vals('e-scope').join(', ') || no),
      T('Площадь: ', 'Area: ') + (area.value.trim() ? area.value.trim() + T(' м²', ' m²') : no),
      T('Сроки: ', 'Timeline: ') + (val('e-when') || no),
      T('Задача: ', 'Task: ') + (task.value.trim() || no)];
    var head = lines.length;
    var n = 0, answered = 0;
    each(b.querySelectorAll('.bf-sec'), function (sec) {
      if (sec.hidden) return; n++;
      var block = [];
      each(sec.querySelectorAll('[data-q]'), function (q) { var a = answer(q); if (a) { var lb = label(q); block.push('• ' + lb + (/[?.]$/.test(lb) ? ' ' : ': ') + a); answered++; } });
      if (block.length) { lines.push(''); lines.push(n + '. ' + (sec.querySelector('.bf-fold-title') || sec.querySelector('legend')).textContent.trim().toUpperCase()); lines = lines.concat(block); }
    });
    if (answered) lines.splice(head, 0, '', T('ПОДРОБНОСТИ', 'DETAILS') + ' · ' + b.getAttribute('data-title'));
    var text = lines.join('\n');
    document.getElementById('bf-out').textContent = text;
    document.getElementById('bf-after').hidden = false;
    document.getElementById('bf-wa').href = 'https://wa.me/79175704682?text=' + encodeURIComponent(text);
    document.getElementById('bf-tg').href = 'https://t.me/Leonardick_on?text=' + encodeURIComponent(text);
    document.getElementById('bf-mail').href = 'mailto:alexeyivanovarchitect@gmail.com?subject=' + encodeURIComponent(T('Заявка', 'Request') + ' · ' + b.getAttribute('data-title')) + '&body=' + encodeURIComponent(text);
    var dl = document.getElementById('bf-dl');
    try { if (dl._u) URL.revokeObjectURL(dl._u); dl._u = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); dl.href = dl._u; } catch (err) {}
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: T('', 'en-') + 'brief-submit-' + current(), title: T('Бриф собран', 'Brief built'), event: true }); } catch (err) {}
    document.getElementById('bf-after').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

/* fold the detailed sections: titles first, one opens on tap, answered count in each title */
(function () {
  var form = document.getElementById('bf-form'); if (!form) return;
  var EN = document.documentElement.lang === 'en';
  Array.prototype.forEach.call(form.querySelectorAll('.bf-brief .bf-sec'), function (sec) {
    var lg = sec.querySelector('legend'); if (!lg) return;
    sec.classList.add('bf-fold');
    var t = document.createElement('button'); t.type = 'button'; t.className = 'bf-fold-btn'; t.setAttribute('aria-expanded', 'false');
    t.innerHTML = '<span class="bf-fold-title"></span><span class="bf-fold-count muted"></span>';
    t.firstChild.textContent = lg.textContent.trim();
    lg.textContent = ''; lg.appendChild(t);
    t.addEventListener('click', function () { var o = sec.classList.toggle('open'); t.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  });
  function count() {
    Array.prototype.forEach.call(form.querySelectorAll('.bf-fold'), function (sec) {
      var qs = sec.querySelectorAll('[data-q]'), done = 0;
      Array.prototype.forEach.call(qs, function (q) {
        var on = q.querySelector('input[type="radio"]:checked, input[type="checkbox"]:checked');
        var txt = Array.prototype.some.call(q.querySelectorAll('input[type="text"], input:not([type]), input[inputmode], textarea'), function (i) { return i.value.trim(); });
        if (on || txt) done++;
      });
      var c = sec.querySelector('.bf-fold-count'); if (c) c.textContent = done ? (done + (EN ? ' of ' : ' из ') + qs.length) : '';
    });
  }
  form.addEventListener('change', count); form.addEventListener('input', count); count();
})();
