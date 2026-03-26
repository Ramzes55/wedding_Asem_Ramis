const LABELS = {
  dayOne: '\u0434\u0435\u043d\u044c',
  dayFew: '\u0434\u043d\u044f',
  dayMany: '\u0434\u043d\u0435\u0439',
  hourOne: '\u0447\u0430\u0441',
  hourFew: '\u0447\u0430\u0441\u0430',
  hourMany: '\u0447\u0430\u0441\u043e\u0432',
  minuteOne: '\u043c\u0438\u043d\u0443\u0442\u0430',
  minuteFew: '\u043c\u0438\u043d\u0443\u0442\u044b',
  minuteMany: '\u043c\u0438\u043d\u0443\u0442',
  secondOne: '\u0441\u0435\u043a\u0443\u043d\u0434\u0430',
  secondFew: '\u0441\u0435\u043a\u0443\u043d\u0434\u044b',
  secondMany: '\u0441\u0435\u043a\u0443\u043d\u0434'
};

function pluralize(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;

  return many;
}

function buildCountItem(value, label) {
  return `
    <div class="count-item">
      <strong>${String(value).padStart(2, '0')}</strong>
      <span>${label}</span>
    </div>
  `;
}

function renderCountdown(element, eventTimestamp) {
  const now = Date.now();
  const distance = Math.max(0, eventTimestamp - now);

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  element.innerHTML = [
    buildCountItem(days, pluralize(days, LABELS.dayOne, LABELS.dayFew, LABELS.dayMany)),
    buildCountItem(hours, pluralize(hours, LABELS.hourOne, LABELS.hourFew, LABELS.hourMany)),
    buildCountItem(minutes, pluralize(minutes, LABELS.minuteOne, LABELS.minuteFew, LABELS.minuteMany)),
    buildCountItem(seconds, pluralize(seconds, LABELS.secondOne, LABELS.secondFew, LABELS.secondMany))
  ].join('');
}

export function initCountdown({ selector, weddingDate }) {
  const countdownElement = document.querySelector(selector);
  const eventTimestamp = new Date(weddingDate).getTime();

  if (!countdownElement || Number.isNaN(eventTimestamp)) {
    return null;
  }

  renderCountdown(countdownElement, eventTimestamp);

  return window.setInterval(() => {
    renderCountdown(countdownElement, eventTimestamp);
  }, 1000);
}
