const SHEET_NAME = 'Event Tracking';
const HEADERS = [
  'ID',
  'Event',
  'Date',
  'Time',
  'Goals',
  'Outcomes',
  'Advertising',
  'Total Spent',
  'Total Earned',
  'Volunteers',
  'Notes',
  'Target Attendance',
  'Current RSVPs',
  'Checklist',
  'Flyer Image',
  'Is TBD',
  'Created At',
  'Post Event Attendance',
  'Post Event Notes'
];

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeaders(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let headers = existing.filter(Boolean);
  if (headers.length === 0) {
    headers = HEADERS.slice();
  } else {
    HEADERS.forEach((header) => {
      if (headers.indexOf(header) === -1) {
        headers.push(header);
      }
    });
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return headers;
}

function rowToEvent(headers, row) {
  const event = {};
  headers.forEach((header, index) => {
    event[header] = row[index] !== undefined ? row[index] : '';
  });
  return {
    id: event['ID'],
    name: event['Event'],
    date: event['Date'],
    time: event['Time'],
    goals: event['Goals'],
    outcomes: event['Outcomes'],
    advertising: event['Advertising'],
    totalSpent: event['Total Spent'],
    totalEarned: event['Total Earned'],
    volunteers: event['Volunteers'],
    notes: event['Notes'],
    targetAttendance: event['Target Attendance'],
    currentRSVPs: event['Current RSVPs'],
    checklist: event['Checklist'],
    flyerImage: event['Flyer Image'],
    isTBD: String(event['Is TBD']).toLowerCase() === 'true',
    createdAt: event['Created At'],
    postEventAttendance: event['Post Event Attendance'],
    postEventNotes: event['Post Event Notes']
  };
}

function eventToRow(headers, event) {
  const row = new Array(headers.length).fill('');
  headers.forEach((header, index) => {
    switch (header) {
      case 'ID':
        row[index] = event.id || '';
        break;
      case 'Event':
        row[index] = event.name || '';
        break;
      case 'Date':
        row[index] = event.date || '';
        break;
      case 'Time':
        row[index] = event.time || '';
        break;
      case 'Goals':
        row[index] = event.goals || '';
        break;
      case 'Outcomes':
        row[index] = event.outcomes || '';
        break;
      case 'Advertising':
        row[index] = event.advertising || '';
        break;
      case 'Total Spent':
        row[index] = event.totalSpent || '';
        break;
      case 'Total Earned':
        row[index] = event.totalEarned || '';
        break;
      case 'Volunteers':
        row[index] = event.volunteers || '';
        break;
      case 'Notes':
        row[index] = event.notes || '';
        break;
      case 'Target Attendance':
        row[index] = event.targetAttendance || '';
        break;
      case 'Current RSVPs':
        row[index] = event.currentRSVPs || '';
        break;
      case 'Checklist':
        row[index] = typeof event.checklist === 'string' ? event.checklist : JSON.stringify(event.checklist || {});
        break;
      case 'Flyer Image':
        row[index] = event.flyerImage || '';
        break;
      case 'Is TBD':
        row[index] = event.isTBD ? 'true' : 'false';
        break;
      case 'Created At':
        row[index] = event.createdAt || '';
        break;
      case 'Post Event Attendance':
        row[index] = event.postEventAttendance || '';
        break;
      case 'Post Event Notes':
        row[index] = event.postEventNotes || '';
        break;
      default:
        row[index] = '';
    }
  });
  return row;
}

function buildResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = getSheet();
  const headers = ensureHeaders(sheet);
  const action = e && e.parameter ? e.parameter.action : '';

  if (action === 'list') {
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, headers.length).getValues() : [];
    const events = rows.map((row) => rowToEvent(headers, row));
    return buildResponse({ events: events });
  }

  return buildResponse({ status: 'ok' });
}

function doPost(e) {
  const sheet = getSheet();
  const headers = ensureHeaders(sheet);
  const payload = e && e.postData ? e.postData.contents : '';
  let data = {};
  try {
    data = payload ? JSON.parse(payload) : {};
  } catch (error) {
    return buildResponse({ status: 'error', message: 'Invalid JSON payload' });
  }
  if (data.action === 'delete' && data.id) {
    const idIndex = headers.indexOf('ID') + 1;
    const lastRow = sheet.getLastRow();
    if (lastRow > 1 && idIndex > 0) {
      const idValues = sheet.getRange(2, idIndex, lastRow - 1, 1).getValues();
      for (let i = 0; i < idValues.length; i += 1) {
        if (String(idValues[i][0]) === String(data.id)) {
          sheet.deleteRow(i + 2);
          return buildResponse({ status: 'deleted', id: data.id });
        }
      }
    }
    return buildResponse({ status: 'not_found', id: data.id });
  }
  const event = data.event || {};

  if (!event.id) {
    event.id = new Date().getTime();
  }

  const idIndex = headers.indexOf('ID') + 1;
  const lastRow = sheet.getLastRow();
  let targetRow = null;

  if (lastRow > 1 && idIndex > 0) {
    const idValues = sheet.getRange(2, idIndex, lastRow - 1, 1).getValues();
    for (let i = 0; i < idValues.length; i += 1) {
      if (String(idValues[i][0]) === String(event.id)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  const rowValues = eventToRow(headers, event);
  if (targetRow) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return buildResponse({ status: 'saved', id: event.id });
}
