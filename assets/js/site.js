(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');

  if (menuButton && nav) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', menuButton.dataset.labelClosed || 'Open menu');
      nav.classList.remove('is-open');
    };

    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? (menuButton.dataset.labelOpen || 'Close menu') : (menuButton.dataset.labelClosed || 'Open menu'));
      nav.classList.toggle('is-open', open);
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const dialog = document.querySelector('#image-dialog');
  const dialogImage = document.querySelector('#image-dialog__image');
  const dialogCaption = document.querySelector('#image-dialog__caption');

  if (dialog && dialogImage && typeof dialog.showModal === 'function') {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-lightbox]');
      if (!link) return;
      event.preventDefault();
      const image = link.querySelector('img');
      dialogImage.src = link.href;
      dialogImage.alt = link.dataset.alt || image?.alt || '';
      dialogCaption.textContent = link.dataset.alt || image?.alt || '';
      setZoom(false);
      dialog.showModal();
    });

    // Drawings stay complete in the viewer; zoom shows the full-resolution file at native size with scrolling.
    const zoomButton = dialog.querySelector('[data-dialog-zoom]');
    function setZoom(on) {
      dialog.classList.toggle('is-zoomed', on);
      if (zoomButton) zoomButton.setAttribute('aria-pressed', String(on));
    }
    if (zoomButton) zoomButton.addEventListener('click', () => setZoom(!dialog.classList.contains('is-zoomed')));
    dialogImage.addEventListener('click', () => setZoom(!dialog.classList.contains('is-zoomed')));

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', () => {
      setZoom(false);
      dialogImage.removeAttribute('src');
      dialogCaption.textContent = '';
    });
  }

  document.querySelectorAll('[data-autoplay-video]').forEach((video) => {
    const source = video.querySelector('source[data-src]');
    const fallback = video.parentElement?.querySelector('[data-video-fallback]');
    if (!source) return;

    const revealFallback = () => {
      if (fallback) fallback.hidden = false;
    };
    video.addEventListener('error', revealFallback);
    video.muted = true;

    const loadAndPlay = () => {
      if (source.dataset.loaded === 'true') return;
      source.dataset.loaded = 'true';
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
      video.addEventListener('canplay', () => {
        video.play().catch(revealFallback);
      }, { once: true });
      video.load();
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadAndPlay();
          observer.disconnect();
        }
      }, { rootMargin: '320px 0px' });
      observer.observe(video);
    } else {
      loadAndPlay();
    }
  });

  const quoteForm = document.querySelector('[data-quote-form]');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const locale = document.documentElement.lang === 'ru' ? 'ru' : 'en';
      const labels = locale === 'ru'
        ? { name: 'Имя', email: 'Электронная почта', scope: 'Состав и объём работ', cost: 'Запрос по стоимости проекта', timeline: 'Предполагаемые сроки', stages: 'Количество этапов', schedule: 'График платежей', methods: 'Способы оплаты' }
        : { name: 'Name', email: 'Email', scope: 'Scope of work', cost: 'Project cost estimate requested', timeline: 'Estimated timeline', stages: 'Number of stages', schedule: 'Payment schedule', methods: 'Payment methods' };
      const form = new FormData(quoteForm);
      const methodNames = [...quoteForm.querySelectorAll('input[name="payment-method"]:checked')]
        .map((input) => input.closest('label')?.querySelector('span')?.textContent.trim())
        .filter(Boolean);
      const lines = ['name', 'email', 'scope', 'cost', 'timeline', 'stages', 'schedule']
        .map((field) => `${labels[field]}: ${form.get(field) || '—'}`);
      lines.push(`${labels.methods}: ${methodNames.length ? methodNames.join(', ') : '—'}`);
      const subject = locale === 'ru' ? 'Запрос расчёта проекта' : 'Project quote request';
      const recipient = quoteForm.getAttribute('action').replace(/^mailto:/, '');
      window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    });
  }
})();
