import { getAppConfig } from './config.js';
import { initCountdown } from './countdown.js';
import { applyContentOverrides } from './content-overrides.js';
import { initRevealAnimations } from './reveal.js';
import { initRsvpForm } from './rsvp-form.js';

function initApp() {
  const config = getAppConfig();

  applyContentOverrides();

  initCountdown({
    selector: config.countdownSelector,
    weddingDate: config.weddingDate
  });

  initRevealAnimations({
    selector: config.revealSelector,
    threshold: config.revealThreshold
  });

  initRsvpForm({
    formSelector: config.formSelector,
    noticeSelector: config.noticeSelector,
    scriptUrl: config.scriptUrl,
    storageKey: config.storageKey,
    submittedStorageKey: config.submittedStorageKey
  });
}

initApp();
