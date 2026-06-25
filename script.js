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
