const SPREADSHEET_ID = '1HikIoSju0khMcfZxbsGyyYv9E603deh-HhJn-et_VVQ';
const SHEET_NAME = 'RSVP';

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

    return ContentService
      .createTextOutput('ok')
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService
      .createTextOutput('ERROR: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
