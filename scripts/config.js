export function getAppConfig() {
  const { weddingDate = '', scriptUrl = '' } = document.body.dataset;

  return {
    weddingDate,
    scriptUrl,
    countdownSelector: '#countdown',
    revealSelector: '.reveal',
    revealThreshold: 0.12,
    formSelector: '#rsvp-form',
    noticeSelector: '#notice',
    storageKey: 'ramis-asem-rsvp',
    submittedStorageKey: 'ramis-asem-rsvp-last-submitted'
  };
}
