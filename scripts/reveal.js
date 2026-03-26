export function initRevealAnimations({ selector, threshold }) {
  const elements = document.querySelectorAll(selector);

  if (!elements.length) {
    return null;
  }

  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('visible'));
    return null;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold });

  elements.forEach((element) => observer.observe(element));

  return observer;
}
