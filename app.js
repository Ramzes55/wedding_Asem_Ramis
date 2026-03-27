const weddingDate = new Date('2026-08-07T15:00:00+03:00').getTime();
const countdown = document.getElementById('countdown');
const countdownItems = countdown ? {
  days: countdown.querySelector('[data-unit="days"] strong'),
  daysLabel: countdown.querySelector('[data-unit="days"] span'),
  hours: countdown.querySelector('[data-unit="hours"] strong'),
  hoursLabel: countdown.querySelector('[data-unit="hours"] span'),
  minutes: countdown.querySelector('[data-unit="minutes"] strong'),
  minutesLabel: countdown.querySelector('[data-unit="minutes"] span'),
  seconds: countdown.querySelector('[data-unit="seconds"] strong'),
  secondsLabel: countdown.querySelector('[data-unit="seconds"] span')
} : null;
const audio = document.getElementById('pageAudio');
const audioControl = document.getElementById('audioControl');
const audioToggle = document.getElementById('audioToggle');

function plural(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function updateCountdown() {
  if (!countdownItems) return;
  const now = Date.now();
  const distance = Math.max(0, weddingDate - now);
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);
  countdownItems.days.textContent = String(days).padStart(2, '0');
  countdownItems.daysLabel.textContent = plural(days, 'день', 'дня', 'дней');
  countdownItems.hours.textContent = String(hours).padStart(2, '0');
  countdownItems.hoursLabel.textContent = plural(hours, 'час', 'часа', 'часов');
  countdownItems.minutes.textContent = String(minutes).padStart(2, '0');
  countdownItems.minutesLabel.textContent = plural(minutes, 'минута', 'минуты', 'минут');
  countdownItems.seconds.textContent = String(seconds).padStart(2, '0');
  countdownItems.secondsLabel.textContent = plural(seconds, 'секунда', 'секунды', 'секунд');
}

updateCountdown();
setInterval(updateCountdown, 1000);

function syncAudioButtonState(isPlaying) {
  if (!audioToggle) return;
  audioToggle.classList.toggle('is-playing', isPlaying);
  audioToggle.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  audioToggle.setAttribute('aria-label', isPlaying ? 'Выключить музыку' : 'Включить музыку');
}

function syncAudioHintVisibility() {
  if (!audioControl) return;
  const shouldCollapse = window.scrollY > 48;
  if (audioControl.classList.contains('is-collapsed') === shouldCollapse) return;
  audioControl.classList.toggle('is-collapsed', shouldCollapse);
}

if (audio && audioToggle) {
  audio.volume = 0.45;

  audioToggle.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        await audio.play();
        syncAudioButtonState(true);
      } catch (error) {
        console.error(error);
        syncAudioButtonState(false);
      }
    } else {
      audio.pause();
      syncAudioButtonState(false);
    }
  });

  audio.addEventListener('pause', () => syncAudioButtonState(false));
  audio.addEventListener('play', () => syncAudioButtonState(true));
  audio.addEventListener('ended', () => syncAudioButtonState(false));

  syncAudioButtonState(false);
}

syncAudioHintVisibility();
window.addEventListener('scroll', syncAudioHintVisibility, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const form = document.getElementById('rsvp-form');
const notice = document.getElementById('notice');
const attendanceInputs = Array.from(form.querySelectorAll('[name="attendance"]'));
const childrenInputs = Array.from(form.querySelectorAll('[name="children"]'));
const childrenNoteInput = document.getElementById('childrenNote');
const commentInput = document.getElementById('comment');
const drinkInputs = Array.from(form.querySelectorAll('[name="drinks"]'));
const conditionalBlocks = Array.from(form.querySelectorAll('.conditional-block'));
const storageKey = 'ramis-asem-rsvp';
const submittedStorageKey = 'ramis-asem-rsvp-last-submitted';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw2P2nob1WMom0d5gWFex3n_e4aHrFuLBC5IMana0d8KSF82X6R06e4Y_MRQ2K4ZEI0RA/exec';
const textEntrySelector = 'input[type="text"], input[type="tel"], textarea';

function setNotice(message) {
  notice.style.display = 'block';
  notice.textContent = message;
}

function createHiddenField(name, value) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  return input;
}

