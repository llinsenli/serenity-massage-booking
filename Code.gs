/* ────────── CONFIG ────────── */
const FORM_ID    = 'google_form_ID';
const START_HOUR = 9;              // 9 AM
const END_HOUR   = 21;             // 9 PM
const DAYS_AHEAD = 5;              // today + 4
const YOUR_EMAIL = 'admin@gmail.com';
const SHEET_URL  = 'google_sheet_url';
const WEB_APP_URL = 'web_app_url'; // update after the set up for the web app in Deploy

/* column indexes (0‑based) */
const COL_NAME     = 1;
const COL_EMAIL    = 2;
const COL_PHONE    = 3;
const COL_DURATION = 4;
const COL_SLOT     = 5;
const COL_STATUS   = 6;   // “Status” column

/* ───────── DAILY REFRESH ───────── */
function resetWeeklyTimeSlots() {
  const form  = FormApp.openById(FORM_ID);
  const sh    = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const now   = new Date();

  const booked = new Set();
  sh.getDataRange().getValues().slice(1).forEach(r => {
    const status = (r[COL_STATUS] || '').toString().toLowerCase();
    if (!status.startsWith('book')) return;            // only if status begins “book…”
    if (!r[COL_SLOT] || isSlotInPast(r[COL_SLOT], now)) return;
    booked.add(r[COL_SLOT]);
  });

  const q = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)
                .find(it => it.getTitle().trim() === 'Select Appointment Time')
                .asMultipleChoiceItem();

  const choices = [];
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const date = new Date(now); date.setDate(now.getDate() + d);
    const dayStr = date.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
    choices.push(q.createChoice(`------ ${dayStr} ------`, false));

    for (let h = START_HOUR; h < END_HOUR; h++) {
      if (d === 0 && h <= now.getHours()) continue;
      const slot = `${dayStr} – ${fmt(h)} to ${fmt(h+1)}`;
      if (!booked.has(slot)) choices.push(q.createChoice(slot));
    }
  }
  q.setChoices(choices);
}

/* ───────── FORM SUBMISSION ───────── */
function onFormSubmit(e) {
  const slot   = e.values[COL_SLOT];
  const name   = e.values[COL_NAME];
  const email  = e.values[COL_EMAIL];
  const phone  = e.values[COL_PHONE];

  const sh  = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = sh.getLastRow();
  sh.getRange(row, COL_STATUS+1).setValue('Booked');

  const form = FormApp.openById(FORM_ID);
  const q = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)
                .find(it=>it.getTitle().trim()==='Select Appointment Time')
                .asMultipleChoiceItem();
  q.setChoices(q.getChoices().filter(c=>c.getValue()!==slot));

  const cancelLink  = `${WEB_APP_URL}?act=cancel&row=${row}`;
  const reschedLink = `${WEB_APP_URL}?act=resched&row=${row}`;

  const plainBody = `Hi ${name},

Thank you for choosing our massage studio! Your appointment is confirmed for:
${slot}

We look forward to seeing you.

Warm regards,
SERENITY Massage Studio Team

Manage your booking anytime:
• Cancel:      ${cancelLink}
• Reschedule:  ${reschedLink}`;

  const htmlBody = `
    <p>Hi ${name},</p>
    <p>Thank you for choosing our massage studio!<br>
       Your appointment has been <strong>confirmed</strong> for:</p>
    <p style="font-size:1.1em"><strong>🕒 ${slot}</strong></p>
    <p>We look forward to seeing you.</p>
    <p>Warm regards,<br>SERENITY Massage Studio Team</p>
    <hr>
    <p><strong>Manage your booking anytime:</strong><br>
       • <a href="${cancelLink}">Cancel this appointment</a><br>
       • <a href="${reschedLink}">Reschedule (choose a new time)</a></p>`;

  MailApp.sendEmail({to: email, subject:'Your Massage Appointment Confirmation',
                     body: plainBody, htmlBody: htmlBody});

  const table = getTodayTomorrowTable();
  MailApp.sendEmail({
    to: YOUR_EMAIL,
    subject: `📆 New Booking – ${slot}`,
    htmlBody: `<p><strong>${name}</strong> booked ${slot} (📞 ${phone})</p>
               <p><a href="${SHEET_URL}">Open Response Sheet</a></p>
               <h3>Today / Tomorrow</h3>${table}`
  });
}

