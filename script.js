// Тёплое появление контента + состояние шапки при скролле.
// Без зависимостей. Уважает prefers-reduced-motion.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Шапка: тень/фон при прокрутке (пишем атрибут только при смене состояния)
const header = document.getElementById('header');
let scrolled;
const onScroll = () => {
  const s = window.scrollY > 8;
  if (s !== scrolled) { scrolled = s; header?.setAttribute('data-scrolled', String(s)); }
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const reveals = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('in'));
} else {
  // Hero виден сразу — раскрываем после первого кадра по своим задержкам
  const hero = document.querySelector('.hero');
  requestAnimationFrame(() =>
    hero?.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'))
  );

  // Остальное — по мере появления в зоне видимости
  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.1 }
  );

  reveals.forEach((el) => {
    if (!hero?.contains(el)) io.observe(el);
  });
}

// Галерея: вкладки по годам (показываем галерею выбранного года)
document.querySelectorAll('.gal-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const year = tab.dataset.year;
    document.querySelectorAll('.gal-tab').forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('.gallery[data-year]').forEach((g) => { g.hidden = g.dataset.year !== year; });
  });
});

// Лайтбокс галереи: открываем фото поверх страницы, без перехода на новую вкладку.
// Набор слайдов берётся из той галереи, по которой кликнули, — листание не выходит за её год.
const galleries = [...document.querySelectorAll('.gallery')].filter((g) => g.querySelector('a[href]'));
if (galleries.length) {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML =
    '<button class="lb-btn lb-close" type="button" aria-label="Закрыть">×</button>' +
    '<button class="lb-btn lb-prev" type="button" aria-label="Предыдущее фото">‹</button>' +
    '<img alt="">' +
    '<button class="lb-btn lb-next" type="button" aria-label="Следующее фото">›</button>';
  document.body.appendChild(box);

  const img = box.querySelector('img');
  let srcs = [], i = 0;
  const show = (n) => { i = (n + srcs.length) % srcs.length; img.src = srcs[i]; };
  const open = (links, n) => { srcs = links.map((a) => a.getAttribute('href')); show(n); box.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { box.classList.remove('open'); document.body.style.overflow = ''; };

  galleries.forEach((gal) => {
    const links = [...gal.querySelectorAll('a[href]')];
    links.forEach((a, n) =>
      a.addEventListener('click', (e) => { e.preventDefault(); open(links, n); })
    );
  });
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); show(i - 1); });
  box.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); show(i + 1); });
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
  });
}

// FAQ: плавное раскрытие <details> (нативный тег не анимирует высоту сам).
// Стартуем от текущей высоты — клик на полпути плавно разворачивает анимацию;
// таймер финализации сбрасывается при повторном клике, чтобы состояния не накладывались.
document.querySelectorAll('.faq-item').forEach((item) => {
  const summary = item.querySelector('summary');
  const panel = item.querySelector('.faq-a');
  if (!summary || !panel) return;
  let timer;

  summary.addEventListener('click', (e) => {
    if (reduceMotion) return; // уважаем prefers-reduced-motion — нативное поведение
    e.preventDefault();

    const closing = item.open;
    const start = panel.getBoundingClientRect().height; // 0, если закрыт (контент скрыт нативно)
    item.open = true;                                   // контент должен быть в DOM, чтобы измерить
    const end = closing ? 0 : panel.scrollHeight;

    panel.style.height = start + 'px';
    panel.style.opacity = closing ? '1' : '0';          // мягкое появление/исчезание вместе с высотой
    void panel.offsetHeight;                            // принудительный reflow фиксирует старт
    panel.style.height = end + 'px';
    panel.style.opacity = closing ? '0' : '1';

    clearTimeout(timer);
    timer = setTimeout(() => {                          // длительность синхронна с transition в .faq-a
      panel.style.height = '';
      panel.style.opacity = '';
      if (closing) item.open = false;
    }, 420);
  });
});
