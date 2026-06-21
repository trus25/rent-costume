export function resetMobileDetailScroll() {
  if (typeof window === 'undefined') return;
  if (!window.matchMedia('(max-width: 767px)').matches) return;
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
}
