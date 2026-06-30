const sectionIds = ['about', 'services', 'stack', 'expertise', 'process', 'contact'];

function getNavOffset(): number {
  const navHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
  );

  return (Number.isFinite(navHeight) ? navHeight : 64) + 24;
}

function setActiveNav(id: string | null): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-nav]').forEach((link) => {
    link.classList.toggle('active', id !== null && link.dataset.nav === id);
  });
}

export function initScrollSpy(): void {
  const sections = sectionIds
    .map((sectionId) => document.getElementById(sectionId))
    .filter((el): el is HTMLElement => el !== null);

  const nav = document.getElementById('site-nav');
  const hero = document.getElementById('top');

  if (sections.length === 0) {
    updateNavHeroState();
    window.addEventListener('scroll', updateNavHeroState, { passive: true });
    window.addEventListener('resize', updateNavHeroState, { passive: true });
    return;
  }

  let ticking = false;

  const updateNavHeroState = (): void => {
    if (!nav || !hero) return;
    const navHeight = nav.getBoundingClientRect().height;
    nav.classList.toggle('site-nav--over-hero', hero.getBoundingClientRect().bottom > navHeight + 8);
  };

  const update = (): void => {
    const offset = getNavOffset();
    let activeId: string | null = null;

    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset) {
        activeId = section.id;
      }
    }

    setActiveNav(activeId);
    updateNavHeroState();
    ticking = false;
  };

  const scheduleUpdate = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('hashchange', scheduleUpdate);
  scheduleUpdate();
}
