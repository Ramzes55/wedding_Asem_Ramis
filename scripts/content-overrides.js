const MAP_URL =
  'https://yandex.com/maps/org/golden_star/35792406384/?ll=45.928543%2C51.596923&z=17';

const TEXT = {
  heroDate: '\u0410\u0432\u0433\u0443\u0441\u0442&nbsp;|&nbsp;7&nbsp;|&nbsp;2026',
  venueName: 'Golden Star',
  venueAddress: '\u0433. \u0421\u0430\u0440\u0430\u0442\u043e\u0432,<br>\u041c\u043e\u0441\u043a\u043e\u0432\u0441\u043a\u043e\u0435 \u0448., 23\u0410',
  routeButton: '\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043c\u0430\u0440\u0448\u0440\u0443\u0442',
  mapButton: '\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u043d\u0430 \u043a\u0430\u0440\u0442\u0435',
  phoneLabel: '\u0422\u0435\u043b\u0435\u0444\u043e\u043d',
  rsvpIntro: '\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0437\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043a\u043e\u0440\u043e\u0442\u043a\u0443\u044e \u0430\u043d\u043a\u0435\u0442\u0443.'
};

function updateHeroDate() {
  const heroDate = document.querySelector('.hero-date');
  if (!heroDate) return;

  heroDate.innerHTML = TEXT.heroDate;
}

function updateVenueCard() {
  const venueCard = document.querySelector('.venue-card');
  if (!venueCard) return;

  const venueName = venueCard.querySelector('.venue-name');
  const venueCopy = venueCard.querySelector('.venue-copy');
  const routeButton = venueCard.querySelector('.button');

  if (venueName) {
    venueName.textContent = TEXT.venueName;
  }

  if (venueCopy) {
    venueCopy.innerHTML = TEXT.venueAddress;
  }

  if (routeButton) {
    routeButton.href = MAP_URL;
    routeButton.textContent = TEXT.routeButton;
  }
}

function updateMapCard() {
  const mapCard = document.querySelector('.map-card');
  if (!mapCard) return;

  const mapButton = mapCard.querySelector('.button');
  if (mapButton) {
    mapButton.href = MAP_URL;
    mapButton.textContent = TEXT.mapButton;
  }
}

function updateContactCard(card, { phoneHref, phoneText, telegramHref }) {
  if (!card) return;

  const contactLine = card.querySelector('.contact-line');
  const telegramButton = card.querySelector('.contact-actions a[href*="t.me"]');
  const callButton = card.querySelector('.contact-actions a[href^="tel:"]');

  if (contactLine) {
    contactLine.innerHTML = `${TEXT.phoneLabel}: <a href="${phoneHref}">${phoneText}</a>`;
  }

  if (telegramButton) {
    telegramButton.href = telegramHref;
  }

  if (callButton) {
    callButton.remove();
  }
}

function updateContacts() {
  const contactCards = document.querySelectorAll('.contact-card');
  if (contactCards.length < 2) return;

  updateContactCard(contactCards[0], {
    phoneHref: 'tel:+79678099540',
    phoneText: '+7 (967) 809-95-40',
    telegramHref: 'https://t.me/sasiskamen'
  });

  updateContactCard(contactCards[1], {
    phoneHref: 'tel:+79962652521',
    phoneText: '+7 (996) 265-25-21',
    telegramHref: 'https://t.me/wesavehsarbi'
  });
}

function updateRsvpIntro() {
  const rsvpText = document.querySelector('.form-card > .rsvp-text');
  if (!rsvpText) return;

  rsvpText.textContent = TEXT.rsvpIntro;
}

function removeDownloadButton() {
  const downloadButton = document.getElementById('downloadBtn');
  if (downloadButton) {
    downloadButton.remove();
  }
}

export function applyContentOverrides() {
  updateHeroDate();
  updateVenueCard();
  updateMapCard();
  updateContacts();
  updateRsvpIntro();
  removeDownloadButton();
}
