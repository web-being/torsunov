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

// Лайтбокс галереи: открываем фото поверх страницы, без перехода на новую вкладку
const galLinks = [...document.querySelectorAll('.gallery a[href]')];
if (galLinks.length) {
  const srcs = galLinks.map((a) => a.getAttribute('href'));
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
  let i = 0;
  const show = (n) => { i = (n + srcs.length) % srcs.length; img.src = srcs[i]; };
  const open = (n) => { show(n); box.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { box.classList.remove('open'); document.body.style.overflow = ''; };

  galLinks.forEach((a, n) =>
    a.addEventListener('click', (e) => { e.preventDefault(); open(n); })
  );
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
