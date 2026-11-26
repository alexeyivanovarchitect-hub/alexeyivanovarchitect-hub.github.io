/* --- detailed brief: shows one questionnaire, collects answers into one message --- */
(function () {
  var form = document.getElementById('bf-form'); if (!form) return;
  var EN = document.documentElement.lang === 'en';
  var T = function (ru, en) { return EN ? en : ru; };
  var briefs = form.querySelectorAll('.bf-brief');
  function current() { var r = form.querySelector('input[name="bf-type"]:checked'); return r ? r.value : 'flat'; }
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
  if (m) each(form.querySelectorAll('input[name="bf-type"]'), function (r) { r.checked = r.value === m[1]; });

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
    sync();
  });
  form.addEventListener('input', function (e) {
    var box = e.target.closest('[data-rooms]'); if (!box) return;
    var sum = 0; each(box.querySelectorAll('input[data-room]'), function (i) { var v = parseFloat(String(i.value).replace(',', '.')); if (!isNaN(v)) sum += v; });
    box.querySelector('[data-total]').textContent = (Math.round(sum * 10) / 10).toString().replace('.', T(',', '.'));
  });
  sync();

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
    var lines = [T('Подробный бриф с сайта aivanovarchitect.com', 'Detailed brief from aivanovarchitect.com'), b.getAttribute('data-title'),
      T('Имя: ', 'Name: ') + name.value.trim(),
      T('Контакт: ', 'Contact: ') + (form.querySelector('input[name="bf-msg"]:checked') || {}).value + ' ' + contact.value.trim()];
    var n = 0, answered = 0;
    each(b.querySelectorAll('.bf-sec'), function (sec) {
      if (sec.hidden) return; n++;
      var block = [];
      each(sec.querySelectorAll('[data-q]'), function (q) { var a = answer(q); if (a) { var lb = label(q); block.push('• ' + lb + (/[?.]$/.test(lb) ? ' ' : ': ') + a); answered++; } });
      if (block.length) { lines.push(''); lines.push(n + '. ' + sec.querySelector('legend').textContent.trim().toUpperCase()); lines = lines.concat(block); }
    });
    if (!answered) { lines.push(''); lines.push(T('Ответов пока нет, обсудим при созвоне.', 'No answers yet, we will discuss on a call.')); }
    var text = lines.join('\n');
    document.getElementById('bf-out').textContent = text;
    document.getElementById('bf-after').hidden = false;
    document.getElementById('bf-wa').href = 'https://wa.me/79175704682?text=' + encodeURIComponent(text);
    document.getElementById('bf-tg').href = 'https://t.me/Leonardick_on?text=' + encodeURIComponent(text);
    document.getElementById('bf-mail').href = 'mailto:alexeyivanovarchitect@gmail.com?subject=' + encodeURIComponent(T('Подробный бриф', 'Detailed brief') + ' · ' + b.getAttribute('data-title')) + '&body=' + encodeURIComponent(text);
    var dl = document.getElementById('bf-dl');
    try { if (dl._u) URL.revokeObjectURL(dl._u); dl._u = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); dl.href = dl._u; } catch (err) {}
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: T('', 'en-') + 'brief-submit-' + current(), title: T('Бриф собран', 'Brief built'), event: true }); } catch (err) {}
    document.getElementById('bf-after').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
