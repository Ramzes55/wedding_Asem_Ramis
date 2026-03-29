const SPREADSHEET_ID = '1HikIoSju0khMcfZxbsGyyYv9E603deh-HhJn-et_VVQ';
const SHEET_NAME = 'RSVP';
const OWNER_EMAIL = 'ramis.karagoyshiev.origami@gmail.com';

function doGet(e) {
  return ContentService
    .createTextOutput('ok')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Дата и время',
        'Имя и фамилия',
        'Присутствие',
        'Дети',
        'Уточнение по детям',
        'Напитки',
        'Комментарий',
        'Страница'
      ]);
      sheet.setFrozenRows(1);
    }

    const payload = e && e.parameter ? e.parameter : {};

    let drinks = [];
    try {
      drinks = payload.drinks ? JSON.parse(payload.drinks) : [];
    } catch (err) {
      drinks = [];
    }

    const data = {
      guestName: String(payload.guestName || ''),
      attendance: String(payload.attendance || ''),
      children: String(payload.children || ''),
      childrenNote: String(payload.childrenNote || ''),
      drinksText: String(payload.drinksText || drinks.join(', ')),
      comment: String(payload.comment || ''),
      page: String(payload.page || ''),
      savedAt: String(payload.savedAt || '')
    };

    sheet.appendRow([
      new Date(),
      data.guestName,
      data.attendance,
      data.children,
      data.childrenNote,
      data.drinksText,
      data.comment,
      data.page
    ]);

    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: 'Новый RSVP — ' + (data.guestName || 'Без имени'),
      body:
        'Новый ответ с сайта\n\n' +
        'Имя: ' + data.guestName + '\n' +
        'Присутствие: ' + data.attendance + '\n' +
        'Дети: ' + data.children + '\n' +
        'Уточнение по детям: ' + data.childrenNote + '\n' +
        'Напитки: ' + data.drinksText + '\n' +
        'Комментарий: ' + data.comment + '\n' +
        'Страница: ' + data.page + '\n' +
        'Время на сайте: ' + data.savedAt
    });

    return ContentService
      .createTextOutput('ok')
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService
      .createTextOutput('ERROR: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}