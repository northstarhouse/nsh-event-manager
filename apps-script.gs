const SHEET_NAME = 'Event Tracking';
const NEWSLETTER_SHEET_ID = '1dLNdvhcW1_36brUdahk_eh73qx127GYM8djHMJbyazg';
const NEWSLETTER_SHEET_NAME = 'Newsletter Content';
const POSTING_SHEET_ID = '1dLNdvhcW1_36brUdahk_eh73qx127GYM8djHMJbyazg';
const POSTING_SHEET_NAME = 'Monthly Posting Schedule';
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
  'Planning Checklist',
  'Planning Notes',
  'Is TBD',
  'Created At',
  'Post Event Attendance',
  'Post Event Notes'
];
const NEWSLETTER_HEADERS = [
  'Month',
  'Main Feature',
  'Main Upcoming Event',
  'Event Recaps / Blogs',
  'Volunteer Monthly Hours',
  'Donation Needs',
  'Other',
  'Published'
];
const POSTING_HEADERS = [
  'Month',
  'Completed',
  'Entries'
];

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function getNewsletterSheet() {
  const spreadsheet = SpreadsheetApp.openById(NEWSLETTER_SHEET_ID);
  let sheet = spreadsheet.getSheetByName(NEWSLETTER_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.getSheets()[0] || spreadsheet.insertSheet(NEWSLETTER_SHEET_NAME);
  }
  return sheet;
}

function getPostingSheet() {
  const spreadsheet = SpreadsheetApp.openById(POSTING_SHEET_ID);
  let sheet = spreadsheet.getSheetByName(POSTING_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.getSheets()[0] || spreadsheet.insertSheet(POSTING_SHEET_NAME);
  }
  return sheet;
}

function ensureNewsletterHeaders(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let headers = existing.filter(Boolean);
  if (headers.length === 0) {
    headers = NEWSLETTER_HEADERS.slice();
  } else {
    NEWSLETTER_HEADERS.forEach((header) => {
      if (headers.indexOf(header) === -1) {
        headers.push(header);
      }
    });
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return headers;
}

function ensurePostingHeaders(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let headers = existing.filter(Boolean);
  if (headers.length === 0) {
    headers = POSTING_HEADERS.slice();
  } else {
    POSTING_HEADERS.forEach((header) => {
      if (headers.indexOf(header) === -1) {
        headers.push(header);
      }
    });
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return headers;
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

function rowToNewsletter(headers, row) {
  const entry = {};
  headers.forEach((header, index) => {
    entry[header] = row[index] !== undefined ? row[index] : '';
  });
  return {
    month: entry['Month'],
    mainFeature: entry['Main Feature'],
    mainUpcomingEvent: entry['Main Upcoming Event'],
    eventRecaps: entry['Event Recaps / Blogs'],
    volunteerHours: entry['Volunteer Monthly Hours'],
    donationNeeds: entry['Donation Needs'],
    other: entry['Other'],
    published: String(entry['Published']).toLowerCase() === 'true'
  };
}

function newsletterToRow(headers, entry) {
  const row = new Array(headers.length).fill('');
  headers.forEach((header, index) => {
    switch (header) {
      case 'Month':
        row[index] = entry.month || '';
        break;
      case 'Main Feature':
        row[index] = entry.mainFeature || '';
        break;
      case 'Main Upcoming Event':
        row[index] = entry.mainUpcomingEvent || '';
        break;
      case 'Event Recaps / Blogs':
        row[index] = entry.eventRecaps || '';
        break;
      case 'Volunteer Monthly Hours':
        row[index] = entry.volunteerHours || '';
        break;
      case 'Donation Needs':
        row[index] = entry.donationNeeds || '';
        break;
      case 'Other':
        row[index] = entry.other || '';
        break;
      case 'Published':
        row[index] = entry.published ? 'true' : 'false';
        break;
      default:
        row[index] = '';
    }
  });
  return row;
}

function rowToPosting(headers, row) {
  const entry = {};
  headers.forEach((header, index) => {
    entry[header] = row[index] !== undefined ? row[index] : '';
  });
  return {
    month: entry['Month'],
    completed: String(entry['Completed']).toLowerCase() === 'true',
    entries: entry['Entries']
  };
}

function postingToRow(headers, entry) {
  const row = new Array(headers.length).fill('');
  headers.forEach((header, index) => {
    switch (header) {
      case 'Month':
        row[index] = entry.month || '';
        break;
      case 'Completed':
        row[index] = entry.completed ? 'true' : 'false';
        break;
      case 'Entries':
        row[index] = typeof entry.entries === 'string' ? entry.entries : JSON.stringify(entry.entries || {});
        break;
      default:
        row[index] = '';
    }
  });
  return row;
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
    planningChecklist: event['Planning Checklist'],
    planningNotes: event['Planning Notes'],
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
      case 'Planning Checklist':
        row[index] = typeof event.planningChecklist === 'string'
          ? event.planningChecklist
          : JSON.stringify(event.planningChecklist || {});
        break;
      case 'Planning Notes':
        row[index] = event.planningNotes || '';
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
  const action = e && e.parameter ? e.parameter.action : '';

  if (action === 'newsletter_list') {
    const sheet = getNewsletterSheet();
    const headers = ensureNewsletterHeaders(sheet);
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, headers.length).getValues() : [];
    const entries = rows.map((row) => rowToNewsletter(headers, row));
    return buildResponse({ entries: entries });
  }

  if (action === 'posting_list') {
    const sheet = getPostingSheet();
    const headers = ensurePostingHeaders(sheet);
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, headers.length).getValues() : [];
    const entries = rows.map((row) => rowToPosting(headers, row));
    return buildResponse({ entries: entries });
  }

  const sheet = getSheet();
  const headers = ensureHeaders(sheet);

  if (action === 'list') {
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, headers.length).getValues() : [];
    const events = rows.map((row) => rowToEvent(headers, row));
    return buildResponse({ events: events });
  }

  return buildResponse({ status: 'ok' });
}

