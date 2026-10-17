/**
 * Calendar invite & .ics generator utility for Aora House bookings & events
 */

function formatDateToICS(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateICS({ title, description, location, startTime, endTime, url }) {
  const dtStamp = formatDateToICS(new Date());
  const dtStart = formatDateToICS(startTime);
  const dtEnd = formatDateToICS(endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000));
  const uid = `aora-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@aorahouse.com`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aora House//Calendar Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${(location || 'Aora House, Victoria Island, Lagos').replace(/\n/g, ' ')}`,
    url ? `URL:${url}` : '',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Upcoming session at Aora House',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

function generateGoogleCalendarUrl({ title, description, location, startTime, endTime }) {
  const startStr = formatDateToICS(startTime);
  const endStr = formatDateToICS(endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description || '',
    location: location || 'Aora House, Victoria Island, Lagos',
    dates: `${startStr}/${endStr}`
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

module.exports = {
  formatDateToICS,
  generateICS,
  generateGoogleCalendarUrl
};
