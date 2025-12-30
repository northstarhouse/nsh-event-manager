# Google Sheets Setup

This app uses a Google Apps Script web app to store and load events from the "Event Tracking" sheet.

## 1) Create the Apps Script

1. Open the Google Sheet you want to use (Event Tracking tab).
2. Go to `Extensions` -> `Apps Script`.
3. Replace the script editor contents with `apps-script.gs` from this repo.
4. Click `Save`.

## 2) Deploy as a Web App

1. Click `Deploy` -> `New deployment`.
2. Select `Web app`.
3. Set **Execute as**: `Me`.
4. Set **Who has access**: `Anyone` (or `Anyone with the link`).
5. Click `Deploy`.
6. Copy the Web App URL.

## 3) Update the App URL

Replace `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` in these files:

- `index.html`
- `events-index.html`
- `events.html`
- `event-app.html`
- `event-management-app.tsx`

## 4) Columns

The script creates or updates these headers in row 1 of the sheet:

ID, Event, Date, Time, Goals, Outcomes, Advertising, Total Spent, Total Earned, Volunteers, Notes, Target Attendance, Current RSVPs, Checklist, Flyer Image, Is TBD, Created At, Post Event Attendance, Post Event Notes

