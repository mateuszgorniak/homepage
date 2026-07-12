function positionTooltip(button: HTMLElement, tooltip: HTMLElement): void {
  const rect = button.getBoundingClientRect();
  const gap = 8;
  tooltip.style.setProperty('--tip-top', `${rect.bottom + gap}px`);
  tooltip.style.setProperty('--tip-left', `${rect.left + rect.width / 2}px`);
}

function showTooltip(button: HTMLElement, tooltip: HTMLElement & { showPopover?: () => void }): void {
  positionTooltip(button, tooltip);

  if (typeof tooltip.showPopover === 'function') {
    tooltip.showPopover();
    positionTooltip(button, tooltip);
    return;
  }

  tooltip.classList.add('is-open');
}

function hideTooltip(tooltip: HTMLElement & { hidePopover?: () => void }): void {
  if (typeof tooltip.hidePopover === 'function') {
    tooltip.hidePopover();
    return;
  }

  tooltip.classList.remove('is-open');
}

export function initTagTooltips(): void {
  document.querySelectorAll<HTMLElement>('.tag-wrap').forEach((wrap) => {
    const button = wrap.querySelector<HTMLElement>('button');
    const tooltip = wrap.querySelector<HTMLElement>('.tag-tooltip');
    if (!button || !tooltip) return;

    const show = () => showTooltip(button, tooltip);
    const hide = () => hideTooltip(tooltip);

    button.addEventListener('mouseenter', show);
    button.addEventListener('focus', show);
    button.addEventListener('mouseleave', hide);
    button.addEventListener('blur', hide);
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('resize', hide, { passive: true });
  });
}
