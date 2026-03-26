const PLACEHOLDER_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyRL48pXx4MJtsguB7bG07GLlpO2rL8LCo3g8C8JLMwJ9i7K87nDOm2XWlp3ocPf6gKzw/exec';

const TEXT = {
  submitDefault: '\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0432\u0435\u0442',
  submitLoading: '\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u0435\u043c...',
  submitSuccess: '\u0421\u043f\u0430\u0441\u0438\u0431\u043e! \u0412\u0430\u0448 \u043e\u0442\u0432\u0435\u0442 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d.',
  missingScriptUrl: '\u0424\u043e\u0440\u043c\u0430 \u0433\u043e\u0442\u043e\u0432\u0430 \u043a \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0435 \u0432 Google Sheets, \u043d\u043e \u0432 \u043a\u043e\u0434\u0435 \u0435\u0449\u0451 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d \u0440\u0430\u0431\u043e\u0447\u0438\u0439 URL Google Apps Script. \u041f\u043e\u043a\u0430 \u043e\u0442\u0432\u0435\u0442 \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d \u0442\u043e\u043b\u044c\u043a\u043e \u0432 \u044d\u0442\u043e\u043c \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435.',
  submitFailed: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0432\u0435\u0442 \u0432 Google Sheets. \u041c\u044b \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u043b\u0438 \u0435\u0433\u043e \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e \u0432 \u044d\u0442\u043e\u043c \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435, \u043f\u043e\u044d\u0442\u043e\u043c\u0443 \u043c\u043e\u0436\u043d\u043e \u043f\u043e\u043f\u0440\u043e\u0431\u043e\u0432\u0430\u0442\u044c \u0435\u0449\u0451 \u0440\u0430\u0437 \u0447\u0443\u0442\u044c \u043f\u043e\u0437\u0436\u0435.'
};

function setNotice(element, message) {
  if (!element) return;

  element.style.display = 'block';
  element.textContent = message;
}

function createHiddenField(name, value) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  return input;
}

function safelyReadStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function safelyWriteStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(error);
  }
}

function safelyRemoveStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(error);
  }
}

function collectFormData(form) {
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

function fillFieldValue(form, fieldName, value) {
  const field = form.elements.namedItem(fieldName);
  if (field && 'value' in field) {
    field.value = value || '';
  }
}

function fillRadioValue(form, fieldName, value) {
  if (!value) return;

  const target = form.querySelector(`[name="${fieldName}"][value="${CSS.escape(value)}"]`);
  if (target) {
    target.checked = true;
  }
}

function fillCheckboxValues(form, values) {
  (values || []).forEach((value) => {
    const target = Array.from(form.querySelectorAll('[name="drinks"]')).find((input) => input.value === value);
    if (target) {
      target.checked = true;
    }
  });
}

function restoreSavedData(form, storageKey) {
  const rawData = safelyReadStorage(storageKey);
  if (!rawData) return;

  try {
    const data = JSON.parse(rawData);
    fillFieldValue(form, 'guestName', data.guestName);
    fillFieldValue(form, 'childrenNote', data.childrenNote);
    fillFieldValue(form, 'comment', data.comment);
    fillRadioValue(form, 'attendance', data.attendance);
    fillRadioValue(form, 'children', data.children);
    fillCheckboxValues(form, data.drinks);
  } catch (error) {
    console.error(error);
  }
}

function validateScriptUrl(scriptUrl) {
  if (!scriptUrl || scriptUrl === PLACEHOLDER_SCRIPT_URL) {
    throw new Error('SCRIPT_URL_NOT_SET');
  }
}

function submitThroughIframe(scriptUrl, data) {
  return new Promise((resolve, reject) => {
    const iframeName = `google-sheets-submit-${Date.now()}`;
    const iframe = document.createElement('iframe');
    const postForm = document.createElement('form');
    let settled = false;

    iframe.name = iframeName;
    iframe.title = 'Google Sheets submit transport';
    iframe.style.display = 'none';

    postForm.method = 'POST';
    postForm.action = scriptUrl;
    postForm.target = iframeName;
    postForm.style.display = 'none';

    Object.entries(data).forEach(([key, value]) => {
      const normalizedValue = Array.isArray(value)
        ? JSON.stringify(value)
        : String(value == null ? '' : value);
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

function getSubmitButton(form) {
  return form.querySelector('button[type="submit"]');
}

function setSubmitState(button, config) {
  if (!button) return;

  button.disabled = config.disabled;
  button.textContent = config.text;
}

function scrollNoticeIntoView(noticeElement) {
  if (!noticeElement) return;
  noticeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function initRsvpForm({
  formSelector,
  noticeSelector,
  scriptUrl,
  storageKey,
  submittedStorageKey
}) {
  const form = document.querySelector(formSelector);
  if (!form) {
    return null;
  }

  const notice = document.querySelector(noticeSelector);

  restoreSavedData(form, storageKey);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = collectFormData(form);
    safelyWriteStorage(storageKey, JSON.stringify(data));

    const submitButton = getSubmitButton(form);
    const originalText = submitButton && submitButton.textContent
      ? submitButton.textContent
      : TEXT.submitDefault;

    setSubmitState(submitButton, {
      disabled: true,
      text: TEXT.submitLoading
    });

    try {
      validateScriptUrl(scriptUrl);
      await submitThroughIframe(scriptUrl, data);

      safelyWriteStorage(submittedStorageKey, JSON.stringify(data));
      setNotice(notice, TEXT.submitSuccess);
      form.reset();
      safelyRemoveStorage(storageKey);
    } catch (error) {
      if (error.message === 'SCRIPT_URL_NOT_SET') {
        setNotice(notice, TEXT.missingScriptUrl);
      } else {
        setNotice(notice, TEXT.submitFailed);
        console.error(error);
      }
    } finally {
      setSubmitState(submitButton, {
        disabled: false,
        text: originalText
      });
      scrollNoticeIntoView(notice);
    }
  });

  return form;
}
