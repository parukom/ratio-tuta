export default function flyToCart(
  sourceElem: HTMLElement,
  targetElem: HTMLElement,
) {
  try {
    const rectSource = sourceElem.getBoundingClientRect();
    const rectTarget = targetElem.getBoundingClientRect();

    const clone = sourceElem.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = `${rectSource.left}px`;
    clone.style.top = `${rectSource.top}px`;
    clone.style.width = `${rectSource.width}px`;
    clone.style.height = `${rectSource.height}px`;
    clone.style.zIndex = '9999';
    clone.style.transition = 'all 0.8s ease-in-out';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '1';
    clone.style.willChange = 'transform, left, top, opacity';
    clone.style.borderRadius = '8px';

    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      clone.style.left = `${rectTarget.left + rectTarget.width / 2 - rectSource.width / 2}px`;
      clone.style.top = `${rectTarget.top + rectTarget.height / 2 - rectSource.height / 2}px`;
      clone.style.transform = 'scale(0.2)';
      clone.style.opacity = '0';
    });

    const cleanup = () => {
      clone.removeEventListener('transitionend', cleanup);
      clone.remove();
    };
    clone.addEventListener('transitionend', cleanup);
  } catch {
    // fail silently
  }
}