function isTouchLikeDevice() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

function isTextEntryElement(element) {
  return !!element && typeof element.matches === 'function' && element.matches(textEntrySelector);
}

function blurActiveTextEntryOnOutsideTap(event) {
  if (!isTouchLikeDevice()) return;

  const activeElement = document.activeElement;
  if (!isTextEntryElement(activeElement)) return;

  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target === activeElement || target.closest(textEntrySelector)) return;

  window.requestAnimationFrame(() => {
    if (document.activeElement === activeElement) {
      activeElement.blur();
    }
  });
}

function hasSelectedDrink() {
  return drinkInputs.some((input) => input.checked);
}

function syncDrinksValidity() {
  if (isAttendanceDeclined()) {
    drinkInputs.forEach((input) => input.setCustomValidity(''));
    return;
  }
  const message = hasSelectedDrink() ? '' : 'Выберите хотя бы один вариант напитка.';
  drinkInputs.forEach((input) => input.setCustomValidity(''));
  if (drinkInputs[0]) {
    drinkInputs[0].setCustomValidity(message);
  }
}

function isAttendanceDeclined() {
  const selected = form.querySelector('[name="attendance"]:checked');
  return !!selected && selected.value === 'К сожалению, не смогу присутствовать';
}

function syncAttendanceDependentState() {
  const declined = isAttendanceDeclined();

  conditionalBlocks.forEach((block) => {
    block.classList.toggle('is-disabled', declined);
  });

  childrenInputs.forEach((input) => {
    input.disabled = declined;
  });

  drinkInputs.forEach((input) => {
    input.disabled = declined;
  });

  commentInput.disabled = declined;

  if (declined) {
    childrenNoteInput.disabled = true;
    childrenNoteInput.required = false;
    if (conditionalBlocks.some((block) => block.contains(document.activeElement))) {
      document.activeElement.blur();
    }
    return;
  }

  syncChildrenNoteState();
}

function syncChildrenNoteState() {
  if (isAttendanceDeclined()) {
    childrenNoteInput.disabled = true;
    childrenNoteInput.required = false;
    return;
  }

  const selected = form.querySelector('[name="children"]:checked');
  const value = selected ? selected.value : '';
  const isYes = value === 'Да';
  const isNo = value === 'Нет';

  childrenNoteInput.disabled = isNo;
  childrenNoteInput.required = isYes;

  if (isNo && document.activeElement === childrenNoteInput) {
    childrenNoteInput.blur();
  }
}

function collectFormData() {
  const formData = new FormData(form);
  const drinks = formData.getAll('drinks');
  return {
    submissionId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    guestName: formData.get('guestName') || '',
    attendance: formData.get('attendance') || '',
    children: formData.get('children') || '',
    childrenNote: formData.get('childrenNote') || '',
    drinks,
    drinksText: drinks.join(', '),
    comment: formData.get('comment') || '',
    savedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    page: window.location.href
  };
}

function fillForm(data) {
  if (!data) return;
  form.guestName.value = data.guestName || '';
  form.childrenNote.value = data.childrenNote || '';
  form.comment.value = data.comment || '';

  if (data.attendance) {
    const target = form.querySelector(`[name="attendance"][value="${CSS.escape(data.attendance)}"]`);
    if (target) target.checked = true;
  }

  if (data.children) {
    const target = form.querySelector(`[name="children"][value="${CSS.escape(data.children)}"]`);
    if (target) target.checked = true;
  }

  (data.drinks || []).forEach((drink) => {
    const target = Array.from(form.querySelectorAll('[name="drinks"]')).find((item) => item.value === drink);
    if (target) target.checked = true;
  });
}