/* ───────── WEB APP (Cancel / Reschedule) ───────── */
function doGet(e) {
  /* 1️⃣ Parse & validate parameters */
  const row = parseInt(e.parameter.row, 10);
  const act = (e.parameter.act || '').toLowerCase();        // "cancel" | "resched"
  if (!row || row <= 1 || !['cancel', 'resched'].includes(act))
    return HtmlService.createHtmlOutput('<p>Invalid request.</p>');

  /* 2️⃣ Grab the row data */
  const sh   = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sh.getRange(row, 1, 1, COL_STATUS + 1).getValues()[0];
  const name = data[COL_NAME];
  const email= data[COL_EMAIL];
  const slot = data[COL_SLOT];

  /* 3️⃣ Mark status Cancelled, refresh choices */
  sh.getRange(row, COL_STATUS + 1).setValue('Cancelled');
  resetWeeklyTimeSlots();

  /* 4️⃣ Send polite follow‑up to client (if e‑mail available) */
  if (email) {
    if (act === 'cancel') {
      MailApp.sendEmail({
        to: email,
        subject: 'Your Massage Appointment Has Been Cancelled',
        body: `Hi ${name},

Your appointment for:
${slot}

has been successfully cancelled.

We hope to welcome you another time!

Warm regards,
SERENITY Massage Studio Team`,
        htmlBody: `<p>Hi ${name},</p>
                   <p>Your appointment for:<br><strong>${slot}</strong><br>
                      has been <strong>cancelled</strong>.</p>
                   <p>We hope to welcome you another time!</p>
                   <p>Warm regards,<br>SERENITY Massage Studio Team</p>`
      });
    } else {   // reschedule
      const formUrl = FormApp.openById(FORM_ID).getPublishedUrl();
      MailApp.sendEmail({
        to: email,
        subject: 'Appointment Cancelled – Please Reschedule',
        body: `Hi ${name},

Your previous appointment for:
${slot}

has been cancelled at your request.

Please book a new time here:
${formUrl}

Warm regards,
SERENITY Massage Studio Team`,
        htmlBody: `<p>Hi ${name},</p>
                   <p>Your previous appointment for:<br><strong>${slot}</strong><br>
                      has been <strong>cancelled</strong>.</p>
                   <p>You can choose a new time here:<br>
                      <a href="${formUrl}">Reschedule your appointment</a></p>
                   <p>Warm regards,<br>SERENITY Massage Studio Team</p>`
      });
    }
  }

  /* 5️⃣ Notify admin — rich e‑mail with sheet link & mini schedule */
  const ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM d HH:mm');
  const adminSubject =
        (act === 'cancel' ? '❌ CANCELLED' : '🔄 RESCHEDULE START') +
        `  ${ts}  –  ${slot}`;

  const tableHtml = getTodayTomorrowTable();
  const adminHtml = `
    <p><strong>${name}</strong> (${email || 'no email'}) has
       ${act === 'cancel' ? '<strong>cancelled</strong>' : 'requested to <strong>reschedule</strong>'}
       the following appointment:</p>
    <p><strong>${slot}</strong></p>
    <p><a href="${SHEET_URL}">📋 Open Response Sheet</a></p>
    <h3>Today / Tomorrow</h3>
    ${tableHtml}`;

  MailApp.sendEmail({
    to:      YOUR_EMAIL,
    subject: adminSubject,
    htmlBody: adminHtml
  });

  /* 6️⃣ Return small confirmation page */
  if (act === 'cancel')
    return HtmlService.createHtmlOutput(
      '<p>Your appointment has been cancelled. Hope to see you another time!</p>');

  // resched → redirect to live form
  return HtmlService.createHtmlOutput(
    `<script>location.replace('${FormApp.openById(FORM_ID).getPublishedUrl()}');</script>
     <p>Redirecting you to the booking form so you can choose a new time…</p>`);
}

/* ───────── helpers ───────── */
function fmt(h){const hr=h%12||12;return `${hr}:00 ${h<12||h===24?'AM':'PM'}`;}

function isSlotInPast(slot, now){
  const m = slot.match(/^([A-Za-z]+),\s([A-Za-z]+)\s(\d+)/);
  if (!m) return false;
  const d = new Date(`${m[2]} ${m[3]}, ${now.getFullYear()}`);
  if (d < new Date(now.toDateString())) return true;
  const hm=slot.match(/–\s(\d+):00\s([AP]M)/);
  if (!hm) return false;
  let hr = +hm[1]; if (hm[2]==='PM'&&hr!==12)hr+=12; if(hm[2]==='AM'&&hr===12)hr=0;
  return d.toDateString()===now.toDateString() && hr<=now.getHours();
}

function getTodayTomorrowTable(){
  const sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const tz = Session.getScriptTimeZone(), now=new Date();
  const today = Utilities.formatDate(now,tz,'EEEE, MMM d');
  const tmrw  = Utilities.formatDate(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1),tz,'EEEE, MMM d');

  const rows = sh.getDataRange().getValues().slice(1).filter(r=>{
    const status=(r[COL_STATUS]||'').toString().toLowerCase();
    if(!status.startsWith('book')) return false;
    const slot=r[COL_SLOT]; if(!slot) return false;
    const slotDay = slot.split(' –')[0].trim();
    return slotDay===today||slotDay===tmrw;
  });

  if(!rows.length) return '<p><em>No bookings.</em></p>';

  const htmlRows = rows.map(r=>
    `<tr><td>${r[COL_NAME]}</td><td>${r[COL_PHONE]}</td><td>${r[COL_DURATION]}</td><td>${r[COL_SLOT]}</td></tr>`
  ).join('');
  return `<table border=1 cellpadding=6 style="border-collapse:collapse">
            <tr><th>Name</th><th>Phone</th><th>Duration</th><th>Time Slot</th></tr>
            ${htmlRows}
          </table>`;
}

/* optional admin menu */
function onOpen(){
  SpreadsheetApp.getUi()
    .createMenu('Appointments')
    .addItem('Refresh Available Slots','resetWeeklyTimeSlots')
    .addToUi();
}

/* OPTIONAL: auto‑refresh form when you edit Status cell */
function onEdit(e){
  const col=e.range.getColumn();
  const header=e.source.getActiveSheet().getRange(1,col).getValue();
  if(header==='Status') resetWeeklyTimeSlots();
}