function doPost(e) {
  const payload = e && e.postData ? e.postData.contents : '';
  let data = {};
  try {
    data = payload ? JSON.parse(payload) : {};
  } catch (error) {
    return buildResponse({ status: 'error', message: 'Invalid JSON payload' });
  }

  if (data.action === 'newsletter_upsert' && data.entry) {
    const sheet = getNewsletterSheet();
    const headers = ensureNewsletterHeaders(sheet);
    const entry = data.entry || {};
    const monthValue = String(entry.month || '');
    const monthIndex = headers.indexOf('Month') + 1;
    const lastRow = sheet.getLastRow();
    let targetRow = null;
    if (lastRow > 1 && monthIndex > 0) {
      const monthValues = sheet.getRange(2, monthIndex, lastRow - 1, 1).getValues();
      for (let i = 0; i < monthValues.length; i += 1) {
        if (String(monthValues[i][0]) === monthValue) {
          targetRow = i + 2;
          break;
        }
      }
    }
    const rowValues = newsletterToRow(headers, entry);
    if (targetRow) {
      sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    return buildResponse({ status: 'saved', month: entry.month });
  }

  if (data.action === 'posting_upsert' && data.entry) {
    const sheet = getPostingSheet();
    const headers = ensurePostingHeaders(sheet);
    const entry = data.entry || {};
    const monthValue = String(entry.month || '');
    const monthIndex = headers.indexOf('Month') + 1;
    const lastRow = sheet.getLastRow();
    let targetRow = null;
    if (lastRow > 1 && monthIndex > 0) {
      const monthValues = sheet.getRange(2, monthIndex, lastRow - 1, 1).getValues();
      for (let i = 0; i < monthValues.length; i += 1) {
        if (String(monthValues[i][0]) === monthValue) {
          targetRow = i + 2;
          break;
        }
      }
    }
    const rowValues = postingToRow(headers, entry);
    if (targetRow) {
      sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    return buildResponse({ status: 'saved', month: entry.month });
  }

  const sheet = getSheet();
  const headers = ensureHeaders(sheet);

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