function sendToGoogleSheets(data) {
  return new Promise((resolve, reject) => {
    const iframeName = `google-sheets-submit-${Date.now()}`;
    const iframe = document.createElement('iframe');
    const postForm = document.createElement('form');
    let settled = false;

    iframe.name = iframeName;
    iframe.title = 'Google Sheets submit transport';
    iframe.style.display = 'none';

    postForm.method = 'POST';
    postForm.action = SCRIPT_URL;
    postForm.target = iframeName;
    postForm.style.display = 'none';

    Object.entries(data).forEach(([key, value]) => {
      const normalizedValue = Array.isArray(value) ? JSON.stringify(value) : String(value ?? '');
      postForm.appendChild(createHiddenField(key, normalizedValue));
    });

    const cleanup = () => {
      iframe.remove();
      postForm.remove();
    };

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      window.setTimeout(cleanup, 1000);
      callback();
    };

    const timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error('SUBMIT_TIMEOUT')));
    }, 12000);

    iframe.addEventListener('load', () => {
      window.clearTimeout(timeoutId);
      finish(resolve);
    }, { once: true });

    document.body.appendChild(iframe);
    document.body.appendChild(postForm);
    postForm.submit();
  });
}

try {
  const saved = localStorage.getItem(storageKey);
  if (saved) fillForm(JSON.parse(saved));
} catch (error) {
  console.error(error);
}

drinkInputs.forEach((input) => {
  input.addEventListener('change', syncDrinksValidity);
});

attendanceInputs.forEach((input) => {
  input.addEventListener('change', () => {
    syncAttendanceDependentState();
    syncDrinksValidity();
  });
});

childrenInputs.forEach((input) => {
  input.addEventListener('change', syncChildrenNoteState);
});

syncAttendanceDependentState();
syncChildrenNoteState();
syncDrinksValidity();

document.addEventListener(window.PointerEvent ? 'pointerdown' : 'touchstart', blurActiveTextEntryOnOutsideTap, true);

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  syncAttendanceDependentState();
  syncChildrenNoteState();
  syncDrinksValidity();
  if (!isAttendanceDeclined() && !hasSelectedDrink()) {
    if (drinkInputs[0]) {
      drinkInputs[0].reportValidity();
      drinkInputs[0].focus();
    }
    return;
  }

  const data = collectFormData();
  localStorage.setItem(storageKey, JSON.stringify(data));

  const button = form.querySelector('button[type="submit"]');
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Отправляем...';

  try {
    if (!SCRIPT_URL || SCRIPT_URL.includes('https://script.google.com/macros/s/AKfycbyRL48pXx4MJtsguB7bG07GLlpO2rL8LCo3g8C8JLMwJ9i7K87nDOm2XWlp3ocPf6gKzw/exec')) {
      throw new Error('SCRIPT_URL_NOT_SET');
    }
    await sendToGoogleSheets(data);
    localStorage.setItem(submittedStorageKey, JSON.stringify(data));
    notice.style.display = 'block';
    notice.textContent = 'Спасибо! Ваш ответ отправлен.';
    form.reset();
    syncAttendanceDependentState();
    syncChildrenNoteState();
    syncDrinksValidity();
    localStorage.removeItem(storageKey);
  } catch (error) {
    notice.style.display = 'block';
    if (error.message === 'SCRIPT_URL_NOT_SET') {
      notice.textContent = 'Форма уже обновлена под Google Sheets, но в код пока не вставлена ссылка Apps Script. До подключения ответ сохранён только на этом устройстве.';
    } else {
      notice.textContent = 'Не удалось отправить ответ в Google Sheets. Мы сохранили его локально в этом браузере — можно попробовать ещё раз чуть позже.';
      console.error(error);
    }
  } finally {
    button.disabled = false;
    button.textContent = originalText;
    notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
