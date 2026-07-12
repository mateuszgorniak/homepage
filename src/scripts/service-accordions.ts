const DURATION_MS = 320;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setExpanded(summary: HTMLElement | null, expanded: boolean): void {
  summary?.setAttribute('aria-expanded', String(expanded));
}

function animatePanel(
  panel: HTMLElement,
  from: number,
  to: number,
): Promise<void> {
  panel.style.overflow = 'hidden';
  panel.style.height = `${from}px`;

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      panel.style.transition = `height ${DURATION_MS}ms ease`;
      panel.style.height = `${to}px`;
    });

    const onEnd = (event: TransitionEvent) => {
      if (event.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', onEnd);
      panel.style.transition = '';
      panel.style.height = to === 0 ? '0px' : 'auto';
      if (to !== 0) {
        panel.style.overflow = '';
      }
      resolve();
    };

    panel.addEventListener('transitionend', onEnd);
  });
}

export function initServiceAccordions(): void {
  const items = document.querySelectorAll<HTMLDetailsElement>('.service-point');

  items.forEach((details) => {
    const summary = details.querySelector<HTMLElement>('.service-point-summary');
    const panel = details.querySelector<HTMLElement>('.service-point-body');

    if (!summary || !panel) return;

    setExpanded(summary, details.open);

    if (details.open) {
      panel.style.height = 'auto';
    }

    summary.addEventListener('click', (event) => {
      if (prefersReducedMotion()) return;

      event.preventDefault();

      if (details.open) {
        const start = panel.scrollHeight;
        animatePanel(panel, start, 0).then(() => {
          details.open = false;
          panel.style.overflow = '';
          setExpanded(summary, false);
        });
        return;
      }

      details.open = true;
      setExpanded(summary, true);
      const target = panel.scrollHeight;
      panel.style.overflow = 'hidden';
      animatePanel(panel, 0, target).then(() => {
        setExpanded(summary, true);
      });
    });
  });
}
