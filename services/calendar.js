const ics = require('ics');

// ── Google Calendar deep link ─────────────────────────────────────────────────
// Returns a URL that opens Google Calendar with the event pre-filled
function buildGoogleCalendarLink({ title, description, location, startDate, endDate }) {
  const fmt = (d) => d.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     title,
    dates:    `${fmt(startDate)}/${fmt(endDate)}`,
    details:  description || '',
    location: location || 'Adora & Alora, Lagos',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── iCal / Apple Calendar file ────────────────────────────────────────────────
// Returns a Buffer containing the .ics file content
function buildICSBuffer({ uid, title, description, location, startDate, endDate, organiser }) {
  const toArr = (d) => [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
  ];

  const { error, value } = ics.createEvent({
    uid:         uid || `aa-${Date.now()}@adoraandalora.com`,
    title,
    description: description || '',
    location:    location || 'Adora & Alora, Lagos',
    start:       toArr(startDate),
    end:         toArr(endDate),
    startInputType: 'local',
    endInputType:   'local',
    organizer:   { name: 'Adora & Alora', email: process.env.MAIL_USER },
    status:      'CONFIRMED',
    busyStatus:  'BUSY',
    url:         process.env.APP_URL,
  });

  if (error) throw error;
  return Buffer.from(value, 'utf-8');
}

// ── Build both links for a booking ────────────────────────────────────────────
// Returns { google: string, icsDataUrl: string }
function buildCalendarLinks({ booking, classSession, classType, instructor }) {
  const start = new Date(classSession.startTime);
  const end   = new Date(classSession.endTime);
  const title = `${classType.name} with ${instructor.firstName} — Adora & Alora`;
  const description = `Your Pilates class is confirmed. Booking ref: ${booking._id}`;
  const location = classSession.location || 'The Studio, Adora & Alora';

  const google = buildGoogleCalendarLink({ title, description, location, startDate: start, endDate: end });

  const icsBuffer = buildICSBuffer({
    uid:         `booking-${booking._id}@adoraandalora.com`,
    title,
    description,
    location,
    startDate:   start,
    endDate:     end,
  });

  // Return as data URL so client can trigger a download without a separate endpoint
  const icsDataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsBuffer.toString())}`;

  return { google, icsDataUrl };
}

module.exports = { buildGoogleCalendarLink, buildICSBuffer, buildCalendarLinks };
